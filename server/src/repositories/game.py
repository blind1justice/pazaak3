from models import Game
from repositories.sqlalchemy import SQLAclhemyRepository


class GameRepository(SQLAclhemyRepository):
    model = Game