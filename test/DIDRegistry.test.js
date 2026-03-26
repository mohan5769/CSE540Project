const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DIDRegistry", function () {
  let didRegistry;
  let admin, issuer, holder, other;

  beforeEach(async function () {
    [admin, issuer, holder, other] = await ethers.getSigners();

    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();

    // Register holder and issuer; assign Issuer role to issuer
    await didRegistry.connect(holder).registerDID();
    await didRegistry.connect(issuer).registerDID();
    await didRegistry.connect(admin).assignRole(issuer.address, 2); // Role.Issuer = 2
  });

  describe("DID Registration", function () {
    it("should allow a user to register a DID", async function () {
      expect(await didRegistry.isRegistered(holder.address)).to.equal(true);
    });

    it("should auto-generate the DID string from wallet address", async function () {
      const did = await didRegistry.getDID(holder.address);
      expect(did).to.equal("did:ethr:" + holder.address.toLowerCase());
    });

    it("should assign Holder role by default", async function () {
      expect(await didRegistry.getRole(holder.address)).to.equal(1); // Role.Holder = 1
    });

    it("should emit DIDRegistered event", async function () {
      const expectedDID = "did:ethr:" + other.address.toLowerCase();
      const tx = await didRegistry.connect(other).registerDID();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(didRegistry, "DIDRegistered")
        .withArgs(other.address, expectedDID, block.timestamp);
    });

    it("should revert if user registers twice", async function () {
      await expect(
        didRegistry.connect(holder).registerDID(),
      ).to.be.revertedWith("DID already registered");
    });
  });

  describe("Role Assignment", function () {
    it("should allow admin to assign Issuer role", async function () {
      expect(await didRegistry.getRole(issuer.address)).to.equal(2); // Role.Issuer = 2
    });

    it("should emit RoleAssigned event", async function () {
      const tx = await didRegistry.connect(admin).assignRole(holder.address, 3);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(didRegistry, "RoleAssigned")
        .withArgs(holder.address, 3, block.timestamp); // Role.Verifier = 3
    });

    it("should reject role assignment from a non-admin", async function () {
      await expect(
        didRegistry.connect(holder).assignRole(issuer.address, 2),
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should reject role assignment to an unregistered address", async function () {
      await expect(
        didRegistry.connect(admin).assignRole(other.address, 2),
      ).to.be.revertedWith("User is not registered");
    });

    it("should reject role assignment to a deactivated DID", async function () {
      await didRegistry.connect(admin).deactivateDID(holder.address);
      await expect(
        didRegistry.connect(admin).assignRole(holder.address, 2),
      ).to.be.revertedWith("DID is deactivated");
    });
  });

  describe("DID Deactivation", function () {
    it("should allow admin to deactivate a DID", async function () {
      await didRegistry.connect(admin).deactivateDID(holder.address);
      expect(await didRegistry.isActive(holder.address)).to.equal(false);
    });

    it("should emit DIDDeactivated event", async function () {
      const tx = await didRegistry.connect(admin).deactivateDID(holder.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(didRegistry, "DIDDeactivated")
        .withArgs(holder.address, block.timestamp);
    });

    it("should reject deactivation from a non-admin", async function () {
      await expect(
        didRegistry.connect(holder).deactivateDID(holder.address),
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should reject deactivating an unregistered address", async function () {
      await expect(
        didRegistry.connect(admin).deactivateDID(other.address),
      ).to.be.revertedWith("User is not registered");
    });

    it("should reject deactivating an already deactivated DID", async function () {
      await didRegistry.connect(admin).deactivateDID(holder.address);
      await expect(
        didRegistry.connect(admin).deactivateDID(holder.address),
      ).to.be.revertedWith("DID is already deactivated");
    });
  });
});
