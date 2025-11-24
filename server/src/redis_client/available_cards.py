from redis_client.types import Card
from redis_client.enum import CardType


common_cards = {
    'common1': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'common2': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'common3': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'common4': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'common5': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'common6': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
}

available_cards = {
    'plus1': Card(type=CardType.Plus, value=1, state=0, number_of_states=1),
    'plus2': Card(type=CardType.Plus, value=2, state=0, number_of_states=1),
    'plus3': Card(type=CardType.Plus, value=3, state=0, number_of_states=1),
    'plus4': Card(type=CardType.Plus, value=4, state=0, number_of_states=1),
    'plus5': Card(type=CardType.Plus, value=5, state=0, number_of_states=1),
    'plus6': Card(type=CardType.Plus, value=6, state=0, number_of_states=1),

    'minus1': Card(type=CardType.Minus, value=1, state=0, number_of_states=1),
    'minus2': Card(type=CardType.Minus, value=2, state=0, number_of_states=1),
    'minus3': Card(type=CardType.Minus, value=3, state=0, number_of_states=1),
    'minus4': Card(type=CardType.Minus, value=4, state=0, number_of_states=1),
    'minus5': Card(type=CardType.Minus, value=5, state=0, number_of_states=1),
    'minus6': Card(type=CardType.Minus, value=6, state=0, number_of_states=1),

    'plus_minus1': Card(type=CardType.PlusMinus, value=1, state=0, number_of_states=2),
    'plus_minus2': Card(type=CardType.PlusMinus, value=2, state=0, number_of_states=2),
    'plus_minus3': Card(type=CardType.PlusMinus, value=3, state=0, number_of_states=2),
    'plus_minus4': Card(type=CardType.PlusMinus, value=4, state=0, number_of_states=2),
    'plus_minus5': Card(type=CardType.PlusMinus, value=5, state=0, number_of_states=2),
    'plus_minus6': Card(type=CardType.PlusMinus, value=6, state=0, number_of_states=2),

    'one_or_two_plus_minus': Card(type=CardType.OneOrTwoPlusMinus, value=1, state=0, number_of_states=4),
    'three_or_four_plus_minus': Card(type=CardType.ThreeOrFourPlusMinus, value=3, state=0, number_of_states=4),
    'five_or_six_plus_minus': Card(type=CardType.FiveOrSixPlusMinus, value=5,state= 0, number_of_states=4),
    
    'any_value': Card(type=CardType.AnyValue, value=1, state=0, number_of_states=12)
}


all_cards = {**common_cards, **available_cards}
