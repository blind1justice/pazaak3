from services.base import BaseService
from repositories.game import GameRepository
from decimal import Decimal

class GameService(BaseService):
    repo = GameRepository()

    async def add_one(self, item):
        item_data = item.model_dump()
        item_data['reward'] = item.bid * Decimal('1.9')
        return await self.repo.add_one(item_data)
