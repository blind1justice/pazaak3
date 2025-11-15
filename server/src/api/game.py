from fastapi import APIRouter, Depends
from schemas.game import GameSchemaAdd, GameSchemaUpdate
from services.game_service import GameService
from api.depedencies import game_service


router = APIRouter(prefix='/api/games', tags=['Games'])


@router.post("")
async def add_game(user: GameSchemaAdd, game_service: GameService = Depends(game_service)):
    game = await game_service.add_one(user)
    return game


@router.get("")
async def get_games(game_service: GameService = Depends(game_service)):
    games = await game_service.get_all()
    return games


@router.get("/{id}")
async def get_game(id: int, game_service: GameService = Depends(game_service)):
    game = await game_service.get_one(id)
    return game


@router.patch("/{id}")
async def update_game(id:int, user: GameSchemaUpdate, game_service: GameService = Depends(game_service)):
    game = await game_service.update_one(id, user)
    return game


@router.delete("/{id}")
async def delete_game(id: int, game_service: GameService = Depends(game_service)):
    status = await game_service.delete_one(id)
    return status