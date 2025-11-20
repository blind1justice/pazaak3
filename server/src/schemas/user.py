from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserSchemaAdd(BaseModel):
    nickname: str
    walletId: str


class UserSchemaUpdate(BaseModel):
    nickname: Optional[str] = None
    walletId: Optional[str] = None


class UserSchemaRead(BaseModel):
    id: int
    nickname: str
    walletId: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthenticateSchema(BaseModel):
    """Объединенная схема для авторизации/регистрации через Phantom"""
    walletId: str
    message: str  # Сообщение, которое было подписано
    signature: str  # Подпись сообщения в формате base58


class AuthResponseSchema(BaseModel):
    user: UserSchemaRead
    token: str  # JWT токен для последующих запросов
