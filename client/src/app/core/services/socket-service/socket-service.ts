import { inject, Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs'

export const socketConfig: SocketIoConfig  = {
  url: 'ws://localhost:8000',
  options: {
    transports: ['websocket'],
    reconnection: true,
    autoConnect: false,
    query: { token: '12345' },
    // auth: { token: localStorage.getItem('token') }
  }
};

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket = inject(Socket)

  // Подключиться вручную (можно вызвать в ngOnInit компонента или в guard)
  connect() {
    if (!this.socket.ioSocket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    this.socket.disconnect();
  }

  // Отправка события
  emit(event: string, data: any = null) {
    this.socket.emit(event, data);
  }

  // Прослушка события (возвращает Observable)
  on<T = any>(event: string): Observable<T> {
    return this.socket.fromEvent<T>(event);
  }

  // Одноразовое событие
  once<T = any>(event: string): Observable<T> {
    return this.socket.fromEvent<T>(event);
  }

  // Удалить конкретный listener
  removeListener(event: string) {
    this.socket.removeListener(event);
  }

  // Удалить все listeners
  removeAllListeners() {
    this.socket.removeAllListeners();
  }
}
