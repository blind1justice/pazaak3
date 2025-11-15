from services.base import BaseService
from repositories.user import UserRepository

class UserService(BaseService):
    repo = UserRepository()
