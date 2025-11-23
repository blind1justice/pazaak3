from datetime import datetime
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional
from models.enums import GameResult
from schemas.user import UserSchemaRead


class GameSchemaCreateNew(BaseModel):
    bid: Decimal


class GameSchemaAdd(BaseModel):
    player1_id: int
    player2_id: Optional[int] = None
    bid: Decimal
    result: Optional[GameResult] = GameResult.PENDING
    started_at: Optional[datetime] = None


class GameSchemaUpdate(BaseModel):
    player1_id: Optional[int] = None
    player2_id: Optional[int] = None
    bid: Optional[Decimal] = None
    reward: Optional[Decimal] = None
    result: Optional[GameResult] = None
    started_at: Optional[datetime] = None


class GameSchemaRead(BaseModel):
    id: int
    player1_id: int
    player2_id: Optional[int] = None
    result: GameResult
    bid: Decimal
    reward: Decimal
    created_at: Optional[datetime]
    updated_at: datetime
    started_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GameSchemaWithPlayersRead(BaseModel):
    id: int
    player1: UserSchemaRead
    player2: Optional[UserSchemaRead] = None
    result: GameResult
    bid: Decimal
    reward: Decimal
    created_at: Optional[datetime]
    updated_at: datetime
    started_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
