from models import User
from repositories.sqlalchemy import SQLAclhemyRepository


class UserRepository(SQLAclhemyRepository):
    model = User
