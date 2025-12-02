import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { Pazaak } from "../target/types/pazaak"; 
import { Orao } from "@orao-network/solana-vrf";
import { assert } from "chai";
import { sha256 } from 'js-sha256';

describe("my-program", () => {
    const CONFIG_SEED = Buffer.from("pazaak-config");
    const ROOM_SEED = Buffer.from("pazaak-room");
    const ROOM_TREASURY_SEED = Buffer.from("pazaak-room-treasury");

    const ROOM_ID = new BN(Math.round(Math.random() * 1_000_000_000_000));
    const TOKEN_BID = new BN(Math.round(Math.random() * 100_000_000));

    // провайдер и программа
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Pazaak as Program<Pazaak>;
    const vrf_program = new Orao(provider);

    // общий keypair аккаунта, который будем инициализировать
    const authority = provider.wallet.payer;
    const player1 = Keypair.generate();
    const player2 = Keypair.generate();

    const [configPda] = PublicKey.findProgramAddressSync(
        [CONFIG_SEED],
        program.programId
    );

    it("initialize config", async () => {
        const MIN_TOKEN_BID = new anchor.BN(1_000_000);
        const TOKEN_FEE = 5;

        // Airdrop 
        const airdropTx = await provider.connection.requestAirdrop(
            authority.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropTx);

        const tokenMint = await spl.createMint(
            provider.connection,
            authority,
            authority.publicKey,
            null,
            6
        );

        const treasuryAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            authority,
            tokenMint,
            authority.publicKey,
        );
        const tokenTreasury = treasuryAccount.address;

        await program.methods
            .initializeGameConfig(authority.publicKey, MIN_TOKEN_BID, TOKEN_FEE)
            .accounts({
                configAuthority: authority.publicKey,
                gameAuthority: authority.publicKey,
                tokenMint,
                tokenTreasury,
            })
            .signers([authority])
            .rpc();

        console.log("GameConfig initialized at", configPda.toBase58());
        let cfg = await program.account.gameConfig.fetch(configPda);

        assert(cfg.tokenFee == TOKEN_FEE);
        assert(cfg.tokenMinimalBid.eq(MIN_TOKEN_BID));
        assert(cfg.configAuthority.equals(authority.publicKey));
        assert(cfg.gameAuthority.equals(authority.publicKey));
        assert(cfg.tokenMint.equals(tokenMint));
        assert(cfg.tokenTreasury.equals(tokenTreasury));
    });

    it("create game room", async () => {
        const permutationHash = sha256
            .create()
            .update('{"cards_permutation":[1,2,3,4,5,6,7,8,9,10],"secret":"JAKShah7sHas7dAS"]}')
            .digest()
        const [gameRoomPda] = PublicKey.findProgramAddressSync(
            [ROOM_SEED, Buffer.from(ROOM_ID.toArray("le", 8))],
            program.programId
        );

        const airdropTx = await provider.connection.requestAirdrop(
            player1.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropTx);

        let cfg = await program.account.gameConfig.fetch(configPda);
        let tokenMint = cfg.tokenMint;

        const playerTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            player1,
            tokenMint,
            player1.publicKey,
        );
        await spl.mintTo(
            provider.connection,
            authority,
            tokenMint,
            playerTokenAccount.address,
            authority,
            TOKEN_BID.toNumber(),
        );

        await program.methods
            .createGameRoom(ROOM_ID, TOKEN_BID, permutationHash)
            .accounts({
                player: player1.publicKey,
                tokenMint: tokenMint,
            })
            .signers([player1])
            .rpc();

        console.log(`Game room #${ROOM_ID.toNumber()} created at`, gameRoomPda.toBase58());

        const gameRoomAccount = await program.account.gameRoom.fetch(gameRoomPda);
        console.log("Game room account:", JSON.stringify(gameRoomAccount, null, 2));

        const tokenAccount = await spl.getAccount(
            provider.connection,
            playerTokenAccount.address,
        );
        assert(gameRoomAccount.state.created != null)
        assert(gameRoomAccount.state.created[0].player1.equals(player1.publicKey))
        assert(gameRoomAccount.state.created[0].tokenBid.eq(TOKEN_BID))
        assert(tokenAccount.amount.toString() == "0")
    });

    it("enter the game room", async () => {
        const vrf_seed = sha256
            .create()
            .update(`${new BN(Math.round(Math.random() * 1_000_000_000_000))}`)
            .digest()

        const networkStateAcc = await vrf_program.getNetworkState();

        const [gameRoomPda] = PublicKey.findProgramAddressSync(
            [ROOM_SEED, Buffer.from(ROOM_ID.toArray("le", 8))],
            program.programId
        );

        const airdropTx = await provider.connection.requestAirdrop(
            player2.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropTx);

        let cfg = await program.account.gameConfig.fetch(configPda);
        let tokenMint = cfg.tokenMint;

        const playerTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            player2,
            tokenMint,
            player2.publicKey,
        );
        await spl.mintTo(
            provider.connection,
            authority,
            tokenMint,
            playerTokenAccount.address,
            authority,
            TOKEN_BID.toNumber(),
        );

        const _ = await program.methods
            .enterGameRoom(ROOM_ID, vrf_seed)
            .accounts({
                player: player2.publicKey,
                tokenMint: tokenMint,
                vrfTreasury: networkStateAcc.config.treasury
            })
            .signers([player2])
            .rpc();

        console.log("Player2 joined the game");

        let room = await program.account.gameRoom.fetch(gameRoomPda);
        console.log(JSON.stringify(room))

        const randomnessAcc = await vrf_program.getRandomness(Buffer.from(vrf_seed));
        const accountSeed = randomnessAcc.getSeed();
        const randomness = randomnessAcc.getFulfilledRandomness() || new Uint8Array(64);
        console.log(accountSeed, randomness)

    });

    it("finish the game", async () => {
        const [gameRoomPda] = PublicKey.findProgramAddressSync(
            [ROOM_SEED, Buffer.from(ROOM_ID.toArray("le", 8))],
            program.programId
        );

        
        let roomState = await program.account.gameRoom.fetch(gameRoomPda);
        assert(roomState.state.busy != null)

        let cfg = await program.account.gameConfig.fetch(configPda);
        let tokenMint = cfg.tokenMint;
        let tokenTreasury = cfg.tokenTreasury;

        const player1TokenAccount = await spl.getAssociatedTokenAddress(
            tokenMint,
            roomState.state.busy[0].player1,
        );

        const player2TokenAccount = await spl.getAssociatedTokenAddress(
            tokenMint,
            roomState.state.busy[0].player2,
        );

        const _ = await program.methods
            .finishGame(ROOM_ID, { player1: {} }, false)
            .accounts({
                player1TokenAccount: player1TokenAccount,
                player2TokenAccount: player2TokenAccount,
                tokenTreasury: tokenTreasury,
            })
            .signers([authority])
            .rpc()

        let newRoomState = await program.account.gameRoom.fetch(gameRoomPda);

        const tokenAccount = await spl.getAccount(
            provider.connection,
            player1TokenAccount,
        );
        assert(newRoomState.state.finished != null)
        assert(newRoomState.state.finished[0].winner.player1 != null)
        assert(newRoomState.state.finished[0].canceled == false)
        assert(Number(tokenAccount.amount) == Math.round((newRoomState.state.finished[0].tokenBid.toNumber() * 2) * (1 - cfg.tokenFee / 100)))

        console.log("Game finished with winner player1")
    });
});
