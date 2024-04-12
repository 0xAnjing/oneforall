import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import bs58 from 'bs58';
import 'dotenv/config';

(async () => {
    // Connect to cluster
    let connection
    if (!process.env.CLUSTER_URL) {
        connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    } else {
        connection = new Connection(process.env.CLUSTER_URL, 'confirmed');
    }

    // Get sender wallet keypair 
    const fromWallet = Keypair.fromSecretKey(
        bs58.decode(process.env.PRIVATE_KEY)
    );

    // airdrop SOL for devnet
    // const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);

    // Create new token mint
    const mint = await createMint(
        connection,
        fromWallet,
        fromWallet.publicKey,
        null,
        9
    );
    console.log("🚀 ~ mint:", mint)
    
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
    );
    console.log("🚀 ~ fromTokenAccount:", fromTokenAccount)

    // Mint 1 new token to the "fromTokenAccount" account we just created
    let signature = await mintTo(
        connection,
        fromWallet,
        mint,
        fromTokenAccount.address,
        fromWallet.publicKey,
        1 * LAMPORTS_PER_SOL
    );
    console.log('🚀 ~ mint transaction | signature:', signature);
})();