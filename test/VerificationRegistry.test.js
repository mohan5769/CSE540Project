//created by kinjal
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerificationRegistry", function () {
  let didRegistry, credentialRegistry, verificationRegistry;
  let admin, issuer, holder, verifier, unregistered;

  const sampleHash = ethers.keccak256(
    ethers.toUtf8Bytes("sample-credential-data"),
  );
  const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-data"));
  const sampleIPFS = "ipfs://QmSampleHash123456789";

  const sessionTitle = "CSE540 Lecture 10";
  const sessionDescription = "Smart contract security";
  const sessionDate = "2026-03-23";
  const sessionEventType = "lecture";

  beforeEach(async function () {
    [admin, issuer, holder, verifier, unregistered] =
      await ethers.getSigners();

    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();

    const CredentialRegistry =
      await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy(
      await didRegistry.getAddress(),
    );

    const VerificationRegistry = await ethers.getContractFactory(
      "VerificationRegistry",
    );
    verificationRegistry = await VerificationRegistry.deploy(
      await didRegistry.getAddress(),
      await credentialRegistry.getAddress(),
    );

    // Register issuer and assign Issuer role
    await didRegistry.connect(issuer).registerDID();
    await didRegistry.connect(admin).assignRole(issuer.address, 2);

    // Register holder (default Holder role)
    await didRegistry.connect(holder).registerDID();

    // Register verifier (default Holder role — no special role needed for verification)
    await didRegistry.connect(verifier).registerDID();

    // Create session and issue a credential
    await credentialRegistry
      .connect(issuer)
      .createSession(
        sessionTitle,
        sessionDescription,
        sessionDate,
        sessionEventType,
      );

    await credentialRegistry
      .connect(issuer)
      .issueCredential(holder.address, 1, sampleHash, sampleIPFS);
  });

  describe("Deployment", function () {
    it("should store the DIDRegistry address", async function () {
      expect(await verificationRegistry.didRegistry()).to.equal(
        await didRegistry.getAddress(),
      );
    });

    it("should store the CredentialRegistry address", async function () {
      expect(await verificationRegistry.credentialRegistry()).to.equal(
        await credentialRegistry.getAddress(),
      );
    });
  });

  describe("verifyAndLog", function () {
    it("should return true for a valid credential with matching hash", async function () {
      const result = await verificationRegistry
        .connect(verifier)
        .verifyAndLog.staticCall(1, sampleHash);
      expect(result).to.equal(true);
    });

    it("should return false for a wrong hash", async function () {
      const result = await verificationRegistry
        .connect(verifier)
        .verifyAndLog.staticCall(1, wrongHash);
      expect(result).to.equal(false);
    });

    it("should return false for a revoked credential", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(1);
      const result = await verificationRegistry
        .connect(verifier)
        .verifyAndLog.staticCall(1, sampleHash);
      expect(result).to.equal(false);
    });

    it("should emit CredentialVerified with true when hash matches and credential is active", async function () {
      const tx = await verificationRegistry
        .connect(verifier)
        .verifyAndLog(1, sampleHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(verificationRegistry, "CredentialVerified")
        .withArgs(1, verifier.address, true, block.timestamp);
    });

    it("should emit CredentialVerified with false when hash does not match", async function () {
      const tx = await verificationRegistry
        .connect(verifier)
        .verifyAndLog(1, wrongHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(verificationRegistry, "CredentialVerified")
        .withArgs(1, verifier.address, false, block.timestamp);
    });

    it("should allow anyone (no role required) to call verifyAndLog", async function () {
      // unregistered address can still verify — verification is public per spec US13
      const result = await verificationRegistry
        .connect(unregistered)
        .verifyAndLog.staticCall(1, sampleHash);
      expect(result).to.equal(true);
    });
  });

  describe("getCredentialStatus", function () {
    it("should return correct credential metadata", async function () {
      const status = await verificationRegistry.getCredentialStatus(1);
      expect(status.id).to.equal(1);
      expect(status.sessionId).to.equal(1);
      expect(status.issuer).to.equal(issuer.address);
      expect(status.holder).to.equal(holder.address);
      expect(status.credentialHash).to.equal(sampleHash);
      expect(status.ipfsURI).to.equal(sampleIPFS);
      expect(status.status).to.equal(0); // Status.Active = 0
    });

    it("should show Revoked status after revocation", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(1);
      const status = await verificationRegistry.getCredentialStatus(1);
      expect(status.status).to.equal(1); // Status.Revoked = 1
    });

    it("should revert for non-existent credential", async function () {
      await expect(
        verificationRegistry.getCredentialStatus(999),
      ).to.be.revertedWith("Credential does not exist");
    });

    it("should be callable by anyone without a role", async function () {
      const status = await verificationRegistry
        .connect(unregistered)
        .getCredentialStatus(1);
      expect(status.id).to.equal(1);
    });
  });

  describe("viewMyCredentials", function () {
    it("should return credential IDs belonging to the caller", async function () {
      const ids = await verificationRegistry
        .connect(holder)
        .viewMyCredentials();
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1);
    });

    it("should return multiple credential IDs when holder has more than one", async function () {
      const hash2 = ethers.keccak256(
        ethers.toUtf8Bytes("second-credential-data"),
      );
      await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, 1, hash2, "ipfs://QmSecondHash");

      const ids = await verificationRegistry
        .connect(holder)
        .viewMyCredentials();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
    });

    it("should return empty array for a registered holder with no credentials", async function () {
      const ids = await verificationRegistry
        .connect(verifier)
        .viewMyCredentials();
      expect(ids.length).to.equal(0);
    });

    it("should revert for an unregistered caller", async function () {
      await expect(
        verificationRegistry.connect(unregistered).viewMyCredentials(),
      ).to.be.revertedWith("Caller must have a registered DID");
    });
  });
});
