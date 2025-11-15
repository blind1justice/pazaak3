from abc import ABC, abstractmethod


class AbstractRepository(ABC):
    @abstractmethod
    async def add_one(data: dict):
        raise NotImplementedError()
    
    @abstractmethod
    async def get_one():
        raise NotImplementedError()
    
    @abstractmethod
    async def get_all():
        raise NotImplementedError()
    
    @abstractmethod
    async def delete_one(id: int):
        raise NotImplementedError()
    
    @abstractmethod
    async def update_one(id: int, data: dict):
        raise NotImplementedError()
