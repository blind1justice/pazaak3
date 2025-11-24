from urllib.parse import parse_qs
from socketio import AsyncServer
import socketio
from utils.jwt import verify_token
from services.game_service import GameService
from models.game import GameResult
from services.user_service import UserService
from redis_client.client import RedisClient
from schemas.game import GameSchemaUpdate
from redis_client.available_cards import available_cards, common_cards
from random import sample


sio = AsyncServer(async_mode='asgi', cors_allowed_origins=["http://localhost:4200", "http://localhost:8080"])
socket_app = socketio.ASGIApp(sio)


@sio.event
async def connect(sid, environ):
    query_string = environ.get('QUERY_STRING', '')
    query_params = parse_qs(query_string)

    room_id = int(query_params.get('room', [None])[0])
    jwt_token = query_params.get('jwt', [None])[0]

    user_data = verify_token(jwt_token)

    if not room_id or not jwt_token:
        await sio.disconnect(sid)
        return False
        
    user_data = verify_token(jwt_token)
    if not user_data:
        await sio.disconnect(sid)
        return False
    
    user_id = int(user_data['sub'])

    game_service = GameService()

    game = await game_service.get_one(room_id)
    if (game.player1_id != user_id and game.player2_id != user_id) or game.result not in [GameResult.PENDING, GameResult.IN_PROGRESS]:
        await sio.disconnect(sid)
        return False
    
    user_service = UserService()
    user = await user_service.get_one(user_id)

    await sio.save_session(sid, {'room_id': room_id, 'user_id': user_id})
    
    await sio.enter_room(sid, room_id)

    redis_client = RedisClient()

    # clients_in_room = sio.manager.rooms['/'].get(room_id)

    if not redis_client.get_game_state(room_id):
        redis_client.create_game(room_id, user_id, user.nickname, sample(list(available_cards.values()), 4))
    elif not redis_client.get_game_state(room_id).player2Id:
        redis_client.connect_to_game(room_id, user_id, user.nickname, sample(list(available_cards.values()), 4))
        await game_service.update_one(room_id, GameSchemaUpdate(result=GameResult.IN_PROGRESS))
        await sio.emit('game_started', {
            'your_id': user_id,
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, room=room_id)
    else:
        await sio.emit('reconnected', {
            'user_id': user_id,
            'message': f'User {user_id} reconnected the game'
        }, room=room_id, skip_sid=sid)
        await sio.emit('current_state', {
            'your_id': user_id,
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, to=sid)
    
    print(f"Client {sid} connected to room {room_id}")


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    room_id = session.get('room_id')
    user_id = session.get('user_id')
    
    if room_id:
        await sio.emit('user_left', {
            'user_id': user_id,
            'message': f'User {user_id} left the game'
        }, room=room_id, skip_sid=sid)
        
        await sio.leave_room(sid, room_id)
    
    print(f"Client {sid} disconnected")


@sio.event
async def chat_message(sid, data):
    try:
        session = await sio.get_session(sid)
        room_id = session.get('room_id')
        user_id = session.get('user_id')
        
        if not room_id:
            return
        
        message = data.get('message', '').strip()
        if not message:
            return
        
        await sio.emit('new_message', {
            'user_id': user_id,
            'message': message,
        }, room=room_id)
        
        print(f"Chat message from {user_id} in room {room_id}: {message}")
        
    except Exception as e:
        print(f"Chat message error: {e}")
