from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api import user, game, auth
from client.redis.client import RedisClient 
from client.redis.types import Card
from client.redis.enum import CardType


app = FastAPI()

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8080"],  # Добавьте нужные origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(game.router)
app.include_router(auth.router)


@app.get('/')
def check():
    client = RedisClient()
    client.create_game(
        10, 5, 6, 'qwe', 'qwe1', 
        [
            Card(CardType.Plus, 1, 0)
        ], 
        [

        ])
    return "Ok"

@app.get('/{id}')
def get_redis_data_by_key(id: int):
    client = RedisClient()
    res = client.get_game_state(id)
    return res 


if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8000, reload=True)

