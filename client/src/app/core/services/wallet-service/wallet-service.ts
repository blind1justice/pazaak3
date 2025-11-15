import { Injectable, signal } from '@angular/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const network = WalletAdapterNetwork.Devnet;
const endpoint = 'https://api.devnet.solana.com';
const connection = new Connection(endpoint);

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  public connection = connection;
  public wallet = new PhantomWalletAdapter();

  public walletSubject = signal<any>(null);
  public publicKey = signal<PublicKey | null>(null);
  public isLoading = signal(true);

  constructor() {
    this.tryAutoConnect();
  }

  private async tryAutoConnect() {
    console.log('%c[WalletService] Попытка автоподключения...', 'color: cyan');
    try {
      if (this.wallet.readyState === 'Installed') {
        await this.wallet.connect();
        this.updateWalletState();
        console.log('%c[WalletService] Автоподключение успешно', 'color: lime');
      }
    } catch (err: any) {
      if (err.name !== 'WalletNotReadyError') {
        console.warn('%c[WalletService] Автоподключение не требуется', 'color: gray');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async connect(): Promise<void> {
    await this.wallet.connect();
    this.updateWalletState();
  }

  async disconnect(): Promise<void> {
    await this.wallet.disconnect();
    this.walletSubject.set(null);
    this.publicKey.set(null);
  }

  private updateWalletState() {
    this.walletSubject.set(this.wallet);
    this.publicKey.set(this.wallet.publicKey);
  }

  isConnected(): boolean {
    return !!this.publicKey();
  }
}
