import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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
