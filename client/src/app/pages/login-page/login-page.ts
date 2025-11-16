import {Component, effect, inject, signal} from '@angular/core';
import bs58 from 'bs58';
import {WalletService} from '../../core/services/wallet-service/wallet-service';
import {PublicKey} from '@solana/web3.js';
import {AuthService} from '../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-login-page',
  imports: [],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly walletService = inject(WalletService);
  private readonly authService = inject(AuthService);

  hasPhantom = signal(!!(window as any).solana?.isPhantom);
  isLoading = this.walletService.isLoading;
  isWalletConnected = signal(false);
  isAuthenticated = signal(false);
  publicKey = signal<PublicKey | null>(null);

  private subscription: any;

  constructor() {
    this.subscribeToWallet();
    this.subscribeToAuth();
  }

  private subscribeToWallet() {
    effect(() => {
      const wallet = this.walletService.walletSubject();
      const connected = !!wallet;
      this.isWalletConnected.set(connected);
      this.publicKey.set(wallet?.publicKey || null);

      if (connected) {
        console.log('%c[LoginPage] Кошелёк подключён:', 'color: green', wallet.publicKey.toBase58());
      }
    });
  }

  private subscribeToAuth() {
    this.subscription = this.authService.isAuthenticated$
      .pipe()
      .subscribe({
      next: (isAuth: boolean) => {
        this.isAuthenticated.set(isAuth);
        if (isAuth) {
          console.log('%c[LoginPage] Пользователь аутентифицирован', 'color: lime');
        }
      }
    });
  }

  async connectWallet() {
    if (!this.hasPhantom()) return alert('Установите Phantom!');
    try {
      await this.walletService.connect();
    } catch (err) {
      alert('Не удалось подключиться');
    }
  }

  async signIn() {
    const wallet = this.walletService.walletSubject();
    if (!wallet) return alert('Кошелёк не подключён');

    const message = `Sign in to MyApp: ${new Date().toISOString()}`;
    const encoded = new TextEncoder().encode(message);

    try {
      const signature = await wallet.signMessage(encoded);
      const signatureBase58 = bs58.encode(signature);

      this.authService.authenticate({
        message,
        signature: signatureBase58,
        publicKey: this.publicKey()!.toBase58()
      }).subscribe({
        next: () => {
          alert('Успешный вход!');
        },
        error: (err: any) => {
          console.error(err);
          const errorMessage = err?.error?.detail || err?.message || 'Ошибка входа';
          alert('Ошибка входа: ' + errorMessage);
        }
      });
    } catch (err) {
      alert('Ошибка подписи');
    }
  }

  logout() {
    this.authService.logout();
    this.walletService.disconnect();
  }
}
