//created by mohan
const hre = require("hardhat");

async function main() {
  // Deploy DIDRegistry
  const DIDRegistry = await hre.ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didAddress = await didRegistry.getAddress();
  console.log("DIDRegistry deployed to:", didAddress);

  // Deploy CredentialRegistry with DIDRegistry address
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(didAddress);
  await credentialRegistry.waitForDeployment();
  const credAddress = await credentialRegistry.getAddress();
  console.log("CredentialRegistry deployed to:", credAddress);

  // Deploy VerificationRegistry with both addresses
  const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
  const verificationRegistry = await VerificationRegistry.deploy(didAddress, credAddress);
  await verificationRegistry.waitForDeployment();
  const verAddress = await verificationRegistry.getAddress();
  console.log("VerificationRegistry deployed to:", verAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
