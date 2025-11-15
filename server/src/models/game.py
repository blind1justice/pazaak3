from datetime import datetime
from models.base import Base

from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum

from schemas.game import GameSchemaRead
from models.enums import GameResult


class Game(Base):
    __tablename__ = 'games'

    id: Mapped[int] = mapped_column(primary_key=True)
    player1_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    player2_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    result: Mapped[GameResult] = mapped_column(Enum(GameResult), default=GameResult.PENDING)
    bid: Mapped[Decimal]
    reward: Mapped[Decimal]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    player1 = relationship('User', foreign_keys=[player1_id], back_populates='games_as_player1')
    player2 = relationship('User', foreign_keys=[player2_id], back_populates='games_as_player2')


    def to_read_model(self):
        return GameSchemaRead.model_validate(self)