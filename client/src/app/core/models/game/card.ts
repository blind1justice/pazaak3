import { CardType } from './card-type';

export interface Card {
  type: CardType;
  value: number;
  state: number;
  numberOfStates: number;
}
