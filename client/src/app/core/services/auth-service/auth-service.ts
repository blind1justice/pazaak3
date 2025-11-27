import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, lastValueFrom, of, map, Observable } from 'rxjs';
import bs58 from 'bs58';
import { WalletService } from "../wallet-service/wallet-service";
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  user: { walletId: string };
}

interface JwtPayload {
  sub: string;
  wallet_id: string;
  nickname: string;
  exp?: number;
  iat?: number;
}

@Injectable({providedIn: 'root'})
export class AuthService {
  private http = inject(HttpClient);
  private wallet = inject(WalletService);
  private router = inject(Router);

  private isAuthenticated = signal<boolean>(false);
  private userId = signal<number | null>(null);
  private walletId = signal<string | null>(null);
  private nickname = signal<string | null>(null);

  readonly isUserAuthenticated = this.isAuthenticated.asReadonly();
  readonly currentUserId = this.userId.asReadonly();
  readonly currentWalletId = this.walletId.asReadonly();
  readonly currentNickname = this.nickname.asReadonly();

  constructor() {
    this.restoreSession();
  }

  async signInWithWallet(): Promise<void> {
    const wallet = this.wallet.wallet();
    if (!wallet?.publicKey) {
      alert('Wallet not connected');
      return;
    }

    const message = `Sign in to Pazaak: ${new Date().toISOString()}`;
    const encodedMessage = new TextEncoder().encode(message);

    try {
      const signature = await wallet.signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      await lastValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/authenticate`, {
          walletId: wallet.publicKey.toBase58(),
          message,
          signature: signatureBase58,
        }).pipe(
          tap(res => {
            localStorage.setItem('jwt', res.token);
            localStorage.setItem('wallet', res.user.walletId);
            this.isAuthenticated.set(true);
          }),
          catchError(err => {
            this.isAuthenticated.set(false);
            console.error('Sign-in failed:', err);
            throw err;
          })
        )
      );

      await this.router.navigate(['/']);

    } catch (err: any) {
      const errorMsg = err?.error?.detail || err?.message || 'Sign-in failed';
      alert(errorMsg);
    }
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('wallet');

    this.isAuthenticated.set(false);
    this.userId.set(null);
  }

  validateSession(): Observable<boolean> {
    const token = this.getJwtToken();

    if (!token) {
      this.clearSession();
      return of(false);
    }

    const payload = this.decodeJwt(token);
    if (!payload || this.isTokenExpired(payload)) {
      console.warn('[Auth] Token expired or invalid');
      this.clearSession();
      return of(false);
    }

    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.http.get<any>(`${environment.apiUrl}/auth/me`).pipe(
      map(() => {
        this.isAuthenticated.set(true);
        return true;
      }),
      catchError(err => {
        console.warn('[Auth] /me failed → session invalid', err);
        this.clearSession();
        return of(false);
      })
    );
  }

  clearSession() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('wallet');
    this.isAuthenticated.set(false);
  }

  getJwtToken(): string | null {
    return localStorage.getItem('jwt');
  }

  private isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  }

  getCurrentUserFromToken(): { userId: number; walletId: string; nickname: string } | null {
    const token = this.getJwtToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeJwt(token);
    if (!payload) {
      return null;
    }

    return {
      userId: Number(payload.sub),
      walletId: payload.wallet_id,
      nickname: payload.nickname
    };
  }

  private restoreSession() {
    const token = this.getJwtToken();
    const wallet = localStorage.getItem('wallet');

    if (token && wallet) {
      const payload = this.decodeJwt(token);
      if (payload) {
        this.userId.set(Number(payload.sub));
        this.walletId.set(payload.wallet_id);
        this.nickname.set(payload.nickname);
        this.isAuthenticated.set(true);
      } else {
        this.logout();
      }
    }
  }

  private clearUserData() {
    this.userId.set(null);
    this.walletId.set(null);
    this.nickname.set(null);
  }
}
