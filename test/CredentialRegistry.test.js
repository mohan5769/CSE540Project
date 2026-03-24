const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  let didRegistry, credentialRegistry;
  let admin, issuer, holder, other;
  const holderDID = "did:ethr:sepolia:0x1234";
  const issuerDID = "did:ethr:sepolia:0x5678";
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample-credential-data"));
  const sampleIPFS = "ipfs://QmSampleHash123456789";

  // Session details
  const sessionTitle = "CSE540 Lecture 10 - Smart Contract Security";
  const sessionDescription = "Covers reentrancy attacks, access control patterns";
  const sessionDate = "2026-03-23";

  beforeEach(async function () {
    [admin, issuer, holder, other] = await ethers.getSigners();

    // Deploy DIDRegistry
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();

    // Deploy CredentialRegistry
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy(await didRegistry.getAddress());

    // Register the issuer and assign Issuer role (Role.Issuer = 2)
    await didRegistry.connect(issuer).registerDID(issuerDID);
    await didRegistry.connect(admin).setRole(issuer.address, 2);

    // Register the holder (default role is Holder)
    await didRegistry.connect(holder).registerDID(holderDID);
  });

  describe("Session Creation", function () {
    it("should allow an issuer to create a session", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .createSession(sessionTitle, sessionDescription, sessionDate);
      await tx.wait();

      const session = await credentialRegistry.getSession(1);
      expect(session.id).to.equal(1);
      expect(session.issuer).to.equal(issuer.address);
      expect(session.title).to.equal(sessionTitle);
      expect(session.description).to.equal(sessionDescription);
      expect(session.date).to.equal(sessionDate);
    });

    it("should emit SessionCreated event", async function () {
      await expect(
        credentialRegistry.connect(issuer).createSession(sessionTitle, sessionDescription, sessionDate)
      )
        .to.emit(credentialRegistry, "SessionCreated")
        .withArgs(1, issuer.address, sessionTitle);
    });

    it("should reject session creation from non-issuer", async function () {
      await expect(
        credentialRegistry.connect(holder).createSession(sessionTitle, sessionDescription, sessionDate)
      ).to.be.revertedWith("Only issuers can perform this action");
    });

    it("should reject empty session title", async function () {
      await expect(
        credentialRegistry.connect(issuer).createSession("", sessionDescription, sessionDate)
      ).to.be.revertedWith("Session title cannot be empty");
    });

    it("should reject empty session date", async function () {
      await expect(
        credentialRegistry.connect(issuer).createSession(sessionTitle, sessionDescription, "")
      ).to.be.revertedWith("Session date cannot be empty");
    });

    it("should increment session IDs", async function () {
      await credentialRegistry.connect(issuer).createSession("Session 1", "Desc 1", "2026-03-23");
      await credentialRegistry.connect(issuer).createSession("Session 2", "Desc 2", "2026-03-24");

      const s1 = await credentialRegistry.getSession(1);
      const s2 = await credentialRegistry.getSession(2);
      expect(s1.id).to.equal(1);
      expect(s2.id).to.equal(2);
    });

    it("should revert for non-existent session", async function () {
      await expect(credentialRegistry.getSession(999)).to.be.revertedWith("Session does not exist");
    });
  });

  describe("Credential Issuance", function () {
    let sessionId;

    beforeEach(async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .createSession(sessionTitle, sessionDescription, sessionDate);
      await tx.wait();
      sessionId = 1;
    });

    it("should allow an issuer to issue a credential", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, sessionId, sampleHash, sampleIPFS);
      await tx.wait();

      const cred = await credentialRegistry.getCredential(1);
      expect(cred.id).to.equal(1);
      expect(cred.sessionId).to.equal(sessionId);
      expect(cred.issuer).to.equal(issuer.address);
      expect(cred.holder).to.equal(holder.address);
      expect(cred.credentialHash).to.equal(sampleHash);
      expect(cred.ipfsURI).to.equal(sampleIPFS);
      expect(cred.status).to.equal(0); // Status.Active = 0
    });

    it("should emit CredentialIssued event", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(holder.address, sessionId, sampleHash, sampleIPFS)
      )
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(1, sessionId, issuer.address, holder.address, sampleHash, sampleIPFS);
    });

    it("should reject issuance from non-issuer", async function () {
      await expect(
        credentialRegistry.connect(holder).issueCredential(holder.address, sessionId, sampleHash, sampleIPFS)
      ).to.be.revertedWith("Only issuers can perform this action");
    });

    it("should reject issuance to unregistered holder", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(other.address, sessionId, sampleHash, sampleIPFS)
      ).to.be.revertedWith("Holder is not registered");
    });

    it("should reject issuance for non-existent session", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(holder.address, 999, sampleHash, sampleIPFS)
      ).to.be.revertedWith("Session does not exist");
    });

    it("should reject empty credential hash", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(holder.address, sessionId, ethers.ZeroHash, sampleIPFS)
      ).to.be.revertedWith("Credential hash cannot be empty");
    });

    it("should reject empty IPFS URI", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(holder.address, sessionId, sampleHash, "")
      ).to.be.revertedWith("IPFS URI cannot be empty");
    });

    it("should increment credential IDs", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, sessionId, sampleHash, sampleIPFS);

      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("second-credential"));
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, sessionId, hash2, "ipfs://QmSecondHash");

      const cred1 = await credentialRegistry.getCredential(1);
      const cred2 = await credentialRegistry.getCredential(2);
      expect(cred1.id).to.equal(1);
      expect(cred2.id).to.equal(2);
    });

    it("should track credentials per session", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, sessionId, sampleHash, sampleIPFS);

      const ids = await credentialRegistry.getCredentialsBySession(sessionId);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1);
    });
  });

  describe("Credential Retrieval", function () {
    beforeEach(async function () {
      await credentialRegistry.connect(issuer).createSession(sessionTitle, sessionDescription, sessionDate);
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, 1, sampleHash, sampleIPFS);
    });

    it("should return credentials by holder", async function () {
      const ids = await credentialRegistry.getCredentialsByHolder(holder.address);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1);
    });

    it("should return credentials by session", async function () {
      const ids = await credentialRegistry.getCredentialsBySession(1);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1);
    });

    it("should revert for non-existent credential", async function () {
      await expect(credentialRegistry.getCredential(999)).to.be.revertedWith(
        "Credential does not exist"
      );
    });
  });

  describe("Credential Verification", function () {
    beforeEach(async function () {
      await credentialRegistry.connect(issuer).createSession(sessionTitle, sessionDescription, sessionDate);
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, 1, sampleHash, sampleIPFS);
    });

    it("should return true for valid credential and matching hash", async function () {
      const valid = await credentialRegistry.verifyCredential(1, sampleHash);
      expect(valid).to.equal(true);
    });

    it("should return false for wrong hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-data"));
      const valid = await credentialRegistry.verifyCredential(1, wrongHash);
      expect(valid).to.equal(false);
    });

    it("should return false for revoked credential", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(1);
      const valid = await credentialRegistry.verifyCredential(1, sampleHash);
      expect(valid).to.equal(false);
    });

    it("anyone can verify a credential", async function () {
      const valid = await credentialRegistry.connect(other).verifyCredential(1, sampleHash);
      expect(valid).to.equal(true);
    });
  });

  describe("Credential Revocation", function () {
    beforeEach(async function () {
      await credentialRegistry.connect(issuer).createSession(sessionTitle, sessionDescription, sessionDate);
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, 1, sampleHash, sampleIPFS);
    });

    it("should allow the original issuer to revoke", async function () {
      await expect(credentialRegistry.connect(issuer).revokeCredential(1))
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(1, issuer.address);

      const cred = await credentialRegistry.getCredential(1);
      expect(cred.status).to.equal(1); // Status.Revoked = 1
    });

    it("should reject revocation from non-issuer", async function () {
      await expect(
        credentialRegistry.connect(other).revokeCredential(1)
      ).to.be.revertedWith("Only the original issuer can revoke");
    });

    it("should reject double revocation", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(1);
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(1)
      ).to.be.revertedWith("Credential is already revoked");
    });

    it("should reject revocation of non-existent credential", async function () {
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(999)
      ).to.be.revertedWith("Credential does not exist");
    });
  });
});
