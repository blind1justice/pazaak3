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


class AnotherCardType(enum.Enum):
    Plus1 = 'Plus1'
    Plus2 = 'Plus2'
    Plus3 = 'Plus3'
    Plus4 = 'Plus4'
    Plus5 = 'Plus5'
    Plus6 = 'Plus6'

    Minus1 = 'Minus1'
    Minus2 = 'Minus2'
    Minus3 = 'Minus3'
    Minus4 = 'Minus4'
    Minus5 = 'Minus5'
    Minus6 = 'Minus6'

    PlusMinus1 = 'PlusMinus1'
    PlusMinus2 = 'PlusMinus2'
    PlusMinus3 = 'PlusMinus3'
    PlusMinus4 = 'PlusMinus4'
    PlusMinus5 = 'PlusMinus5'
    PlusMinus6 = 'PlusMinus6'

    OneOrTwoPlusMinus = 'OneOrTwoPlusMinus'
    ThreeOrFourPlusMinus = 'ThreeOrFourPlusMinus'
    FiveOrSixPlusMinus = 'FiveOrSixPlusMinus'

    AnyValue = 'AnyValue' 


class PlayerState(enum.Enum):
    Initial = 'Initial'
    ReadyToStartGame = 'ReadyToStartGame'
    ActiveTurn = 'ActiveTurn'
    PlayedCard = 'PlayedCard'
    WaitEnemyTurn = 'WaitEnemyTurn'
    Stand = 'Stand'
    Won = 'Won'
    Lost = 'Lost'
