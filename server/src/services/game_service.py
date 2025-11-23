from datetime import datetime
from models.enums import GameResult

from fastapi import HTTPException, status
from services.base import BaseService
from repositories.game import GameRepository
from decimal import Decimal


class GameService(BaseService):
    repo: GameRepository = GameRepository()

    async def get_pending_games(self):
        return await self.repo.get_all_games_with_players({'result': GameResult.PENDING})

    async def create_new_game(self, item, user_id):
        item_data = item.model_dump()
        item_data['player1_id'] = user_id
        item_data['reward'] = item.bid * Decimal('1.9')
        return await self.repo.add_one(item_data)

    async def connect_to_game(self, game_id, user_id):
        game = await self.repo.get_one(game_id)

        if not game:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Game is not found'
            ) 
        
        if game.player1_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can't connect to your game"
            )

        if game.player2_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Game is full'
            )

        return await self.repo.update_one(game_id, {
            'player2_id': user_id,
            'started_at': datetime.now(),
            'result': GameResult.IN_PROGRESS
        })
        

    async def add_one(self, item):
        item_data = item.model_dump()
        item_data['reward'] = item.bid * Decimal('1.9')
        return await self.repo.add_one(item_data)
