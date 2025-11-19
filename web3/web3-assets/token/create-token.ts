import {
    createMint,
    TOKEN_PROGRAM_ID,
    createAccount,
    mintTo
} from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, Keypair, clusterApiUrl, PublicKey, Transaction } from "@solana/web3.js";
import * as fs from "fs";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const walletFile = fs.readFileSync('/Users/lllymuk/.config/solana/id.json');
const walletArray = JSON.parse(walletFile.toString());
const owner = Keypair.fromSecretKey(new Uint8Array(walletArray));





async function main() {
    const connection = new Connection(clusterApiUrl('devnet'), { commitment: "confirmed" });

    console.log(`Public key is: ${owner.publicKey.toBase58()}`);

    const tokenMint = await createMint(connection, owner, owner.publicKey, null, 8);

    const tokenAccount = await createAccount(
        connection,
        owner,
        tokenMint,
        owner.publicKey,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    )

    await mintTo(connection, owner, tokenMint, tokenAccount, owner, 10_000_000_000)

    console.log(`✅ Created token mint: ${tokenMint} and associated account ${tokenAccount}`);

    const tokenAddress = tokenMint;
    const tokenMetadata = {
        name: "Pazaak",
        symbol: "PZK",
        uri: "https://raw.githubusercontent.com/blind1justice/pazaak3/refs/heads/main/web3/web3-assets/token/pzk-token.json",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };


    const metadataPDAAndBump = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            tokenMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const metadataPDA = metadataPDAAndBump[0];

    const tx = new Transaction().add(
        createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: tokenMint,
                mintAuthority: owner.publicKey,
                payer: owner.publicKey,
                updateAuthority: owner.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    collectionDetails: null,
                    data: tokenMetadata,
                    isMutable: true,
                },
            }
        )
    );

    const recentBlockhash = await connection.getLatestBlockhash()
    tx.feePayer = owner.publicKey
    tx.recentBlockhash = recentBlockhash.blockhash
    tx.sign(owner)

    const txSignature = await connection.sendRawTransaction(tx.serialize())
    console.log(`Transaction confirmed, ID is: ${txSignature}!`);


}

main();