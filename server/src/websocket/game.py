from urllib.parse import parse_qs
from socketio import AsyncServer
import socketio
from utils.jwt import verify_token
from services.game_service import GameService
from models.game import GameResult
from services.user_service import UserService
from redis_client.client import RedisClient
from redis_client.enum import CardType, PlayerState
from schemas.game import GameSchemaUpdate
from redis_client.available_cards import available_cards, common_cards, blank_card
from random import sample, choice


sio = AsyncServer(async_mode='asgi', cors_allowed_origins=["http://localhost:4200", "http://localhost:8080"])
socket_app = socketio.ASGIApp(sio)


def _get_card_from_common_deck(is_first_player: bool, room_id):
    card = choice(list(common_cards.values()))
    redis_client = RedisClient()
    game_state = redis_client.get_game_state(room_id)
    if is_first_player:
        game_state.board1.append(card)
    else:
        game_state.board2.append(card)
    redis_client.update_game_state(room_id, game_state)


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

    
    await sio.enter_room(sid, room_id)

    redis_client = RedisClient()

    # clients_in_room = sio.manager.rooms['/'].get(room_id)

    if not redis_client.get_game_state(room_id):
        await sio.save_session(sid, {'room_id': room_id, 'user_id': user_id, 'is_first_player': True})
        redis_client.create_game(room_id, user_id, user.nickname, sample(list(available_cards.values()), 4))
    elif not redis_client.get_game_state(room_id).player2Id:
        redis_client.connect_to_game(room_id, user_id, user.nickname, sample(list(available_cards.values()), 4))
        await sio.save_session(sid, {'room_id': room_id, 'user_id': user_id, 'is_first_player': False})
        await game_service.update_one(room_id, GameSchemaUpdate(result=GameResult.IN_PROGRESS))
        await sio.emit('game_started', {
            'your_id': user_id,
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, room=room_id)
        _get_card_from_common_deck(True, room_id)
        await sio.emit('current_state', {
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, room=room_id)
    else:
        await sio.emit('reconnected', {
            'user_id': user_id,
            'message': f'User {user_id} reconnected the game'
        }, room=room_id, skip_sid=sid)
        await sio.emit('current_state', {
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
async def play_card(sid, data):
    try:
        session = await sio.get_session(sid)
        room_id = session.get('room_id')
        user_id = session.get('user_id')
        is_first_player = session.get('is_first_player')

        if not room_id:
            return
        
        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        if is_first_player and game_state.Player1State != PlayerState.ActiveTurn:
            return
        
        if not is_first_player and game_state.Player2State != PlayerState.ActiveTurn:
            return 
        
        card_index = int(data.get('index'))
        if card_index > 3 or card_index < 0:
            return
        if is_first_player and game_state.hand1[card_index].type == CardType.UsedCard:
            return
        if not is_first_player and game_state.hand2[card_index].type == CardType.UsedCard:
            return

        if is_first_player:
            card = game_state.hand1[card_index]
            game_state.hand1[card_index] = blank_card
            game_state.board1.append(card)
            game_state.Player1State = PlayerState.PlayedCard
            redis_client.update_game_state(room_id, game_state)
        else:
            card = game_state.hand2[card_index]
            game_state.hand2[card_index] = blank_card
            game_state.board2.append(card)
            game_state.Player2State = PlayerState.PlayedCard
            redis_client.update_game_state(room_id, game_state)

        await sio.emit('current_state', {
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, room=room_id)

    except Exception as e:
        print(f"Play card error: {e}")  


@sio.event
async def end_turn(sid):
    try:
        session = await sio.get_session(sid)
        room_id = session.get('room_id')
        user_id = session.get('user_id')
        is_first_player = session.get('is_first_player')

        if not room_id:
            return
        
        redis_client = RedisClient()
        game_state = redis_client.get_game_state(room_id)

        if is_first_player and game_state.Player1State not in [PlayerState.ActiveTurn, PlayerState.PlayedCard]:
            return
        
        if not is_first_player and game_state.Player2State not in [PlayerState.ActiveTurn, PlayerState.PlayedCard]:
            return 

        if is_first_player:
            game_state.Player1State = PlayerState.WaitEnemyTurn
            game_state.Player2State = PlayerState.ActiveTurn
            redis_client.update_game_state(room_id, game_state)
            _get_card_from_common_deck(not is_first_player, room_id)
        else:
            game_state.Player1State = PlayerState.ActiveTurn
            game_state.Player2State = PlayerState.WaitEnemyTurn
            redis_client.update_game_state(room_id, game_state)
            _get_card_from_common_deck(not is_first_player, room_id)

        await sio.emit('current_state', {
            'game_state': redis_client.get_game_state(room_id).model_dump_json()
        }, room=room_id)

    except Exception as e:
        print(f"Play card error: {e}")  
