import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import bs58 from 'bs58';
import * as nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

export interface AuthResponse {
  token: string;
  wallet: string;
  expiresIn: string;
}

export interface SignInPayload {
  message: string;
  signature: string;
  publicKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY_JWT = 'jwt';
  private readonly STORAGE_KEY_WALLET = 'wallet';

  // Состояние аутентификации
  private authState = new BehaviorSubject<boolean>(false);
  private userWallet = new BehaviorSubject<string | null>(null);

  // Публичные потоки
  public isAuthenticated$ = this.authState.asObservable();
  public userWallet$ = this.userWallet.asObservable();

  constructor() {
    this.restoreSession();
  }

  // === Моковая верификация (имитация бэкенда) ===
  signIn(payload: SignInPayload): Observable<AuthResponse> {
    console.log('%c[AuthService] Моковая верификация подписи...', 'color: purple');

    // 1. Декодируем подпись
    let signature: Uint8Array;
    try {
      signature = bs58.decode(payload.signature);
    } catch {
      return throwError(() => new Error('Invalid signature format'));
    }

    // 2. Верифицируем подпись
    const publicKey = new PublicKey(payload.publicKey);
    const messageBytes = new TextEncoder().encode(payload.message);
    const isValid = nacl.sign.detached.verify(messageBytes, signature, publicKey.toBytes());

    if (!isValid) {
      return throwError(() => new Error('Invalid signature'));
    }

    // 3. Имитация задержки сервера
    const mockToken = 'mock-jwt-' + Math.random().toString(36).substr(2, 9);
    const response: AuthResponse = {
      token: mockToken,
      wallet: payload.publicKey,
      expiresIn: '7d'
    };

    return of(response).pipe(
      delay(800), // имитация сети
      tap(res => {
        console.log('%c[AuthService] Успешный вход (мок)', 'color: lime');
        this.saveSession(res.token, res.wallet);
        this.authState.next(true);
        this.userWallet.next(res.wallet);
      })
    );
  }

  // === Выход ===
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY_JWT);
    localStorage.removeItem(this.STORAGE_KEY_WALLET);
    this.authState.next(false);
    this.userWallet.next(null);
    console.log('%c[AuthService] Выход выполнен', 'color: orange');
  }

  // === Восстановление сессии ===
  private restoreSession(): void {
    const jwt = localStorage.getItem(this.STORAGE_KEY_JWT);
    const wallet = localStorage.getItem(this.STORAGE_KEY_WALLET);

    if (jwt && wallet) {
      this.authState.next(true);
      this.userWallet.next(wallet);
      console.log('%c[AuthService] Сессия восстановлена', 'color: cyan');
    }
  }

  // === Сохранение в localStorage ===
  private saveSession(token: string, wallet: string): void {
    localStorage.setItem(this.STORAGE_KEY_JWT, token);
    localStorage.setItem(this.STORAGE_KEY_WALLET, wallet);
  }

  // === Получение токена (для API) ===
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_JWT);
  }
}
