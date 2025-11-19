import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GameState } from '../../models/game/game-state';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlayerState } from '../../models/game/player-state';
import { CardType } from '../../models/game/card-type';


@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly baseUrl = environment.apiUrl;
  private httpClient = inject(HttpClient);

  getGameStateById(gameId: number): Observable<GameState> {
    // return this.httpClient.get<GameState>(`${this.baseUrl}/games/${gameId}/state`);

    const gameState: GameState = {
      player1Id: 1,
      player2Id: 2,
      player1Name: "player_1",
      player2Name: "player_2",
      hand1: [
        {
          type: CardType.Plus,
          value: 1,
          state: 1,
          numberOfStates: 1
        },
        {
          type: CardType.FiveOrSixPlusMinus,
          value: 5,
          state: 1,
          numberOfStates: 1
        }
      ],
      hand2: [
        {
          type: CardType.ThreeOrFourPlusMinus,
          value: 3,
          state: -3,
          numberOfStates: 1
        },
      ],
      board1: [
        {
          type: CardType.AnyValue,
          value: 4,
          state: 1,
          numberOfStates: 1
        },
        {
          type: CardType.FromCommonDeck,
          value: 6,
          state: 1,
          numberOfStates: 1
        }
      ],
      board2: [
        {
          type: CardType.ThreeOrFourPlusMinus,
          value: 3,
          state: -3,
          numberOfStates: 1
        },
        {
          type: CardType.AnyValue,
          value: 8,
          state: 1,
          numberOfStates: 1
        },
        {
          type: CardType.FromCommonDeck,
          value: 2,
          state: 1,
          numberOfStates: 1,
        }
      ],
      roundPoint1: 1,
      roundPoint2: 2,
      board1Sum: 5,
      board2Sum: 18,
      player1State: PlayerState.ActiveTurn,
      player2State: PlayerState.WaitEnemyTurn,
      gameId: 1
    }

    return of(gameState);
  }
}
