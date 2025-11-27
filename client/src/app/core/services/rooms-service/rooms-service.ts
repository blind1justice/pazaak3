import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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


  connectToRoom(connectToRoomDto: ConnectToRoomDto): Observable<string> {
    return this.httpClient.post<string>(`${this.baseUrl}/rooms/connect`, connectToRoomDto);
  }

}
