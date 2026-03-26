# Gas Usage Report

**Solidity version:** 0.8.20  
**Optimizer:** disabled  
**Network:** Hardhat local (block limit: 60,000,000 gas)  
**Tool:** hardhat-gas-reporter (run via `npx hardhat test`)

---

## Function Gas Costs

| Contract           | Function         | Avg Gas | Notes                                                                    |
| ------------------ | ---------------- | ------- | ------------------------------------------------------------------------ |
| DIDRegistry        | registerDID      | 252,934 | Expensive because it stores a full DID struct and string on-chain        |
| DIDRegistry        | assignRole       | 36,099  | Cheap, just a single mapping write                                       |
| DIDRegistry        | deactivateDID    | 28,538  | Cheap, just a single bool write                                          |
| CredentialRegistry | createSession    | 284,608 | Expensive because it stores multiple strings on-chain                    |
| CredentialRegistry | issueCredential  | 292,791 | Most expensive, stores the full Credential struct and updates two arrays |
| CredentialRegistry | revokeCredential | 50,390  | Cheap, just a single status write                                        |

---

## Deployment Costs

| Contract           | Avg Gas   | % of Block Limit |
| ------------------ | --------- | ---------------- |
| CredentialRegistry | 2,226,605 | 3.7%             |
| DIDRegistry        | 1,471,929 | 2.5%             |

---

## Analysis

**issueCredential and createSession are the most expensive functions.**
Both store string fields directly on-chain inside structs (title, description, date, eventType, ipfsURI). Strings are dynamically sized and cost significantly more gas than fixed types like `uint256` or `bytes32`. This is a deliberate tradeoff since storing the IPFS URI and session metadata on-chain keeps the system fully verifiable without relying on a centralized backend.

**registerDID is also relatively expensive.**
It stores the auto-generated DID string on-chain and writes to two mappings (address to DID struct, and DID string to address). This is a one-time cost per user so it is acceptable.

**assignRole, deactivateDID, and revokeCredential are all cheap.**
These functions only update a single field in an existing struct or mapping without allocating new storage slots, so gas is minimal.

**Deployment costs are low.**
Both contracts deploy well under 4% of the block gas limit, so deployment on Sepolia is straightforward with no gas concerns.
