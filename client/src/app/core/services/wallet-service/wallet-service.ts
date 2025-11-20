import { Injectable, signal } from '@angular/core';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private adapter = new PhantomWalletAdapter();

  readonly isLoading = signal(true);
  readonly wallet = signal<PhantomWalletAdapter | null>(null);

  constructor() {
    this.checkPhantomAndAutoConnect();
  }

  hasPhantom(): boolean {
    return !!(window as any).solana?.isPhantom;
  }

  private async checkPhantomAndAutoConnect() {
    if (!this.hasPhantom()) {
      this.isLoading.set(false);
      return;
    }

    try {
      if (this.adapter.readyState === 'Installed') {
        await this.adapter.connect();
        this.wallet.set(this.adapter);
      }
    } catch (err) {
      console.warn('Auto-connect skipped');
    } finally {
      this.isLoading.set(false);
    }
  }

  async connect() {
    await this.adapter.connect();
    this.wallet.set(this.adapter);
  }

  async disconnect() {
    await this.adapter.disconnect();
    this.wallet.set(null);
  }
}
