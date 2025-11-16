import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface AuthResponse {
  user: {
    id: number;
    nickname: string;
    walletId: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
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
  private readonly baseUrl = environment.apiUrl;
  private readonly httpClient = inject(HttpClient);

  // Состояние аутентификации
  private authState = new BehaviorSubject<boolean>(false);
  private userWallet = new BehaviorSubject<string | null>(null);

  // Публичные потоки
  public isAuthenticated$ = this.authState.asObservable();
  public userWallet$ = this.userWallet.asObservable();

  constructor() {
    this.restoreSession();
  }

  // === Авторизация/Регистрация через Phantom (объединенный метод) ===
  authenticate(payload: SignInPayload, nickname?: string): Observable<AuthResponse> {
    console.log('%c[AuthService] Отправка запроса на авторизацию/регистрацию...', 'color: purple');

    const authData: any = {
      walletId: payload.publicKey,
      message: payload.message,
      signature: payload.signature
    };

    // Добавляем nickname только если он передан
    if (nickname) {
      authData.nickname = nickname;
    }

    return this.httpClient.post<AuthResponse>(`${this.baseUrl}/auth/authenticate`, authData).pipe(
      tap(res => {
        console.log('%c[AuthService] Успешная авторизация', 'color: lime');
        this.saveSession(res.token, res.user.walletId);
        this.authState.next(true);
        this.userWallet.next(res.user.walletId);
      }),
      catchError(err => {
        console.error('%c[AuthService] Ошибка авторизации', 'color: red', err);
        this.authState.next(false);
        this.userWallet.next(null);
        return throwError(() => err);
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
