# On-Chain vs Off-Chain Data Split

## Overview

To preserve privacy and reduce blockchain storage costs, only minimal credential metadata is stored on-chain. The full credential data is stored off-chain on IPFS. The on-chain hash allows anyone to verify the integrity of the off-chain data without trusting a central authority.

## What Goes On-Chain (CredentialRegistry Smart Contract)

Stored in the `Credential` struct on the Sepolia blockchain:

| Field            | Type      | Description                                           |
|------------------|-----------|-------------------------------------------------------|
| `id`             | uint256   | Auto-incremented credential ID                        |
| `sessionId`      | uint256   | References the session this credential belongs to     |
| `issuer`         | address   | Wallet address of the issuer who created it           |
| `holder`         | address   | Wallet address of the credential holder               |
| `credentialHash` | bytes32   | keccak256 hash of the full credential JSON            |
| `ipfsURI`        | string    | IPFS content identifier (CID) pointing to full data   |
| `status`         | Status    | Active or Revoked                                     |
| `issuedAt`       | uint256   | Block timestamp when the credential was issued        |

Stored in the `Session` struct on-chain:

| Field         | Type    | Description                                 |
|---------------|---------|---------------------------------------------|
| `id`          | uint256 | Auto-incremented session ID                 |
| `issuer`      | address | Wallet address of the session creator       |
| `title`       | string  | Title of the session                        |
| `description` | string  | Description of the session                  |
| `date`        | string  | Date of the session (e.g. "2026-03-23")     |
| `createdAt`   | uint256 | Block timestamp when the session was created|

## What Goes Off-Chain (IPFS)

The full credential JSON is stored on IPFS. This includes all the human-readable details that would be too expensive and privacy-sensitive to store on-chain:

| Field                | Description                                              |
|----------------------|----------------------------------------------------------|
| `credentialId`       | Matches the on-chain credential ID                       |
| `sessionId`          | Matches the on-chain session ID                          |
| `issuer.id`          | Issuer's DID (e.g. did:ethr:sepolia:0x...)               |
| `issuer.name`        | Issuer's display name                                    |
| `issuer.walletAddress` | Issuer's Ethereum wallet address                       |
| `credentialSubject.holderDID` | Holder's DID                                    |
| `credentialSubject.walletAddress` | Holder's Ethereum wallet address              |
| `attendance.sessionTitle` | Full session title                                  |
| `attendance.sessionDescription` | Full session description                      |
| `attendance.dateAttended` | Date the holder attended                            |
| `attendance.location`    | Physical or virtual location                         |
| `attendance.duration`    | Duration of the session                              |
| `attendance.eventType`   | Type of event (lecture, workshop, webinar, etc.)     |
| `issuanceDate`       | ISO 8601 timestamp of issuance                           |
| `credentialStatus`   | Pointer back to the on-chain contract for status checks  |
| `proof.credentialHash` | The keccak256 hash (matches on-chain)                  |
| `proof.ipfsURI`      | Self-referencing IPFS URI                                |

## Why This Split?

### Privacy
Personal details (names, DIDs, session descriptions) stay off-chain. Only the holder decides who sees the full credential by sharing the IPFS URI.

### Cost
Storing strings on Ethereum is expensive. By only storing a 32-byte hash and a short URI on-chain, gas costs are minimized.

### Verifiability
Anyone can verify a credential without accessing the full data:
1. Fetch the credential JSON from IPFS using the `ipfsURI`
2. Compute the keccak256 hash of the JSON
3. Call `verifyCredential(credentialId, computedHash)` on-chain
4. If the hash matches and status is Active, the credential is valid

### Immutability
IPFS content is immutable — once pinned, the data at a given CID cannot be changed. If the credential data were modified, it would produce a different hash, and on-chain verification would fail. Revocation only changes the on-chain status; the IPFS data remains untouched.
