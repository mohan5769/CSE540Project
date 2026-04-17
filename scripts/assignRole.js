const hre = require("hardhat");

async function main() {
  const contractAddress = "0x37052418Eb7311fdFdc4b21D03247f43A458CACE";
  const userAddress = "0x9d2cfdbb026b86b40bd1a75aa6a528047d039256";

  const did = await hre.ethers.getContractAt("DIDRegistry", contractAddress);

  const tx = await did.assignRole(userAddress, 2); // 2 = Issuer
  await tx.wait();

  console.log("Issuer role assigned to:", userAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
