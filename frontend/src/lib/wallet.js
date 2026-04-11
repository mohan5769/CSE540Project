import { ethers } from "ethers";

export async function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function getSigner() {
  const provider = await getBrowserProvider();
  return provider.getSigner();
}

export async function getConnectedAddress() {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return signer.getAddress();
}
