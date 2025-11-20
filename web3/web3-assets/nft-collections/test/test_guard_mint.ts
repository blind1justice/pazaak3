import {
  some,
  transactionBuilder,
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  generateSigner
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

import { mintV2, mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox'
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

import * as fs from "fs";

const walletFile = fs.readFileSync('/Users/lllymuk/.config/solana/id.json');
const walletArray = JSON.parse(walletFile.toString());
const umi = createUmi('https://api.devnet.solana.com').use(mplCandyMachine());

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletArray));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));

let updateAuthority = publicKey("3Y89vAQJyGbH2NrGMxocyPsCDHs2NsJihdnrV9zdZKcq");

let casesCandyMachine = publicKey("DEh7AzbFF6HZ9Sswp4gLk66E4HUyhFha8dK84tofzjum");
let casesCandyGuard = publicKey("FebxN2p6okUSj3Jx6mhVjvmMRsfJbDHYLfnKWp4no7ph");
let casesCollection = publicKey("6UDRpHf9mMCpq7Zi7bsV2URDDHkszaFPf7UhFfgPhnRr");

let cardsCandyMachine = publicKey("D18JBkV3AVyHhHXZshjpRm5wCFkjf81uR7j2SiuLRqmA");
let cardsCandyGuard = publicKey("FYnTFsdZQLdDrKzD3MxKthv1wMg2u8vKpy68gYYYEBru");
let cardsColleciton = publicKey("GZPjAZnG5LmZAmpKrpBZmidAM4KsqCAzp8h5FCJNSgUL");

let pzkMint = publicKey("DVv7y8qy85tQWhoxS8jfET1eABgSgrqE5M3MCr8Sg3Kd");
let pzkDestinationATA = publicKey("137qiw6oVRvm2DxPF9Z6bRsoX898XJUCg9crBHfW8pTU")

async function main() {
  const nftMint = generateSigner(umi)
  console.log(nftMint.publicKey)

  // Minting Pazaak3 Case
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV2(
        umi,
        {
          candyMachine: casesCandyMachine,
          candyGuard: casesCandyGuard,
          nftMint,
          collectionMint: casesCollection,
          collectionUpdateAuthority: updateAuthority,
          mintArgs: {
            tokenPayment: some({ mint: pzkMint, destinationAta: pzkDestinationATA }),
          }
        }
      )
    )
    .sendAndConfirm(umi);

  // Minting Pazaak3 Card
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV2(
        umi,
        {
          candyMachine: cardsCandyMachine,
          candyGuard: cardsCandyGuard,
          nftMint,
          collectionMint: cardsColleciton,
          collectionUpdateAuthority: updateAuthority,
          mintArgs: {
            nftBurn: some({
              requiredCollection: casesCollection,
              mint: publicKey("DRtXjaSKttpCbTzfDzsEUhcjUqnXFqkrFUqtCT6kejQx"), // NFT Token Mint Account address
              tokenStandard: TokenStandard.NonFungible,
            }),
          }
        }
      )
    )
    .sendAndConfirm(umi);
}

main();