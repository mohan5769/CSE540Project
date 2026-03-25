# Issuance and Revocation Flows

## Credential Issuance Flow

### Prerequisites
- The Issuer has a registered DID and has been assigned the `Issuer` role by the admin
- The Holder has a registered DID (default role: `Holder`)
- Both parties have connected their MetaMask wallets to the dApp

### Step-by-Step Issuance Flow

```
Step 1: Issuer Creates a Session
         │
         ▼
Step 2: Issuer Selects a Holder (Attendee)
         │
         ▼
Step 3: Build Credential JSON Off-Chain
         │
         ▼
Step 4: Hash the Credential JSON with keccak256
         │
         ▼
Step 5: Pin the Credential JSON to IPFS
         │
         ▼
Step 6: Call issueCredential() On-Chain
         │
         ▼
Step 7: Credential Issued (Event Emitted)
```

### Step 1: Issuer Creates a Session

The Issuer calls `createSession(title, description, date, eventType)` on the CredentialRegistry contract.

- **Who can call:** Only addresses with the `Issuer` role
- **What happens on-chain:** A new `Session` struct is stored with an auto-incremented ID, including the event type
- **Event emitted:** `SessionCreated(sessionId, issuerAddress, eventType, timestamp)`

Example:
```
createSession(
  "CSE540 Lecture 10 - Smart Contract Security",
  "Covers reentrancy attacks, access control patterns",
  "2026-03-23",
  "lecture"
)
// Returns sessionId = 1
```

### Step 2: Issuer Selects a Holder

The Issuer selects the Holder's wallet address from the dApp interface. The Holder must already be registered in the DIDRegistry.

### Step 3: Build Credential JSON Off-Chain

The dApp frontend constructs the full credential JSON containing all attendance details. This JSON follows the W3C Verifiable Credentials format. See `credential-schema/sample-credential.json` for the full structure.

Key fields populated:
- `credentialId` — will be set after on-chain issuance (or predicted from contract state)
- `sessionId` — from Step 1
- `issuer.id` — Issuer's DID from DIDRegistry
- `credentialSubject.holderDID` — Holder's DID from DIDRegistry
- `attendance.sessionTitle` — from the session
- `attendance.dateAttended` — session date
- All other attendance metadata (location, duration, eventType)

### Step 4: Hash the Credential JSON

The dApp computes the keccak256 hash of the credential JSON string:

```javascript
const credentialJSON = JSON.stringify(credential);
const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialJSON));
```

This hash serves as the on-chain fingerprint of the credential. If the off-chain data is ever modified, the hash will no longer match.

### Step 5: Pin the Credential JSON to IPFS

The dApp pins the credential JSON to IPFS (via Pinata, Infura IPFS, or another pinning service). This returns a Content Identifier (CID).

```
ipfsURI = "ipfs://QmXYZ...theCIDreturnedByIPFS"
```

The IPFS CID is deterministic — the same content always produces the same CID. This means the data is content-addressed and immutable.

### Step 6: Call issueCredential() On-Chain

The Issuer calls the smart contract:

```
issueCredential(
  holderAddress,    // 0xHOLDER...
  sessionId,        // 1
  credentialHash,   // 0xABC123...
  ipfsURI           // "ipfs://QmXYZ..."
)
// Returns credentialId = 1
```

**On-chain validations:**
- Caller must have the `Issuer` role
- Holder must be registered in DIDRegistry
- Session must exist
- Credential hash must not be empty
- IPFS URI must not be empty

**What happens on-chain:**
- A new `Credential` struct is stored with status `Active`
- The credential ID is added to the holder's credential list
- The credential ID is added to the session's credential list

### Step 7: Credential Issued

**Event emitted:**
```
CredentialIssued(credentialId, sessionId, issuerAddress, holderAddress, credentialHash, ipfsURI)
```

The Holder can now view their credential in the dApp and present it to Verifiers.

---

## Credential Revocation Flow

### When to Revoke
- Credential was issued in error
- Attendance record was found to be fraudulent
- Administrative correction needed

### Step-by-Step Revocation Flow

```
Step 1: Issuer Initiates Revocation
         │
         ▼
Step 2: On-Chain Status Changes from Active to Revoked
         │
         ▼
Step 3: Revocation Confirmed (Event Emitted)
```

### Step 1: Issuer Initiates Revocation

The original Issuer calls `revokeCredential(credentialId)` on the CredentialRegistry contract.

**Access control:** Only the original issuer (the address that issued the credential) can revoke it. Not even the admin can revoke someone else's credential.

### Step 2: On-Chain Status Update

**On-chain validations:**
- Credential must exist
- Caller must be the original issuer of that specific credential
- Credential must currently have `Active` status (cannot revoke twice)

**What happens on-chain:**
- The credential's `status` field changes from `Active` (0) to `Revoked` (1)

**What happens off-chain:**
- Nothing. The IPFS data remains unchanged. IPFS content is immutable — the original credential JSON stays at the same CID. The revocation is reflected solely through the on-chain status.

### Step 3: Revocation Confirmed

**Event emitted:**
```
CredentialRevoked(credentialId, issuerAddress, timestamp)
```

After revocation:
- `verifyCredential(credentialId, hash)` will return `false` even if the hash matches
- `getCredential(credentialId)` will show `status = Revoked`
- The credential remains in the holder's credential list (it is not deleted, just marked as revoked)

---

## Verification Flow (For Reference)

While verification is Kinjal's domain, here is how the credential data supports it:

1. A Verifier obtains a `credentialId` (from the Holder presenting it)
2. The Verifier calls `getCredential(credentialId)` to get the `ipfsURI`
3. The Verifier fetches the full credential JSON from IPFS
4. The Verifier computes `keccak256(credentialJSON)`
5. The Verifier calls `verifyCredential(credentialId, computedHash)`
6. If the function returns `true` — the credential is valid (hash matches and status is Active)
7. If it returns `false` — either the data was tampered with or the credential was revoked
