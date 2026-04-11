# Decentralized Identity and Access Management (IAM) dApp

## Project Description

A blockchain-based system for issuing and verifying attendance credentials using self-sovereign identity (SSI) principles. Users register a Decentralized Identifier (DID) on-chain, issuers (professors, event organizers) issue attendance credentials, and verifiers can check credential authenticity without relying on a central authority. Only credential hashes and status are stored on the Ethereum blockchain for integrity. Full credential data is stored off-chain using IPFS for privacy.

The system is context-agnostic and supports university classes, webinars, guest lectures, workshops, conferences, and any attendance-based event through a configurable `eventType` field.

## System Architecture

The project consists of three smart contracts deployed on Ethereum (Sepolia testnet):

| Contract | Purpose | Author |
|---|---|---|
| `DIDRegistry.sol` | Manages DID registration, role assignment (Holder, Issuer, Verifier), and DID lifecycle (activation/deactivation) | Sivasanker N P |
| `CredentialRegistry.sol` | Handles session creation, credential issuance, revocation, and on-chain hash storage with IPFS references | Mohan Kummarigunta |
| `VerificationRegistry.sol` | Logs credential verification events on-chain for auditability; provides shared modifiers and the CredentialVerified event | Kinjal Chatterjee |

### On-Chain vs Off-Chain Data Split

- **On-chain (Ethereum):** DID records, credential hashes (bytes32), IPFS URIs, credential status (Active/Revoked), session metadata, verification event logs
- **Off-chain (IPFS):** Full credential JSON in W3C Verifiable Credentials format containing personal details, attendance info, and proof data

### Role-Permission Model

| Role | Description | Key Permissions |
|---|---|---|
| Holder | Students, attendees | Register DID, view own credentials, share credential IDs |
| Issuer | Professors, organizers | Create sessions, issue credentials, revoke own credentials |
| Verifier | Recruiters, employers | Verify credentials (public read operation) |
| Admin | Contract deployer | Assign roles, deactivate DIDs |

## Dependencies and Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH from a [faucet](https://sepoliafaucet.com/)

### Dependencies

- **Solidity** ^0.8.20
- **Hardhat** ^2.19.0 — Ethereum development environment
- **@nomicfoundation/hardhat-toolbox** ^4.0.0 — Testing, gas reporting, deployment
- **@openzeppelin/contracts** ^5.0.0 — Standard contract utilities
- **dotenv** ^17.3.1 — Environment variable management

### Installation

```bash
git clone https://github.com/mohan5769/CSE540Project.git
cd CSE540Project
npm install
```

## How to Deploy and Use

### 1. Configure Environment

Create a `.env` file in the root directory:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

### 2. Compile Smart Contracts

```bash
npx hardhat compile
```

### 3. Run Tests

```bash
npx hardhat test
```

This runs 41 tests across DIDRegistry and CredentialRegistry with gas reporting enabled.

### 4. Deploy to Local Network

```bash
npx hardhat run scripts/deploy.js
```

### 5. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Deployment order: DIDRegistry first, then CredentialRegistry (requires DIDRegistry address), then VerificationRegistry (requires both addresses).

### 6. Run the Frontend (in progress)

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` and connect MetaMask (set to Sepolia network) to interact with the dApp.

## Repository Structure

```
contracts/
  DIDRegistry.sol              — DID registration and role management
  CredentialRegistry.sol       — Credential issuance, revocation, and storage
  VerificationRegistry.sol     — Verification event logging and shared modifiers (draft)
test/
  DIDRegistry.test.js          — 15 tests for DID functionality
  CredentialRegistry.test.js   — 26 tests for credential functionality
scripts/
  deploy.js                    — Automated deployment script
docs/
  gas-usage-report.md          — Gas cost analysis per function
  issuance-and-revocation-flows.md — Detailed workflow documentation
  on-chain-vs-off-chain-data-split.md — Data architecture rationale
credential-schema/
  sample-credential.json       — W3C Verifiable Credential format example
```

## Current Status

- DIDRegistry and CredentialRegistry: Implemented and tested (41 passing tests)
- VerificationRegistry: Draft — interfaces, events, and function signatures defined
- Frontend: In progress
- Deployment: Local Hardhat network tested; Sepolia deployment ready
