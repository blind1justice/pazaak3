from services.base import BaseService
from repositories.user import UserRepository
from schemas.user import UserAuthSchema, UserSchemaRead
from utils.jwt import create_access_token
from fastapi import HTTPException, status


class UserService(BaseService):
    repo = UserRepository()

    async def register(self, user_data: UserAuthSchema) -> dict:
        # Проверяем, существует ли пользователь с таким nickname
        existing_user = await self.repo.get_by_nickname(user_data.nickname)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this nickname already exists"
            )
        
        # Создаем нового пользователя
        user_dict = user_data.model_dump()
        new_user = await self.repo.add_one(user_dict)
        
        # Создаем токен
        access_token = create_access_token(data={"sub": str(new_user.id), "nickname": new_user.nickname})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }

    async def login(self, user_data: UserAuthSchema) -> dict:
        # Ищем пользователя по nickname и walletId
        user = await self.repo.get_by_nickname_and_wallet(user_data.nickname, user_data.walletId)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid nickname or walletId"
            )
        
        # Создаем токен
        user_read = user.to_read_model()
        access_token = create_access_token(data={"sub": str(user_read.id), "nickname": user_read.nickname})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_read
        }
