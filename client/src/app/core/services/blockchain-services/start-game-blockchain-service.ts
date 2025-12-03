import { inject, Injectable, OnDestroy } from '@angular/core';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Pazaak } from '../../blockchain-types/pazaak';
import { Connection, clusterApiUrl, PublicKey, SystemProgram } from '@solana/web3.js';
import { BehaviorSubject, Subject } from 'rxjs';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import idl from '../../blockchain-types/pazaak.json';
import { WalletService } from '../wallet-service/wallet-service';
import { toObservable } from '@angular/core/rxjs-interop';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';


const CONFIG_SEED = Buffer.from('pazaak-config');
const ROOM_SEED = Buffer.from('pazaak-room');

@Injectable({
  providedIn: 'root',
})
export class StartGameBlockchainService implements OnDestroy {
  private readonly walletService = inject(WalletService);
  private provider?: AnchorProvider;
  private program?: Program<Pazaak>;

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
          this.program = undefined;
          this.provider = undefined;
          this.status$.next('idle');
          this.error$.next('Кошелёк отключён');
        }
      });
  }

  private async initializeProvider(adapter: any) {
    this.status$.next('connecting');

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.provider = new AnchorProvider(connection, adapter, {
      preflightCommitment: 'confirmed',
    });

    anchor.setProvider(this.provider);

    try {
      this.program = new Program<Pazaak>(idl as any, this.provider);

      this.status$.next('connected');
      console.log('%c[Blockchain] Подключено к Pazaak!', 'color: lime; font-weight: bold');
      console.log('Program ID:', this.program.programId.toBase58());
    } catch (err: any) {
      console.error('[Blockchain] Ошибка:', err);
      this.status$.next('error');
      this.error$.next('Не удалось загрузить программу');
    }
  }

  async createGameOnChain(bid: number, roomId: number): Promise<number> {
    if (!this.program || !this.provider) {
      throw new Error('Блокчейн не готов');
    }

    const wallet = this.walletService.wallet();
    if (!wallet?.publicKey) {
      console.error('Кошелёк не подключён')
      throw new Error('Кошелёк не подключён');
    }

    const roomIdBn = new anchor.BN(roomId);
    const tokenBidBn = new anchor.BN(bid * 100_000_000);
    const cardsHash = new Uint8Array(32).fill(1);

    const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], this.program.programId);
    const [gameRoomPda] = PublicKey.findProgramAddressSync(
      [ROOM_SEED, roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    console.log(gameRoomPda.toString());

    const [roomTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pazaak-room-treasury'), roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const config = await this.program.account.gameConfig.fetch(configPda);
    const tokenMint = config.tokenMint;

    const playerTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      wallet.publicKey
    );

    console.log('%c[Blockchain] Создаём комнату...', 'color: cyan');

    try {

      const txSig = await this.program.methods
        .createGameRoom(roomIdBn, tokenBidBn, Array.from(cardsHash))
        .accountsPartial({
          player: wallet.publicKey,
          config: configPda,
          gameRoom: gameRoomPda,
          roomTreasury: roomTreasuryPda,
          playerTokenAccount: playerTokenAccount,
          tokenMint: tokenMint,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('%c[Blockchain] Комната создана!', 'color: lime', txSig);

      const gameRoomAccount = await this.program.account.gameRoom.fetch(gameRoomPda);
      console.log("Game room account:", JSON.stringify(gameRoomAccount, null, 2));

      return roomId;
    } catch (err: any) {
      console.error('[Blockchain] Ошибка:', err);
      throw err;
    }
  }

  async joinGameOnChain(roomId: number): Promise<void> {
    console.log(roomId)

    if (!this.program || !this.provider) {
      throw new Error('Блокчейн не готов');
    }

    const wallet = this.walletService.wallet();
    if (!wallet?.publicKey) {
      throw new Error('Кошелёк не подключён');
    }

    const roomIdBn = new anchor.BN(roomId);
    const force = crypto.getRandomValues(new Uint8Array(32));

    // === Основные PDA ===
    const [configPda] = PublicKey.findProgramAddressSync(
      [CONFIG_SEED],
      this.program.programId
    );

    const [gameRoomPda] = PublicKey.findProgramAddressSync(
      [ROOM_SEED, roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    console.log(gameRoomPda.toString());

    const [roomTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pazaak-room-treasury'), roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const config = await this.program.account.gameConfig.fetch(configPda);
    const tokenMint = config.tokenMint;

    const playerTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      wallet.publicKey
    );

    const ORAO_VRF_PROGRAM_ID = new PublicKey('VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y');

    const [vrfNetworkStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-network-configuration')],
      ORAO_VRF_PROGRAM_ID
    );

    const [vrfRequestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-randomness-request'), force],
      ORAO_VRF_PROGRAM_ID
    );

    let vrfTreasury: PublicKey;
    try {
      const networkStateAccount = await this.program.account.networkState.fetch(vrfNetworkStatePda);
      vrfTreasury = networkStateAccount.config.treasury;
      console.log('Found VRF treasury from network state:', vrfTreasury.toBase58());
    } catch (err) {
      console.warn('Could not fetch network state, using fallback VRF treasury');
      vrfTreasury = new PublicKey('G3sY4w2eV8Laa1fZ7G8aK6Z8vDF3e5f3e5f3e5f3e5f3');
    }

    try {
      const txSig = await this.program.methods
        .enterGameRoom(roomIdBn, Array.from(force))
        .accountsPartial({
          player: wallet.publicKey,
          config: configPda,
          gameRoom: gameRoomPda,
          roomTreasury: roomTreasuryPda,
          playerTokenAccount: playerTokenAccount,
          tokenMint: tokenMint,
          vrfRequest: vrfRequestPda,
          vrfTreasury: vrfTreasury,
          vrfNetworkState: vrfNetworkStatePda,
          vrfProgram: ORAO_VRF_PROGRAM_ID,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('%c[Blockchain] Успешно вошли в комнату!', 'color: lime; font-weight: bold');
      console.log('Транзакция:', `https://solana.fm/tx/${txSig}?cluster=devnet-solana`);

      // Проверим обновлённое состояние комнаты
      const updatedGameRoom = await this.program.account.gameRoom.fetch(gameRoomPda);
      console.log('Обновлённое состояние комнаты:', JSON.stringify(updatedGameRoom, null, 2));

    } catch (err: any) {
      console.error('[Blockchain] Ошибка входа в комнату:', err);

      // Детальная диагностика ошибки
      if (err.logs) {
        console.error('Transaction logs:', err.logs);
      }

      this.error$.next('Не удалось войти в игру');
      throw new Error(`Join game failed: ${err.message}`);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
