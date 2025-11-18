import enum


class CardType(enum.Enum):
    UserCard = 'UsedCard'
    FromCommonDeck = 'FromCommonDeck'
    Plus = 'Plus'
    Minus = 'Minus'
    PlusMinus = 'PlusMinus'
    OneOrTwoPlusMinus = 'OneOrTwoPlusMinus'
    ThreeOrFourPlusMinus = 'ThreeOrFourPlusMinus'
    FiveOrSixPlusMinus = 'FiveOrSixPlusMinus'
    AnyValue = 'AnyValue'
    OnePlusMinusWinIfDraw = 'OnePlusMinusWinIfDraw'


class PlayerState(enum.Enum):
    ActiveTurn = 'ActiveTurn'
    WaitEnemyTurn = 'WaitEnemyTurn'
    Stand = 'Stand'
