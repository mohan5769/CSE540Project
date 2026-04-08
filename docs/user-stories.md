# User Stories

**Author:** Vibha Swaminathan  
**Role:** DID and Stakeholder Modeling Lead  
**Source:** Section 2 of the DID and Stakeholder Specification

User stories define what each role needs to accomplish and why. Each story follows the format: **As a [role], I want to [action], so that [outcome].**

---

## Holder (Attendee)

**US01 — DID Registration**  
As a Holder, I want to connect my MetaMask wallet and register a DID, so that I have a unique decentralized identity on chain that no one else controls.

**US02 — Avoid Duplicate Registration**  
As a Holder, I want the system to prevent me from registering twice with the same wallet, so that my identity remains unique and consistent.

**US03 — View My Credentials**  
As a Holder, I want to view all attendance credentials issued to my wallet address, so that I can keep track of every event I have attended.

**US04 — Share a Credential**  
As a Holder, I want to share a credential ID with a verifier, so that I can prove my attendance at a specific event without revealing unnecessary personal information.

**US05 — Role Restriction**  
As a Holder, I want the system to prevent me from creating sessions or issuing credentials, so that the integrity of the credentialing process is maintained.

---

## Issuer (Credential Issuer)

**US06 — Role Assignment**  
As an Issuer, I want to be assigned the Issuer role by the Admin before I can take any action, so that only authorized parties can issue official attendance credentials.

**US07 — Create a Session**  
As an Issuer, I want to create a session on chain with a title, description, date, and event type, so that attendance credentials can be tied to a specific, verifiable event.

**US08 — Issue a Credential**  
As an Issuer, I want to issue an attendance credential to a specific holder wallet address, so that the holder receives a tamper proof record of their participation.

**US09 — Off Chain Privacy**  
As an Issuer, I want full credential data to be stored on IPFS and only the hash stored on chain, so that attendee privacy is preserved while authenticity can still be verified.

**US10 — Revoke My Own Credential**  
As an Issuer, I want to revoke a credential that I originally issued, so that I can invalidate a record if it was issued in error or circumstances have changed.

**US11 — Cannot Revoke Others**  
As an Issuer, I want the system to prevent me from revoking credentials issued by another issuer, so that no issuer can interfere with another issuer's records.

**US12 — Event Type Flexibility**  
As an Issuer, I want to specify the event type when creating a session (university class, webinar, workshop, conference, guest lecture), so that the same system can be used across different contexts without any contract changes.

---

## Verifier

**US13 — No Role Required**  
As a Verifier, I want to verify a credential without needing a registered role or any special permissions, so that verification is open and accessible to anyone.

**US14 — Check Revocation Status**  
As a Verifier, I want to instantly see if a credential has been revoked before doing anything else, so that I do not waste time verifying a credential that is already invalid.

**US15 — Hash Verification**  
As a Verifier, I want to fetch the credential JSON from IPFS and compare its hash to the on chain hash, so that I can confirm the credential data has not been tampered with.

**US16 — Clear Result**  
As a Verifier, I want to receive a clear Valid or Invalid result with a reason, so that I can make a confident decision about the credential without any ambiguity.

**US17 — No Write Access**  
As a Verifier, I want the system to ensure I have no write access to any on chain data, so that the verification process cannot accidentally or maliciously alter any records.

---

## Admin

**US18 — Deploy Contracts**  
As an Admin, I want to deploy both the DIDRegistry and CredentialRegistry contracts and be automatically set as the owner, so that I have full control over the system from the start.

**US19 — Assign Issuer Role**  
As an Admin, I want to assign the Issuer role to specific wallet addresses, so that only trusted parties can create sessions and issue credentials.

**US20 — Prevent Self Assignment**  
As an Admin, I want the system to prevent any user from assigning themselves the Issuer role, so that the credentialing system cannot be abused by unauthorized actors.

**US21 — Deactivate a DID**  
As an Admin, I want to deactivate a DID if required, so that compromised or invalid identities can be removed from the system.

**US22 — Role Exclusivity**  
As an Admin, I want assignRole and deactivateDID to be restricted to the Admin wallet only, so that no other role can modify identity or permission records.

---

## Summary Table

| Story | Role | Action | Priority |
|-------|------|--------|----------|
| US01 | Holder | Register DID via MetaMask | High |
| US02 | Holder | Prevent duplicate registration | High |
| US03 | Holder | View own credentials | High |
| US04 | Holder | Share credential ID with verifier | Medium |
| US05 | Holder | Restricted from issuer actions | High |
| US06 | Issuer | Receive role from Admin | High |
| US07 | Issuer | Create session on chain | High |
| US08 | Issuer | Issue credential to holder | High |
| US09 | Issuer | Store full data on IPFS only | High |
| US10 | Issuer | Revoke own credential | High |
| US11 | Issuer | Cannot revoke others credentials | High |
| US12 | Issuer | Flexible event type selection | Medium |
| US13 | Verifier | Verify without a role | High |
| US14 | Verifier | Check revocation first | High |
| US15 | Verifier | Hash comparison for authenticity | High |
| US16 | Verifier | Clear valid or invalid result | High |
| US17 | Verifier | No write access | High |
| US18 | Admin | Deploy contracts and become owner | High |
| US19 | Admin | Assign Issuer role | High |
| US20 | Admin | Prevent self assignment of roles | High |
| US21 | Admin | Deactivate a DID | Medium |
| US22 | Admin | Exclusive access to admin functions | High |
