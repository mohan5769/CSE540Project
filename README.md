# CSE540Project
Decentralized IAM dApp for issuing and verifying attendance credentials using Ethereum smart contracts, DIDs, and IPFS. Built with Solidity, React, and MetaMask.


Readme · MDCopyDecentralized Identity and Access Management (IAM) dApp
Team 2 — CSE 540, Arizona State University
A blockchain-based decentralized attendance credential system where users own their attendance records, issuers grant them, and anyone can verify them without trusting a central authority.

Project Description
Current attendance tracking systems rely on centralized databases controlled by a single organization. These systems lack transparency, are prone to manipulation, and do not give users ownership of their records. Verifiers must contact the original issuer every time they need to confirm attendance, creating a bottleneck and single point of failure.
This project builds a Decentralized IAM dApp that solves these problems by:

Assigning each user a Decentralized Identifier (DID) registered on-chain
Allowing issuers (professors, event organizers) to issue verifiable attendance credentials
Storing only credential hashes and status on-chain for integrity and immutability
Keeping full credential data off-chain (IPFS) for privacy
Enabling trustless verification — anyone can verify a credential without contacting the issuer

System Actors
ActorRoleExampleHolderOwns a DID, receives and presents credentialsStudentIssuerConfirms attendance and issues credentialsProfessorVerifierChecks credential authenticity on-chainAdmin, Recruiter

Architecture
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Holder  │   │  Issuer  │   │ Verifier │
│(Student) │   │(Professor)│  │ (Admin)  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     ▼              ▼              ▼
┌─────────────────────────────────────────┐
│            MetaMask Wallet              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         React dApp (Frontend)           │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌───────────────┐   ┌─────────────┐
│ DID Registry │  │  Credential   │──▶│ Off-chain DB│
│  (Contract)  │  │   Registry    │   │   (IPFS)    │
└──────┬───────┘  └───────┬───────┘   └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────────────────┐
│        Ethereum Blockchain (Sepolia)    │
└─────────────────────────────────────────┘

Tech Stack
ComponentTechnologyBlockchainEthereum (Sepolia Testnet)Smart ContractsSolidityDevelopment FrameworkHardhatFrontendReactWalletMetaMaskContract InteractionEthers.jsOff-chain StorageIPFSTestingHardhat + Chai

Dependencies
Prerequisites

Node.js (v18 or higher)
npm or yarn
MetaMask browser extension
Sepolia testnet ETH (from a faucet)

Installation
bash# Clone the repository
git clone https://github.com/<your-org>/iam-dapp.git
cd iam-dapp

# Install dependencies
npm install

# Compile smart contracts
npx hardhat compile

# Run tests
npx hardhat test

Setup Instructions
1. Configure Environment
Create a .env file in the root directory:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
2. Deploy Smart Contracts
bash# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
3. Run the Frontend
bashcd frontend
npm install
npm start
The app will be available at http://localhost:3000. Connect your MetaMask wallet (set to Sepolia network) to interact with the dApp.

Smart Contracts
DIDRegistry.sol
Handles user registration and DID management.

registerDID() — Register a new DID for the caller's wallet address
getDID(address) — Retrieve the DID associated with an address
isRegistered(address) — Check if an address has a registered DID
setRole(address, role) — Assign a role (Holder, Issuer, Verifier) to a DID
getRole(address) — Get the role assigned to a DID

CredentialRegistry.sol
Handles credential issuance, storage, and verification.

issueCredential(holder, credentialHash, ipfsURI) — Issue a new attendance credential
revokeCredential(credentialId) — Revoke an issued credential
verifyCredential(credentialId, credentialHash) — Verify a credential's hash and status
getCredential(credentialId) — Retrieve credential metadata
getCredentialsByHolder(holder) — Get all credentials for a specific holder


Project Structure
iam-dapp/
├── contracts/
│   ├── DIDRegistry.sol          # DID registration and role management
│   └── CredentialRegistry.sol   # Credential issuance, revocation, verification
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── IAMdApp.test.js          # Contract tests
├── frontend/
│   ├── src/
│   │   ├── components/          # React UI components
│   │   ├── utils/               # Ethers.js contract interaction helpers
│   │   └── App.js               # Main application
│   └── package.json
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md

Team Roles
MemberRoleResponsibilitiesVibha SwaminathanDID and Stakeholder Modeling LeadDefine Holder/Issuer/Verifier roles, design identity lifecycle, define user interactionsMohan KummariguntaCredential Design and Issuance LeadDesign credential structure, define issuance/revocation logic, decide on-chain vs off-chain data splitAkshith Reddy GantaSmart Contract Architecture LeadDesign DID Registry contract, design Credential Registry contract, define events and access controlSivasanker N. PadmapriyaSmart Contract Implementation and Testing LeadImplement Solidity contracts, write tests for DID registration/issuance/verification, analyze gas usageKinjal ChatterjeeVerification Flow and Integration LeadImplement credential verification flow, manage IPFS off-chain storage, connect React frontend with smart contracts
All members will collaboratively contribute to documentation, testing, and the final presentation.

References

Gartner, "Innovation Insight for Decentralized Identity," 2022.
C. Allen, "The Path to Self-Sovereign Identity," 2016.
W3C, "Decentralized Identifiers (DIDs) v1.0," 2022.
W3C, "Verifiable Credentials Data Model v2.0," 2025.
POAP Inc., "Proof of Attendance Protocol," 2021.


License
This project is developed for CSE 540 at Arizona State University.
