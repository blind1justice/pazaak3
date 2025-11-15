import enum

class GameResult(enum.Enum):
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    PLAYER1_WON = 'player1_won'
    PLAYER2_WON = 'player2_won'
    CANCELED = 'canceled'