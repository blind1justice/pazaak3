import { GameResult } from './game-result';
import { User } from './user';

export interface Game {
  id: number;
  bid: number;
  reward: number;
  player1: User | null;
  player2: User | null;
  result: GameResult;
  created_at: string;
  updated_at: string;
  started_at: string;
}
