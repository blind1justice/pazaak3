from models import Game
from repositories.sqlalchemy import SQLAclhemyRepository
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload, joinedload
from db.session import async_session


class GameRepository(SQLAclhemyRepository):
    model = Game

    async def get_all_games_with_players(self, filters: dict = None):
        async with async_session() as session:
            query = (
                select(self.model)
                .options(
                    joinedload(self.model.player1),
                    joinedload(self.model.player2)
                )
            )
            if filters:
                conditions = []
                for key, value in filters.items():
                    if hasattr(self.model, key):
                        column = getattr(self.model, key)
                        conditions.append(column == value)
                if conditions:
                    query = query.where(and_(*conditions))
            
            res = await session.execute(query)
            games = res.unique().scalars().all()
            
            return [game.to_read_model_with_players() for game in games]
