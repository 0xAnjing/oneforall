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

## Installation

1. Clone this repository

```bash
git clone https://github.com/0xAnjing/oneforall.git
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

`mintToken.js` is only used for testing purposes to create a random token and mint 1 value to the sender's wallet. Run the following command:

```bash
node mintToken.js
```

## Wallet Addresses File

The `wallet_addresses.txt` file should contain the wallet addresses in the either of the following format:

```
wallet_address_1
wallet_address_2
wallet_address_3
wallet_address_n
```

or

```
wallet_address_1,1
wallet_address_2,0.2
wallet_address_3,3
wallet_address_n,n
```
