import { Card } from './card';
import { PlayerState } from './player-state';

export interface GameState {
  gameId: number;

  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;

  hand1: Card[];
  hand2: Card[];
  board1: Card[];
  board2: Card[];

  roundPoint1: number;
  roundPoint2: number;

  board1sum: number;
  board2sum: number;

  Player1State: PlayerState;
  Player2State: PlayerState;

  turnEndTime: number;
}
