from redis_client.types import Card
from redis_client.enum import CardType


blank_card = Card(type=CardType.UsedCard, value=0, state=0, number_of_states=1)

common_cards = {
    'Common1': Card(type=CardType.FromCommonDeck, value=1, state=0, number_of_states=1),
    'Common2': Card(type=CardType.FromCommonDeck, value=2, state=0, number_of_states=1),
    'Common3': Card(type=CardType.FromCommonDeck, value=3, state=0, number_of_states=1),
    'Common4': Card(type=CardType.FromCommonDeck, value=4, state=0, number_of_states=1),
    'Common5': Card(type=CardType.FromCommonDeck, value=5, state=0, number_of_states=1),
    'Common6': Card(type=CardType.FromCommonDeck, value=6, state=0, number_of_states=1),
    'Common7': Card(type=CardType.FromCommonDeck, value=7, state=0, number_of_states=1),
    'Common8': Card(type=CardType.FromCommonDeck, value=8, state=0, number_of_states=1),
    'Common9': Card(type=CardType.FromCommonDeck, value=9, state=0, number_of_states=1),
    'Common10': Card(type=CardType.FromCommonDeck, value=10, state=0, number_of_states=1),
}


simple_cards = {
    'Plus1': Card(type=CardType.Plus, value=1, state=0, number_of_states=1),
    'Plus2': Card(type=CardType.Plus, value=2, state=0, number_of_states=1),
    'Plus3': Card(type=CardType.Plus, value=3, state=0, number_of_states=1),
    'Plus4': Card(type=CardType.Plus, value=4, state=0, number_of_states=1),
    'Plus5': Card(type=CardType.Plus, value=5, state=0, number_of_states=1),
    'Plus6': Card(type=CardType.Plus, value=6, state=0, number_of_states=1),
    'Plus1': Card(type=CardType.Plus, value=1, state=0, number_of_states=1),
    'Plus2': Card(type=CardType.Plus, value=2, state=0, number_of_states=1),
    'Plus3': Card(type=CardType.Plus, value=3, state=0, number_of_states=1),
    'Plus4': Card(type=CardType.Plus, value=4, state=0, number_of_states=1),
    'Plus5': Card(type=CardType.Plus, value=5, state=0, number_of_states=1),
    'Plus6': Card(type=CardType.Plus, value=6, state=0, number_of_states=1),

    'Minus1': Card(type=CardType.Minus, value=1, state=0, number_of_states=1),
    'Minus2': Card(type=CardType.Minus, value=2, state=0, number_of_states=1),
    'Minus3': Card(type=CardType.Minus, value=3, state=0, number_of_states=1),
    'Minus4': Card(type=CardType.Minus, value=4, state=0, number_of_states=1),
    'Minus5': Card(type=CardType.Minus, value=5, state=0, number_of_states=1),
    'Minus6': Card(type=CardType.Minus, value=6, state=0, number_of_states=1),
}


available_cards = {
    'Plus1': Card(type=CardType.Plus, value=1, state=0, number_of_states=1),
    'Plus2': Card(type=CardType.Plus, value=2, state=0, number_of_states=1),
    'Plus3': Card(type=CardType.Plus, value=3, state=0, number_of_states=1),
    'Plus4': Card(type=CardType.Plus, value=4, state=0, number_of_states=1),
    'Plus5': Card(type=CardType.Plus, value=5, state=0, number_of_states=1),
    'Plus6': Card(type=CardType.Plus, value=6, state=0, number_of_states=1),

    'Minus1': Card(type=CardType.Minus, value=1, state=0, number_of_states=1),
    'Minus2': Card(type=CardType.Minus, value=2, state=0, number_of_states=1),
    'Minus3': Card(type=CardType.Minus, value=3, state=0, number_of_states=1),
    'Minus4': Card(type=CardType.Minus, value=4, state=0, number_of_states=1),
    'Minus5': Card(type=CardType.Minus, value=5, state=0, number_of_states=1),
    'Minus6': Card(type=CardType.Minus, value=6, state=0, number_of_states=1),

    'PlusMinus1': Card(type=CardType.PlusMinus, value=1, state=0, number_of_states=2),
    'PlusMinus2': Card(type=CardType.PlusMinus, value=2, state=0, number_of_states=2),
    'PlusMinus3': Card(type=CardType.PlusMinus, value=3, state=0, number_of_states=2),
    'PlusMinus4': Card(type=CardType.PlusMinus, value=4, state=0, number_of_states=2),
    'PlusMinus5': Card(type=CardType.PlusMinus, value=5, state=0, number_of_states=2),
    'PlusMinus6': Card(type=CardType.PlusMinus, value=6, state=0, number_of_states=2),

    'OneOrTwoPlusMinus': Card(type=CardType.OneOrTwoPlusMinus, value=1, state=0, number_of_states=4),
    'ThreeOrFourPlusMinus': Card(type=CardType.ThreeOrFourPlusMinus, value=3, state=0, number_of_states=4),
    'FiveOrSixPlusMinus': Card(type=CardType.FiveOrSixPlusMinus, value=5,state= 0, number_of_states=4),
    
    'AnyValue': Card(type=CardType.AnyValue, value=1, state=0, number_of_states=12)
}
