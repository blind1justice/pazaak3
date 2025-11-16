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


class UserAuthSchema(BaseModel):
    nickname: str
    walletId: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchemaRead
