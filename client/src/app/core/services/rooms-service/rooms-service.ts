import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateRoomDto } from '../../models/create-room-dto';
import { Observable, of } from 'rxjs';
import { Room } from '../../models/room';
import { environment } from '../../../../environments/environment';
import { ConnectToRoomDto } from '../../models/connect-to-room-dto';

@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  private readonly baseUrl = environment.apiUrl;
  private readonly httpClient = inject(HttpClient);

  createRoom(createRoomDto: CreateRoomDto): Observable<Room> {
    // return this.httpClient.post<Room>(`${this.baseUrl}/rooms`, createRoomDto);

    const roomMock: Room = {
      id: 1,
      number: "123",
      bid: 10
    }

    return of(roomMock);
  }

  connectToRoom(connectToRoomDto: ConnectToRoomDto): Observable<string> {
    return this.httpClient.post<string>(`${this.baseUrl}/rooms/connect`, connectToRoomDto);
  }

}
