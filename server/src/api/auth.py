from fastapi import APIRouter, Depends
from schemas.user import UserAuthSchema, TokenSchema
from services.user_service import UserService
from api.depedencies import user_service

router = APIRouter(prefix='/api/auth', tags=['Auth'])


@router.post("/register", response_model=TokenSchema)
async def register(
    user_data: UserAuthSchema,
    user_service: UserService = Depends(user_service)
):
    """
    Регистрация нового пользователя.
    Принимает nickname и walletId, создает пользователя и возвращает JWT токен.
    """
    return await user_service.register(user_data)


@router.post("/login", response_model=TokenSchema)
async def login(
    user_data: UserAuthSchema,
    user_service: UserService = Depends(user_service)
):
    """
    Вход пользователя.
    Принимает nickname и walletId, проверяет их и возвращает JWT токен.
    """
    return await user_service.login(user_data)

