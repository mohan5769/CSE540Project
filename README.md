# Decentralized Identity and Access Management (IAM) dApp

## Project Description

A blockchain-based system for issuing and verifying attendance credentials. Users register a Decentralized Identifier (DID) on-chain, issuers (professors, event organizers) issue attendance credentials, and verifiers can check credential authenticity without relying on a central authority. Only credential hashes and status are stored on the Ethereum blockchain for integrity. Full credential data is stored off-chain using IPFS for privacy.

## Dependencies and Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH from a [faucet](https://sepoliafaucet.com/)

### Installation

```bash
git clone https://github.com/<your-org>/iam-dapp.git
cd iam-dapp
npm install
```

## How to Deploy and Use

### 1. Configure Environment

Create a `.env` file in the root directory:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

### 2. Compile and Deploy Smart Contracts

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Run the Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` and connect MetaMask (set to Sepolia network) to interact with the dApp.
