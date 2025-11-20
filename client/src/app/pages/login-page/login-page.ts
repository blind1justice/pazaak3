import { Component, computed, effect, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth-service/auth-service';
import { WalletService } from '../../core/services/wallet-service/wallet-service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatProgressSpinner,
    RouterLink,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private wallet = inject(WalletService);
  private auth = inject(AuthService);

  isLoading = this.wallet.isLoading;
  walletState = this.wallet.wallet;
  isAuthenticated = this.auth.isUserAuthenticated;

  hasPhantom = computed(() => this.wallet.hasPhantom());
  isWalletConnected = computed(() => !!this.walletState());
  publicKey = computed(() => this.walletState()?.publicKey?.toBase58() || '');

  constructor() {
    effect(() => {
      const wallet = this.walletState();
      if (wallet) {
        console.log('%c[LoginPage] Wallet connected:', 'color: lime', wallet.publicKey!.toBase58());
      }
    });
  }

  async connect() {
    if (!this.hasPhantom()) {
      alert('Please install Phantom wallet');
      return;
    }
    await this.wallet.connect();
  }

  async signIn() {
    await this.auth.signInWithWallet();
  }

  disconnect() {
    this.wallet.disconnect();
  }

  logout() {
    this.auth.logout();
    this.wallet.disconnect();
  }
}
