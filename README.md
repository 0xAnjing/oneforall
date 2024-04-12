# One For All

Solana Token transfer distribution to multiple wallets in a single transaction.

## Prerequisites

- Node.js
- npm

## Dependencies

- solana/web3.js
- solana/spl-token
- bs58
- dotenv
- fs

## Installion

1. Clone this repository

```bash
git clone xxx
```

2. Install the dependencies

```bash
npm install
```

3. Copy the `.env.example` file to `.env`

```bash
cp .env.example .env
```

4. Update your environment variables in the `.env` file

5. Update `wallet_addresses.txt` file with the wallet addresses and if required the amount of tokens to be transferred to each wallet.

## Usage

To run the batch token transfer, run the following command:

```bash
node index.js
```

To create a random token and mint it, run the following command:

```bash
node mintToken.js
```

`mintToken.js` is only used for testing purposes.
