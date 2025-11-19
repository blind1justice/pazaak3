import {
  some,
  transactionBuilder,
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  generateSigner
} from '@metaplex-foundation/umi'
import { mintV2, mplCandyMachine, fetchCandyMachine, fetchCandyGuard } from '@metaplex-foundation/mpl-candy-machine'
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import * as fs from "fs";

const walletFile = fs.readFileSync('/Users/lllymuk/.config/solana/id.json');
const walletArray = JSON.parse(walletFile.toString());
const umi = createUmi('https://api.devnet.solana.com').use(mplCandyMachine());

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletArray));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));

let candyMachinePublicKey = publicKey("D18JBkV3AVyHhHXZshjpRm5wCFkjf81uR7j2SiuLRqmA");
let collectionNFTPublicKey = publicKey("GZPjAZnG5LmZAmpKrpBZmidAM4KsqCAzp8h5FCJNSgUL");
let updateAuthorityPublicKey = publicKey("3Y89vAQJyGbH2NrGMxocyPsCDHs2NsJihdnrV9zdZKcq");


async function main() {
  const nftMint = generateSigner(umi)

  console.log(nftMint.publicKey)
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV2(
        umi,
        {
          candyMachine: candyMachinePublicKey,
          candyGuard: publicKey("FYnTFsdZQLdDrKzD3MxKthv1wMg2u8vKpy68gYYYEBru"),
          nftMint,
          collectionMint: collectionNFTPublicKey,
          collectionUpdateAuthority: updateAuthorityPublicKey,
        }
      )
    )
    .sendAndConfirm(umi)
}

main();