import { ComputeBudgetProgram, clusterApiUrl, Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';
import bs58 from 'bs58';
import fs from 'fs';
import 'dotenv/config';

(async () => {
    // Connect to cluster
    let connection
    if (!process.env.CLUSTER_URL) {
        connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    } else {
        connection = new Connection(process.env.CLUSTER_URL, 'confirmed');
    }

    // Set priority rate
    const priorityRate = (process.env.PRIORITY_RATE || 0.1) * LAMPORTS_PER_SOL;

    // Instruction to set the compute unit price for priority fee
    const priorityFeeInstructions = ComputeBudgetProgram.setComputeUnitPrice({microLamports: priorityRate});

    // Get token mint
    const mintPublicKey = process.env.MINT_PUBLIC_KEY;    
    const mint = await getMint(
        connection,
        new PublicKey(mintPublicKey),
        'confirmed',
        TOKEN_PROGRAM_ID
    );

    // Get sender wallet keypair 
    const fromWallet = Keypair.fromSecretKey(
        bs58.decode(process.env.PRIVATE_KEY)
    );

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint.address,
        fromWallet.publicKey
    );

    const walletAddresses = [];
    const amounts = [];
    // Read receiver wallet addresses/public keys from a file
    const fileContent = fs.readFileSync('wallet_addresses.txt', 'utf8');
    const lines = fileContent.split('\n');

    if (process.env.TRANSFER_TYPE === '') {
        console.log(`Please set TRANSFER_TYPE to 'random' or 'setAmount' in the .env file.`)
        return;
    }

    if (process.env.TRANSFER_TYPE === 'random') {
        walletAddresses.push(...fileContent.split('\n'));

        // Check if wallets contain comma
        if (walletAddresses.some(wallet => wallet.includes(','))) {
            console.log('Wallets contain numbers. Please remove check the file and try again.');
            return;
        }

        const minAmount = Number(process.env.MIN_AMOUNT || 0.01);
        const maxAmount = Number(process.env.MAX_AMOUNT || 0.1);

        for (let i = 0; i < lines.length; i++) {
            const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;
            amounts.push(randomAmount);
        }
    }

    if (process.env.TRANSFER_TYPE === 'setAmount') {
        for (let line of lines) {
            const [wallet, amount] = line.split(',');
            walletAddresses.push(wallet);
            amounts.push(Number(amount));
        }

        // Check if amounts contain NaN
        if (amounts.some(amount => isNaN(amount))) {
            console.log('Some wallets are missing amount. Please check the file and try again.');
            return;
        }
    }

    // Batch size; default to 10
    const batchSize = process.env.BATCH_SIZE || 10;
    for (let i = 0; i < walletAddresses.length; i += batchSize) {
        const transaction = new Transaction();

        // Add the priority fee instruction to the transaction
        transaction.add(priorityFeeInstructions)

        for (let j = i; j < Math.min(i + batchSize, walletAddresses.length); j++) {
            // Set the receiver's public key
            const receiverPublicKey = new PublicKey(walletAddresses[j]);

            // Check if the receiver already has a token account
            const toTokenAccountAddress = await getToTokenAccountAddress(connection, receiverPublicKey, mint.address)

            if (toTokenAccountAddress) {
                // Add transfer instruction to the transaction
                transaction.add(
                    // Transfer the token to the "toTokenAccount" we just created
                    createTransferInstruction(
                        fromTokenAccount.address,
                        toTokenAccountAddress,
                        fromWallet.publicKey,
                        Math.round(amounts[j] * LAMPORTS_PER_SOL),
                        [],
                        TOKEN_PROGRAM_ID
                    )
                )  
            } else {
                //  Get the token account of the toWallet address first
                const toTokenAccountAddress = PublicKey.findProgramAddressSync(
                    [
                        receiverPublicKey.toBuffer(),
                        TOKEN_PROGRAM_ID.toBuffer(),
                        mint.address.toBuffer(),
                    ],
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )[0]

                transaction.add(
                    // Create the token account of the toWallet address
                    createAssociatedTokenAccountInstruction(
                        fromWallet.publicKey,
                        toTokenAccountAddress,
                        receiverPublicKey,
                        mint.address,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    ),
                    // Transfer the token to the "toTokenAccount" we just created
                    createTransferInstruction(
                        fromTokenAccount.address,
                        toTokenAccountAddress,
                        fromWallet.publicKey,
                        Math.round(amounts[j] * LAMPORTS_PER_SOL),
                        [],
                        TOKEN_PROGRAM_ID
                    )
                )
            }
        }

        if (transaction.instructions.length > 0) {
            const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
            console.log(`Batch transaction successful with signature: ${signature}`);
        }
    }
    return
})();

async function getToTokenAccountAddress(connection, receiverPublicKey, mintAddress){
    const result = await connection.getTokenAccountsByOwner(
        receiverPublicKey,
        {
            mint: mintAddress,
        },
        'confirmed'
    )

    if (result.value.length > 0) {
        return result.value[0].pubkey
    }
    return null
}
