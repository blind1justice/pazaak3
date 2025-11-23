from fastapi import APIRouter, Depends
from schemas.game import GameSchemaAdd, GameSchemaUpdate
from schemas.user import UserSchemaRead
from services.game_service import GameService
from api.dependencies import game_service, get_current_user


router = APIRouter(prefix='/api/games', tags=['Games'])


@router.post("")
async def add_game(
    user: GameSchemaAdd,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.add_one(user)
    return game


@router.get("")
async def get_games(
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    games = await game_service.get_all()
    return games


@router.get("/{id}")
async def get_game(
    id: int,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.get_one(id)
    return game


@router.patch("/{id}")
async def update_game(
    id: int,
    user: GameSchemaUpdate,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.update_one(id, user)
    return game


@router.delete("/{id}")
async def delete_game(
    id: int,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    status = await game_service.delete_one(id)
    return status