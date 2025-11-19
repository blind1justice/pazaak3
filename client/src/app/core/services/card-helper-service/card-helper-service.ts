import { Injectable } from '@angular/core';
import { CardType } from '../../models/game/card-type';
import { Card } from '../../models/game/card';

@Injectable({
  providedIn: 'root',
})
export class CardHelperService {
  getCardImagePath(card: Card): string {
    if (card.type === CardType.UsedCard) {
      return '';
    } else if (card.type === CardType.FromCommonDeck) {
      return 'assets/cards/common-card.png';
    } else if (card.type === CardType.Plus) {
      return 'assets/cards/plus-card.png';
    } else if (card.type === CardType.Minus) {
      return 'assets/cards/plus-card.png';
    } else if (
      (card.type === CardType.PlusMinus ||
        card.type === CardType.OneOrTwoPlusMinus ||
        card.type === CardType.ThreeOrFourPlusMinus ||
        card.type === CardType.FiveOrSixPlusMinus)
      && card.value < 0) {
      return 'assets/cards/minus-plus-card.png';
    } else if (
      (card.type === CardType.PlusMinus ||
        card.type === CardType.OneOrTwoPlusMinus ||
        card.type === CardType.ThreeOrFourPlusMinus ||
        card.type === CardType.FiveOrSixPlusMinus)
      && card.value > 0) {
      return 'assets/cards/plus-minus-card.png';
    } else if (card.type === CardType.AnyValue) {
      return 'assets/cards/gold-card.png';
    }
    return '';
  }
}
