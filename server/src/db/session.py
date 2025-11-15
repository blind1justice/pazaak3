from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from contextlib import asynccontextmanager

from config.settings import settings


engine = create_async_engine(
    settings.database_url, 
    echo=True,
    pool_size=5
)


async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)


@asynccontextmanager
async def get_async_session():
    async with async_session() as session:
        yield session
