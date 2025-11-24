import { Injectable } from '@angular/core';
import { CardType } from '../../models/game/card-type';
import { Card } from '../../models/game/card';
import { NftCard } from '../nft-cards-service/nft-cards-service';

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

  getImagePathFromNftCard(card: NftCard): string {
    switch (card.cardType) {
      case CardType.Plus:
        return 'assets/cards/plus-card.png';
      case CardType.Minus:
        return 'assets/cards/minus-card.png';
      case CardType.FromCommonDeck:
        return 'assets/cards/common-card.png';
      case CardType.AnyValue:
        return 'assets/cards/gold-card.png';
      case CardType.PlusMinus:
      case CardType.PlusMinus1:
      case CardType.PlusMinus2:
      case CardType.PlusMinus3:
      case CardType.PlusMinus4:
      case CardType.PlusMinus5:
      case CardType.PlusMinus6:
      case CardType.OneOrTwoPlusMinus:
      case CardType.ThreeOrFourPlusMinus:
      case CardType.FiveOrSixPlusMinus:
        return card.name.includes('Minus') || card.name.includes('minus')
          ? 'assets/cards/minus-plus-card.png'
          : 'assets/cards/plus-minus-card.png';
      default:
        return 'assets/cards/gray-card.png';
    }
  }
}
