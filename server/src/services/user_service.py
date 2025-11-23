from models.user import User
from services.base import BaseService
from repositories.user import UserRepository
from schemas.user import UserSchemaRead, AuthenticateSchema
from utils.phantom import verify_phantom_auth
from utils.jwt import create_access_token


class UserService(BaseService):
    repo: UserRepository = UserRepository()

    async def authenticate(self, auth_data: AuthenticateSchema) -> dict:
        """
        Объединенный метод для авторизации/регистрации через Phantom.
        Если пользователь существует - выполняет вход, если нет - регистрацию.
        """
        # Проверяем подпись Phantom
        verify_phantom_auth(
            message=auth_data.message,
            signature=auth_data.signature,
            public_key=auth_data.walletId
        )
        
        # Ищем пользователя по walletId
        user: User = await self.repo.get_by_wallet_id(auth_data.walletId)
        
        if user:
            # Пользователь существует - выполняем вход
            user_read = user
        else:
            # Пользователь не существует - регистрируем
            nickname = f'user_{auth_data.walletId[:6]}'
            
            # Проверяем, существует ли пользователь с таким nickname
            existing_user = await self.repo.get_by_nickname(nickname)
            if existing_user:
                # Если nickname занят, добавляем суффикс
                counter = 1
                max_attempts = 100
                while existing_user and counter < max_attempts:
                    new_nickname = f"{nickname}_{counter}"
                    existing_user = await self.repo.get_by_nickname(new_nickname)
                    if not existing_user:
                        nickname = new_nickname
                        break
                    counter += 1
                else:
                    # Если не удалось найти свободный nickname, используем walletId
                    nickname = f'user_{auth_data.walletId[:6]}'
            
            # Создаем нового пользователя
            user_dict = {
                "nickname": nickname,
                "walletId": auth_data.walletId
            }

            new_user = await self.repo.add_one(user_dict)
            user_read = new_user
            user = new_user
        
        # Создаем JWT токен
        token_data = {
            "sub": str(user.id),
            "wallet_id": user.walletId,
            "nickname": user.nickname
        }

        token = create_access_token(token_data)
        
        return {
            "user": user_read,
            "token": token
        }
