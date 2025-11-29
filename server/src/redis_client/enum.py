import enum


class CardType(enum.Enum):
    UsedCard = 'UsedCard'
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
    Initial = 'Initial'
    ReadyToStartGame = 'ReadyToStartGame'
    ActiveTurn = 'ActiveTurn'
    PlayedCard = 'PlayedCard'
    WaitEnemyTurn = 'WaitEnemyTurn'
    Stand = 'Stand'
