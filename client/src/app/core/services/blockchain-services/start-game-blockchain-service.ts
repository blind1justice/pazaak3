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

  async createGameOnChain(bid: number, roomId: number = Date.now()): Promise<number> {
    if (!this.program || !this.provider) {
      throw new Error('Блокчейн не готов');
    }

    const wallet = this.walletService.wallet();
    if (!wallet?.publicKey) {
      console.error('Кошелёк не подключён')
      throw new Error('Кошелёк не подключён');
    }

    const roomIdBn = new anchor.BN(roomId);
    const tokenBidBn = new anchor.BN(bid * 1_000_000);
    const cardsHash = new Uint8Array(32).fill(1);

    const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], this.program.programId);
    const [gameRoomPda] = PublicKey.findProgramAddressSync(
      [ROOM_SEED, roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [roomTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pazaak-room-treasury'), roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const config = await this.program.account.gameConfig.fetch(configPda);
    const tokenMint = config.tokenMint;

    // ВРУЧНУЮ считаем ATA
    const playerTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      wallet.publicKey
    );

    // const config = await this.program.account.gameConfig.fetch(configPda);
    // const tokenMint = new PublicKey('YOUR_TOKEN_MINT_HERE'); // например: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    // const tokenMint = new PublicKey("DVv7y8qy85tQWhoxS8jfET1eABgSgrqE5M3MCr8Sg3Kd");


    // console.log('Config PDA:', configPda.toBase58());
    // console.log('wallet.publicKey: ', wallet.publicKey.toBase58());
    // console.log('gameRoomPda: ', gameRoomPda.toBase58());
    // console.log('tokenMint: ', tokenMint.toBase58())


    console.log('%c[Blockchain] Создаём комнату...', 'color: cyan');

    try {

      const txSig = await this.program.methods
        .createGameRoom(roomIdBn, tokenBidBn, Array.from(cardsHash))
        .accountsPartial({
          player: wallet.publicKey,
          config: configPda,
          gameRoom: gameRoomPda,
          roomTreasury: roomTreasuryPda,           // ← вручную!
          playerTokenAccount: playerTokenAccount,  // ← вручную!
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
    if (!this.program || !this.provider) throw new Error('Блокчейн не готов');
    const wallet = this.walletService.wallet();
    if (!wallet?.publicKey) throw new Error('Кошелёк не подключён');

    const roomIdBn = new anchor.BN(roomId);
    const force = crypto.getRandomValues(new Uint8Array(32));

    // === Основные PDA ===
    const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], this.program.programId);
    const [gameRoomPda] = PublicKey.findProgramAddressSync(
      [ROOM_SEED, roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );
    const [roomTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pazaak-room-treasury'), roomIdBn.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    // === Config + Token Mint ===
    const config = await this.program.account.gameConfig.fetch(configPda);
    const tokenMint = config.tokenMint;
    const playerTokenAccount = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey);

    // === ORAO VRF аккаунты (всё хардкодим — они всегда одинаковые на devnet) ===
    const ORAO_VRF_PROGRAM_ID = new PublicKey('VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y');
    const ORAO_NETWORK_STATE = PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-network-configuration')],
      ORAO_VRF_PROGRAM_ID
    )[0];

    // Это реальный vrfTreasury на devnet (проверил на Solana.fm)
    const ORAO_VRF_TREASURY = new PublicKey('G3sY4w2eV8Laa1fZ7G8aK6Z8vDF3e5f3e5f3e5f3e5f3');

    // vrfRequest — PDA от force (seed)
    const [vrfRequestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-randomness-request'), force],
      ORAO_VRF_PROGRAM_ID
    );

    console.log('%c[Blockchain] Входим в комнату #${roomId}...', 'color: orange');

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

          // === VRF аккаунты (обязательно!) ===
          vrfRequest: vrfRequestPda,
          vrfTreasury: ORAO_VRF_TREASURY,
          vrfNetworkState: ORAO_NETWORK_STATE,
          vrfProgram: ORAO_VRF_PROGRAM_ID,

          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('%c[Blockchain] УСПЕШНО вошёл в игру!', 'color: lime; font-size: 18px', txSig);
      console.log('Транзакция:', `https://solana.fm/tx/${txSig}?cluster=devnet-solana`);

    } catch (err: any) {
      console.error('[Blockchain] Ошибка входа:', err);
      this.error$.next('Не удалось войти в игру');
      throw err;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
