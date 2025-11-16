from models import User
from repositories.sqlalchemy import SQLAclhemyRepository
from sqlalchemy import select
from db.session import async_session


class UserRepository(SQLAclhemyRepository):
    model = User

    async def get_by_nickname_and_wallet(self, nickname: str, wallet_id: str):
        async with async_session() as session:
            query = select(self.model).where(
                self.model.nickname == nickname,
                self.model.walletId == wallet_id
            )
            res = await session.execute(query)
            row = res.one_or_none()
            if row:
                return row[0]
            else:
                return None

    async def get_by_nickname(self, nickname: str):
        async with async_session() as session:
            query = select(self.model).where(self.model.nickname == nickname)
            res = await session.execute(query)
            row = res.one_or_none()
            if row:
                return row[0]
            else:
                return None

    async def get_by_wallet_id(self, wallet_id: str):
        async with async_session() as session:
            query = select(self.model).where(self.model.walletId == wallet_id)
            res = await session.execute(query)
            row = res.one_or_none()
            if row:
                return row[0]
            else:
                return None
