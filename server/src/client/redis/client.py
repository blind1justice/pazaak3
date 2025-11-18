from typing import List, Optional
import redis
from config.settings import settings
from client.redis.types import GameState, Card
from client.redis.enum import PlayerState
import json


class RedisClient:
    def __init__(self):
        self.redis = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password,
            decode_responses=True
        )

    def _get_game_key(self, game_id: int) -> str:
        return f'game:{game_id}'
    
    def create_game(self, game_id: int, player1_id: int, player2_id: int, player1_name: str, player2_name: str,
                   hand1: List[Card], hand2: List[Card]) -> bool:
        game_state = GameState(
            player1Id=player1_id,
            player2Id=player2_id,
            player1Name=player1_name,
            player2Name=player2_name,
            hand1=hand1,
            hand2=hand2,
            board1=[],
            board2=[],
            roundPoint1=0,
            roundPoint2=0,
            Player1State=PlayerState.ActiveTurn,
            Player2State=PlayerState.WaitEnemyTurn
        )
        
        return self.update_game_state(game_id, game_state)
    
    def update_game_state(self, game_id: int, game_state: GameState) -> bool:
        key = self._get_game_key(game_id)
        game_dict = game_state.model_dump_json()
        
        try:
            self.redis.set(key, game_dict)
            return True
        except Exception as e:
            print(f'Error updating game state: {e}')
            return False
        
    def get_game_state(self, game_id: int) -> Optional[GameState]:
        key = self._get_game_key(game_id)
        data = self.redis.get(key)
        
        if not data:
            return None
        
        try:
            return GameState.model_validate_json(data)
        except Exception as e:
            print(f'Error parsing game state: {e}')
            return None
    
    
