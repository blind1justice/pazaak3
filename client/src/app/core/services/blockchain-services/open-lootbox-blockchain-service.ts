import { inject, Injectable, OnDestroy } from '@angular/core';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { BehaviorSubject, Subject } from 'rxjs';
import * as anchor from '@coral-xyz/anchor';
import { WalletService } from '../wallet-service/wallet-service';
import { toObservable } from '@angular/core/rxjs-interop';

// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';

@Injectable({
  providedIn: 'root',
})
export class OpenLootboxBlockchainService implements OnDestroy {

  private readonly walletService = inject(WalletService);
  private provider?: AnchorProvider;
  private umi?: any;

  private status$ = new BehaviorSubject<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  private error$ = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();

  readonly status = this.status$.asObservable();
  readonly error = this.error$.asObservable();

  constructor() {
    toObservable(this.walletService.wallet)
      .subscribe(wallet => {
          if (wallet?.connected && wallet.publicKey) {
            this.initializeProvider(wallet);
          } else {
            this.provider = undefined;
            this.status$.next('idle');
            this.error$.next('Кошелёк отключён');
          }
        }
      );
  }

  private async initializeProvider(adapter: any) {
    this.status$.next('connecting');

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.provider = new AnchorProvider(connection, adapter, {
      preflightCommitment: 'confirmed',
    });
    anchor.setProvider(this.provider);
    this.status$.next('connected');
    console.log('%c[Lootbox] Provider готов', 'color: lime; font-weight: bold');

    console.log('polyfills', (window as any).Stream, window.Buffer, window.process);

    const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
    const { walletAdapterIdentity } = await import('@metaplex-foundation/umi-signer-wallet-adapters');

    this.umi = createUmi(clusterApiUrl('devnet')).use(walletAdapterIdentity(adapter));
  }

  async openLootboxAndMintCard(): Promise<string> {


    return "";
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
