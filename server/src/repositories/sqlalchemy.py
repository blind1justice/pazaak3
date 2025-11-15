from repositories.base import AbstractRepository
from sqlalchemy import insert, select, delete, update

from db.session import async_session


class SQLAclhemyRepository(AbstractRepository):
    model = None

    async def add_one(self, data: dict):
        async with async_session() as session:
            stmt = insert(self.model).values(**data).returning(self.model)
            res = await session.execute(stmt)
            await session.commit()
            inserted_obj = res.scalar_one()
            return inserted_obj.to_read_model()  

    async def get_one(self, id: int):
        async with async_session() as session:
            query = select(self.model).where(self.model.id==id)
            res = await session.execute(query)
            row = res.one_or_none()
            if row:
                return row[0].to_read_model()
            else:
                return None

    async def get_all(self):
        async with async_session() as session:
            query = select(self.model)
            res = await session.execute(query)
            res = [row[0].to_read_model() for row in res.all()]
            return res
        
    async def delete_one(self, id: int):
        async with async_session() as session:
            query = delete(self.model).where(self.model.id==id)
            result = await session.execute(query)
            await session.commit()
            return result.rowcount > 0
        
    async def update_one(self, id: int, data: dict):
        async with async_session() as session:
            stmt = update(self.model).where(self.model.id==id).values(**data).returning(self.model)
            res = await session.execute(stmt)
            await session.commit()
            updated_obj = res.scalar_one()
            return updated_obj.to_read_model()