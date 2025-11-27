import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GameState } from '../../models/game-state';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlayerState } from '../../models/player-state';
import { CardType } from '../../models/card-type';
import { Game } from '../../models/game';


@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly baseUrl = environment.apiUrl;
  private httpClient = inject(HttpClient);

  createGame(bid: number): Observable<Game> {
    return this.httpClient.post<Game>(`${this.baseUrl}/games/create`, {bid});
  }

  connectToGame(id: number): Observable<Game> {
    return this.httpClient.post<Game>(`${this.baseUrl}/games/connect/${id}`, {});
  }

  getPendingGames(): Observable<Game[]> {
    return this.httpClient.get<Game[]>(`${this.baseUrl}/games/pending`);
  }
}
