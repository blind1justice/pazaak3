from models.base import Base

from datetime import datetime
from sqlalchemy import String, DateTime
from schemas.user import UserSchemaRead
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    nickname: Mapped[str] = mapped_column(String(length=30))
    walletId: Mapped[str] = mapped_column(String(length=50))
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

    games_as_player1 = relationship('Game', foreign_keys='Game.player1_id', back_populates='player1')
    games_as_player2 = relationship('Game', foreign_keys='Game.player2_id', back_populates='player2')

    def to_read_model(self):
        return UserSchemaRead.model_validate(self)
