from services.user_service import UserService
from services.game_service import GameService


def user_service():
    return UserService()


def game_service():
    return GameService()
