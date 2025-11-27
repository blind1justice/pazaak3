from typing import List, Optional

from pydantic import BaseModel, Field, computed_field
from redis_client.enum import CardType, PlayerState


class Card(BaseModel):
    type: CardType
    value: int = Field(ge=0)
    state: int = Field(ge=0)
    number_of_states: int = Field(ge=1)


class GameState(BaseModel):
    player1Id: int
    player2Id: Optional[int] = None
    player1Name: str
    player2Name: Optional[str] = None
    hand1: List[Card]
    hand2: List[Card] = []
    board1: List[Card] = []
    board2: List[Card] = []
    roundPoint1: int = Field(ge=0, le=3, default=0)
    roundPoint2: int = Field(ge=0, le=3, default=0)
    Player1State: PlayerState = PlayerState.ActiveTurn
    Player2State: PlayerState = PlayerState.WaitEnemyTurn

    @computed_field
    @property
    def board1sum(self) -> int:
        return sum(map(lambda x: x.value, self.board1))
    
    @computed_field
    @property
    def board2sum(self) -> int:
        return sum(map(lambda x: x.value, self.board2))
