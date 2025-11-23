from urllib.parse import parse_qs
from socketio import AsyncServer
import socketio
from utils.jwt import verify_token

sio = AsyncServer(async_mode='asgi', cors_allowed_origins=["http://localhost:4200", "http://localhost:8080"])
socket_app = socketio.ASGIApp(sio)


@sio.event
async def connect(sid, environ):
    query_string = environ.get('QUERY_STRING', '')
    query_params = parse_qs(query_string)

    room_id = query_params.get('room', [None])[0]
    jwt_token = query_params.get('jwt', [None])[0]

    user_data = verify_token(jwt_token)

    if not room_id or not jwt_token:
            await sio.disconnect(sid)
            return False
        
    user_data = verify_token(jwt_token)
    if not user_data:
        await sio.disconnect(sid)
        return False
    
    user_id = user_data['sub']
    
    await sio.save_session(sid, {'room_id': room_id, 'user_id': user_id})
    
    await sio.enter_room(sid, room_id)
    
    await sio.emit('connect', {
        'user_id': user_id,
        'message': f'User {user_id} joined the game'
    }, room=room_id, skip_sid=sid)
    
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


