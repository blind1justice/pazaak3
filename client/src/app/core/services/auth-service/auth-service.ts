import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, lastValueFrom } from 'rxjs';
import bs58 from 'bs58';
import { WalletService } from "../wallet-service/wallet-service";
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  user: { walletId: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private wallet = inject(WalletService);
  private router = inject(Router);

  private isAuthenticated = signal<boolean>(false)

  constructor() {
    this.restoreSession();
  }

  isUserAuthenticated = this.isAuthenticated.asReadonly();

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
  }

  getToken() {
    let token = localStorage.getItem('jwt');
    if (token) {
      return token;
    }
    return null;
  }

  private restoreSession() {
    if (localStorage.getItem('jwt') && localStorage.getItem('wallet')) {
      this.isAuthenticated.set(true);
    }
  }
}
