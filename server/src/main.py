from fastapi import FastAPI
import uvicorn
from api import user, game

app = FastAPI()
app.include_router(user.router)
app.include_router(game.router)


@app.get('/')
def check():
    return "Ok"


if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8000, reload=True)

