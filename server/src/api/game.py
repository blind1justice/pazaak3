from fastapi import APIRouter, Depends
from schemas.game import GameSchemaAdd, GameSchemaUpdate, GameSchemaCreateNew
from schemas.user import UserSchemaRead
from services.game_service import GameService
from api.dependencies import game_service, get_current_user


router = APIRouter(prefix='/api/games', tags=['Games'])


@router.post("/create")
async def create_game(
    game: GameSchemaCreateNew,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.create_new_game(game, current_user.id)
    return game


@router.post("/connect/{id}")
async def connect_to_game(
    id: int,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.connect_to_game(id, current_user.id)
    return game


@router.get("/pending")
async def get_pending_games(
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    games = await game_service.get_pending_games()
    return games
    

@router.post("")
async def add_game(
    game: GameSchemaAdd,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.add_one(game)
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
    game: GameSchemaUpdate,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    game = await game_service.update_one(id, game)
    return game


@router.delete("/{id}")
async def delete_game(
    id: int,
    current_user: UserSchemaRead = Depends(get_current_user),
    game_service: GameService = Depends(game_service)
):
    status = await game_service.delete_one(id)
    return status