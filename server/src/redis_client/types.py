import time
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field
from redis_client.enum import CardType, PlayerState



class Card(BaseModel):
    type: CardType
    value: int = Field()
    state: int = Field(ge=0)
    number_of_states: int = Field(ge=1)

    def change_state(self):
        self.state = (self.state + 1) % self.number_of_states
        match (self.type):
            case CardType.PlusMinus:
                self.value *= -1
            case CardType.OneOrTwoPlusMinus:
                if self.state == 0:
                    self.value = 1
                elif self.state == 1:
                    self.value = 2
                elif self.state == 2:
                    self.value = -1
                elif self.state == 3:
                    self.value = -2
            case CardType.ThreeOrFourPlusMinus:
                if self.state == 0:
                    self.value = 3
                elif self.state == 1:
                    self.value = 4
                elif self.state == 2:
                    self.value = -3
                elif self.state == 3:
                    self.value = -4
            case CardType.FiveOrSixPlusMinus:
                if self.state == 0:
                    self.value = 5
                elif self.state == 1:
                    self.value = 6
                elif self.state == 2:
                    self.value = -5
                elif self.state == 3:
                    self.value = -6
            case CardType.AnyValue:
                if 0 <= self.state <= 5:
                    self.value = self.state + 1
                elif 6 <= self.state <= 11:
                    self.value = -(self.state - 5)
            

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
    Player1State: PlayerState = PlayerState.Initial
    Player2State: PlayerState = PlayerState.Initial

    turnEndTime: float = Field(default_factory=lambda: time.time() + 60)

    @computed_field
    @property
    def board1sum(self) -> int:
        return sum(map(lambda x: x.value, self.board1))
    
    @computed_field
    @property
    def board2sum(self) -> int:
        return sum(map(lambda x: x.value, self.board2))
