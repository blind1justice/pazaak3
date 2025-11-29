import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({providedIn: 'root'})
export class SocketService {
  private socket: Socket | null = null;
  private currentRoomId = new BehaviorSubject<string | null>(null);
  private connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  readonly roomId$ = this.currentRoomId.asObservable();
  readonly status$ = this.connectionStatus.asObservable();

  connectToGame(roomId: string, jwt: string) {
    if (this.socket?.connected && this.currentRoomId.value === roomId) {
      console.log('[Socket] Already connected to room:', roomId);
      return;
    }

    this.disconnect();

    console.log(`[Socket] Connecting to room ${roomId}...`);

    this.connectionStatus.next('connecting');

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        room: roomId,
        jwt: jwt,
      },
    });

    this.currentRoomId.next(roomId);

    this.socket.on('connect', () => {
      console.log('%c[Socket] Connected to room ' + roomId, 'color: lime');
      this.connectionStatus.next('connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection failed:', err.message);
      this.connectionStatus.next('disconnected');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      this.connectionStatus.next('disconnected');
    });
  }

  sendReadyToStart() {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot send ready — not connected');
      return;
    }

    console.log('[Socket] → game_ready_to_start');
    this.socket.emit('game_ready_to_start');
  }

  on<T = any>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }

      const handler = (data: T) => observer.next(data);
      this.socket.on(event, handler);

      return () => this.socket?.off(event, handler);
    });
  }

  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Cannot emit ${event} — not connected`);
      return;
    }
    this.socket.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoomId.next(null);
    this.connectionStatus.next('disconnected');
  }

  get roomId() {
    return this.currentRoomId.value;
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}
