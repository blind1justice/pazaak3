from decimal import Decimal
from typing import List, Optional
import redis
from config.settings import settings
from redis_client.types import Deck, GameState, Card
from redis_client.enum import AnotherCardType, PlayerState


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
    
    def _get_deck_key(self, user_id: int) -> str:
        return f'deck:{user_id}'
    
    def create_game(self, game_id: int, player1_id: int, player1_name: str, player1_wallet_id: str,
                   hand1: List[Card], bid: Decimal, reward: Decimal) -> bool:
        game_state = GameState(
            gameId=game_id,
            player1Id=player1_id,
            player1Name=player1_name,
            player1WalletId=player1_wallet_id,
            hand1=hand1,
            Player1State=PlayerState.ActiveTurn,
            Player2State=PlayerState.WaitEnemyTurn,
            bid=bid,
            reward=reward
        )
        
        return self.update_game_state(game_id, game_state)
    
    def connect_to_game(self, game_id: int, player2_id: int, player2_name: str, player2_wallet_id: str,
                        hand2: List[Card]) -> bool:

        game_state = self.get_game_state(game_id)
        game_state.player2Id = player2_id
        game_state.player2Name = player2_name
        game_state.player2WalletId = player2_wallet_id
        game_state.hand2 = hand2

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
        
    def get_game_state(self, game_id: int):
        key = self._get_game_key(game_id)
        data = self.redis.get(key)
        
        if not data:
            return None
        
        try:
            return GameState.model_validate_json(data)
        except Exception as e:
            print(f'Error parsing game state: {e}')
            return None
        
    def update_deck(self, user, cards: List[AnotherCardType]):
        key = self._get_deck_key(user.id)
        # collection_service = CollectionService()
        # collection = collection_service.get_collection(user)
        if len(cards) != 10:
            return False
        deck = Deck(
            player1Id=user.id, 
            player1Name=user.nickname, 
            player1WalletId=user.walletId,
            cards=cards
        )
        try:
            self.redis.set(key, deck.model_dump_json())
            return True
        except Exception as e:
            print(f'Error updating deck: {e}')
            return False
        
    def get_deck(self, user):
        key = self._get_deck_key(user.id)
        data = self.redis.get(key)
        
        if not data:
            return None
        
        try:
            return Deck.model_validate_json(data)
        except Exception as e:
            print(f'Error parsing deck: {e}')
            return None
