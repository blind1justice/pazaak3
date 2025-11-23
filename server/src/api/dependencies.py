from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.user_service import UserService
from services.game_service import GameService
from utils.jwt import verify_token
from schemas.user import UserSchemaRead


security = HTTPBearer()


def user_service():
    return UserService()


def game_service():
    return GameService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service: UserService = Depends(user_service)
) -> UserSchemaRead:
    """
    Dependency для проверки JWT токена и получения текущего пользователя.
    Требует заголовок:
    - Authorization: JWT токен в формате 'Bearer <token>'
    """
    # Извлекаем токен из заголовка Authorization
    token = credentials.credentials
    
    # Проверяем JWT токен
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Извлекаем wallet_id из токена
    wallet_id = payload.get("wallet_id")
    if not wallet_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ищем пользователя по walletId
    user = await user_service.repo.get_by_wallet_id(wallet_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
