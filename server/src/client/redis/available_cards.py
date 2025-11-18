from client.redis.types import Card
from client.redis.enum import CardType


available_cards = {
    'common1': Card(CardType.FromCommonDeck, 1, 0, 1),
    'common2': Card(CardType.FromCommonDeck, 1, 0, 1),
    'common3': Card(CardType.FromCommonDeck, 1, 0, 1),
    'common4': Card(CardType.FromCommonDeck, 1, 0, 1),
    'common5': Card(CardType.FromCommonDeck, 1, 0, 1),
    'common6': Card(CardType.FromCommonDeck, 1, 0, 1),

    'plus1': Card(CardType.Plus, 1, 0, 1),
    'plus2': Card(CardType.Plus, 2, 0, 1),
    'plus3': Card(CardType.Plus, 3, 0, 1),
    'plus4': Card(CardType.Plus, 4, 0, 1),
    'plus5': Card(CardType.Plus, 5, 0, 1),
    'plus6': Card(CardType.Plus, 6, 0, 1),

    'minus1': Card(CardType.Minus, 1, 0, 1),
    'minus2': Card(CardType.Minus, 2, 0, 1),
    'minus3': Card(CardType.Minus, 3, 0, 1),
    'minus4': Card(CardType.Minus, 4, 0, 1),
    'minus5': Card(CardType.Minus, 5, 0, 1),
    'minus6': Card(CardType.Minus, 6, 0, 1),

    'plus_minus1': Card(CardType.PlusMinus, 1, 0, 2),
    'plus_minus2': Card(CardType.PlusMinus, 2, 0, 2),
    'plus_minus3': Card(CardType.PlusMinus, 3, 0, 2),
    'plus_minus4': Card(CardType.PlusMinus, 4, 0, 2),
    'plus_minus5': Card(CardType.PlusMinus, 5, 0, 2),
    'plus_minus6': Card(CardType.PlusMinus, 6, 0, 2),

    'one_or_two_plus_minus': Card(CardType.OneOrTwoPlusMinus, 1, 0, 4),
    'three_or_four_plus_minus': Card(CardType.ThreeOrFourPlusMinus, 3, 0, 4),
    'five_or_six_plus_minus': Card(CardType.FiveOrSixPlusMinus, 5, 0, 4),
    
    'any_value': Card(CardType.AnyValue, 1, 0, 12)
}