from fastapi import APIRouter, Depends
from schemas.user import AuthResponseSchema, AuthenticateSchema, UserSchemaRead
from services.user_service import UserService
from api.dependencies import get_current_user, user_service

router = APIRouter(prefix='/api/auth', tags=['Auth'])


@router.post("/authenticate", response_model=AuthResponseSchema)
async def authenticate(
    auth_data: AuthenticateSchema,
    user_service: UserService = Depends(user_service)
):
    """
    Объединенный эндпоинт для авторизации/регистрации через Phantom.
    Если пользователь существует - выполняет вход, если нет - регистрацию.
    Принимает walletId, message, signature и опциональный nickname.
    """
    return await user_service.authenticate(auth_data)


@router.get("/me")
async def me(
    current_user: UserSchemaRead = Depends(get_current_user),
    user_service: UserService = Depends(user_service)
):
    return current_user