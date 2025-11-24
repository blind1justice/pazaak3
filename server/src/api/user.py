from fastapi import APIRouter, Depends
from schemas.user import UserSchemaAdd, UserSchemaUpdate
from services.user_service import UserService
from api.dependencies import user_service

router = APIRouter(prefix='/api/users', tags=['Users'])


# @router.post("")
# async def add_user(user: UserSchemaAdd, user_service: UserService = Depends(user_service)):
#     user = await user_service.add_one(user)
#     return user


# @router.get("")
# async def get_users(user_service: UserService = Depends(user_service)):
#     users = await user_service.get_all()
#     return users


# @router.get("/{id}")
# async def get_user(id: int, user_service: UserService = Depends(user_service)):
#     user = await user_service.get_one(id)
#     return user


# @router.patch("/{id}")
# async def update_user(id: int, user: UserSchemaUpdate, user_service: UserService = Depends(user_service)):
#     status = await user_service.update_one(id, user)
#     return status


# @router.delete("/{id}")
# async def delete_user(id: int, user_service: UserService = Depends(user_service)):
#     status = await user_service.delete_one(id)
#     return status
