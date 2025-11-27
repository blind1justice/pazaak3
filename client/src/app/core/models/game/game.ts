import { GameResult } from './game-result';

export interface Game {
  id: number;
  player1_id: number;
  player2_id: number;
  result: GameResult;
  bid: number;
  reward: number;
  created_at: string;
  updated_at: string;
  started_at: string;
}
