from repositories.sqlalchemy import SQLAclhemyRepository


class BaseService():
    repo: SQLAclhemyRepository = None

    async def add_one(self, item):
        item_dict = item.model_dump()
        item_id = await self.repo.add_one(item_dict)
        return item_id
    
    async def get_all(self, filters=None):
        res = await self.repo.get_with_filters(filters)
        return res
    
    async def get_one(self, id):
        res = await self.repo.get_one(id)
        return res
    
    async def delete_one(self, id):
        res = await self.repo.delete_one(id)
        return res

    async def update_one(self, id, item):
        item_dict = item.model_dump(exclude_unset=True)
        item_id = await self.repo.update_one(id, item_dict)
        return item_id
