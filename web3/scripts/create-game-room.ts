import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pazaak } from "../target/types/pazaak";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as spl from "@solana/spl-token";

const CONFIG_SEED = Buffer.from("pazaak-config");
const ROOM_SEED = Buffer.from("pazaak-room");
const ROOM_TREASURY_SEED = Buffer.from("pazaak-room-treasury");

const ROOM_ID = new anchor.BN(1);
const TOKEN_BID = new anchor.BN(1_000_000); // 1.0 при decimals=6
const CARDS_HASH = new Uint8Array(32).fill(1);

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pazaak as Program<Pazaak>;
  const player = provider.wallet as anchor.Wallet;
  const playerKeypair = player.payer as Keypair;

  console.log("Payer:", playerKeypair.publicKey.toBase58());

  // PDA конфигурации и комнаты
  const [configPda] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    program.programId
  );
  const [gameRoomPda] = PublicKey.findProgramAddressSync(
    [ROOM_SEED, Buffer.from(ROOM_ID.toArray("le", 8))],
    program.programId
  );
  const [roomTreasuryPda] = PublicKey.findProgramAddressSync(
    [ROOM_TREASURY_SEED, Buffer.from(ROOM_ID.toArray("le", 8))],
    program.programId
  );

  let gameConfig = await program.account.gameConfig.fetch(configPda);
  let tokenMint = gameConfig.tokenMint;

  const playerTokenAccount = await spl.getAssociatedTokenAddressSync(
    tokenMint,
    playerKeypair.publicKey
  );

  console.log(playerTokenAccount);

  // // Создание комнаты (ставка уходит в roomTreasury PDA)
  const tx = await program.methods
    .createGameRoom(ROOM_ID, TOKEN_BID, Array.from(CARDS_HASH))
    .accounts({
      player: playerKeypair.publicKey,
      tokenMint: tokenMint,
    })
    .signers([playerKeypair])
    .rpc();
  console.log("Game room created at", gameRoomPda.toBase58(), "tx", tx);

  // // // Вывод состояния комнаты
  // const gameRoomAccount = await program.account.gameRoom.fetch(gameRoomPda);
  // console.log("Game room account:", JSON.stringify(gameRoomAccount, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
