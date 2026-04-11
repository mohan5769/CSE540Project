const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;

  console.log(`Deploying contracts with ${deployer.address} on ${networkName}...`);

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
  const credentialAddress = await credentialRegistry.getAddress();
  console.log("CredentialRegistry deployed to:", credentialAddress);

  // Deploy VerificationRegistry with both contract addresses
  const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
  const verificationRegistry = await VerificationRegistry.deploy(
    didAddress,
    credentialAddress,
  );
  await verificationRegistry.waitForDeployment();
  const verificationAddress = await verificationRegistry.getAddress();
  console.log("VerificationRegistry deployed to:", verificationAddress);

  const deployment = {
    network: networkName,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      DIDRegistry: didAddress,
      CredentialRegistry: credentialAddress,
      VerificationRegistry: verificationAddress,
    },
  };

  const rootOutDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(rootOutDir, { recursive: true });
  const rootOutFile = path.join(rootOutDir, `${networkName}.json`);
  fs.writeFileSync(rootOutFile, JSON.stringify(deployment, null, 2));
  console.log(`Saved deployment info to ${rootOutFile}`);

  const frontendOutDir = path.join(__dirname, "..", "frontend", "src", "config");
  fs.mkdirSync(frontendOutDir, { recursive: true });
  const frontendOutFile = path.join(frontendOutDir, "contracts.json");
  fs.writeFileSync(
    frontendOutFile,
    JSON.stringify(
      {
        network: networkName,
        chainId: Number(network.chainId),
        didRegistryAddress: didAddress,
        credentialRegistryAddress: credentialAddress,
        verificationRegistryAddress: verificationAddress,
      },
      null,
      2,
    ),
  );
  console.log(`Saved frontend contract config to ${frontendOutFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
