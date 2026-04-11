import { ethers } from "ethers";
import CONTRACTS from "../config/contracts.json";
import { getBrowserProvider, getSigner } from "./wallet";

const DID_ABI = [
  "function admin() view returns (address)",
  "function registerDID()",
  "function getDID(address _user) view returns (string)",
  "function isRegistered(address _user) view returns (bool)",
  "function getRole(address _user) view returns (uint8)",
  "function isActive(address _user) view returns (bool)",
];

const CREDENTIAL_ABI = [
  "event SessionCreated(uint256 indexed sessionId, address indexed issuer, string eventType, uint256 timestamp)",
  "event CredentialIssued(uint256 indexed credentialId, uint256 indexed sessionId, address indexed issuer, address holder, bytes32 credentialHash, string ipfsURI)",
  "event CredentialRevoked(uint256 indexed credentialId, address indexed issuer, uint256 timestamp)",

  "function createSession(string _title, string _description, string _date, string _eventType) returns (uint256)",
  "function getSession(uint256 _sessionId) view returns (uint256 id, address issuer, string title, string description, string date, string eventType, uint256 createdAt)",
  "function getCredentialsBySession(uint256 _sessionId) view returns (uint256[] memory)",
  "function issueCredential(address _holder, uint256 _sessionId, bytes32 _credentialHash, string _ipfsURI) returns (uint256)",
  "function revokeCredential(uint256 _credentialId)",
  "function verifyCredential(uint256 _credentialId, bytes32 _credentialHash) view returns (bool)",
  "function getCredential(uint256 _credentialId) view returns (uint256 id, uint256 sessionId, address issuer, address holder, bytes32 credentialHash, string ipfsURI, uint8 status, uint256 issuedAt)",
  "function getCredentialsByHolder(address _holder) view returns (uint256[] memory)",
];

const ROLE_LABELS = {
  0: "None",
  1: "Holder",
  2: "Issuer",
  3: "Verifier",
};

const STATUS_LABELS = {
  0: "Active",
  1: "Revoked",
};

function requireAddress(value, name) {
  if (!value) {
    throw new Error(
      `${name} address is missing in frontend/src/config/contracts.json`,
    );
  }
}

export async function getContracts() {
  requireAddress(CONTRACTS.didRegistryAddress, "DIDRegistry");
  requireAddress(CONTRACTS.credentialRegistryAddress, "CredentialRegistry");

  const provider = await getBrowserProvider();
  const signer = await getSigner();

  return {
    provider,
    signer,
    didRegistry: new ethers.Contract(
      CONTRACTS.didRegistryAddress,
      DID_ABI,
      signer,
    ),
    credentialRegistry: new ethers.Contract(
      CONTRACTS.credentialRegistryAddress,
      CREDENTIAL_ABI,
      signer,
    ),
    credentialInterface: new ethers.Interface(CREDENTIAL_ABI),
  };
}

export async function loadIdentity(address) {
  const { didRegistry } = await getContracts();

  const admin = await didRegistry.admin();
  const isRegistered = await didRegistry.isRegistered(address);

  if (!isRegistered) {
    return {
      address,
      admin,
      isAdmin: address.toLowerCase() === admin.toLowerCase(),
      isRegistered: false,
      did: "",
      role: 0,
      roleLabel: "None",
      active: false,
    };
  }

  const [did, role, active] = await Promise.all([
    didRegistry.getDID(address),
    didRegistry.getRole(address),
    didRegistry.isActive(address),
  ]);

  const roleNumber = Number(role);

  return {
    address,
    admin,
    isAdmin: address.toLowerCase() === admin.toLowerCase(),
    isRegistered: true,
    did,
    role: roleNumber,
    roleLabel: ROLE_LABELS[roleNumber] || "Unknown",
    active,
  };
}

export async function registerDID() {
  const { didRegistry } = await getContracts();
  const tx = await didRegistry.registerDID();
  await tx.wait();
}

export async function createSession({ title, description, date, eventType }) {
  const { credentialRegistry, credentialInterface } = await getContracts();
  const tx = await credentialRegistry.createSession(
    title,
    description,
    date,
    eventType,
  );
  const receipt = await tx.wait();

  let sessionId = null;

  for (const log of receipt.logs) {
    try {
      const parsed = credentialInterface.parseLog(log);
      if (parsed && parsed.name === "SessionCreated") {
        sessionId = parsed.args.sessionId.toString();
        break;
      }
    } catch {
      // ignore logs from other contracts
    }
  }

  return sessionId;
}

export async function getSessionById(sessionId) {
  const { credentialRegistry } = await getContracts();
  const result = await credentialRegistry.getSession(sessionId);

  return {
    id: result.id.toString(),
    issuer: result.issuer,
    title: result.title,
    description: result.description,
    date: result.date,
    eventType: result.eventType,
    createdAt: result.createdAt.toString(),
  };
}

export async function issueCredential({
  holder,
  sessionId,
  credentialHash,
  ipfsURI,
}) {
  const { credentialRegistry, credentialInterface } = await getContracts();
  const tx = await credentialRegistry.issueCredential(
    holder,
    sessionId,
    credentialHash,
    ipfsURI,
  );
  const receipt = await tx.wait();

  let credentialId = null;

  for (const log of receipt.logs) {
    try {
      const parsed = credentialInterface.parseLog(log);
      if (parsed && parsed.name === "CredentialIssued") {
        credentialId = parsed.args.credentialId.toString();
        break;
      }
    } catch {
      // ignore logs from other contracts
    }
  }

  return credentialId;
}

export async function revokeCredential(credentialId) {
  const { credentialRegistry } = await getContracts();
  const tx = await credentialRegistry.revokeCredential(credentialId);
  await tx.wait();
}

export async function verifyCredentialByHash(credentialId, credentialHash) {
  const { credentialRegistry } = await getContracts();
  return credentialRegistry.verifyCredential(credentialId, credentialHash);
}

export async function getCredentialById(credentialId) {
  const { credentialRegistry } = await getContracts();
  const result = await credentialRegistry.getCredential(credentialId);

  const statusNumber = Number(result.status);

  return {
    id: result.id.toString(),
    sessionId: result.sessionId.toString(),
    issuer: result.issuer,
    holder: result.holder,
    credentialHash: result.credentialHash,
    ipfsURI: result.ipfsURI,
    status: statusNumber,
    statusLabel: STATUS_LABELS[statusNumber] || "Unknown",
    issuedAt: result.issuedAt.toString(),
  };
}

export async function getCredentialsForHolder(holderAddress) {
  const { credentialRegistry } = await getContracts();
  const ids = await credentialRegistry.getCredentialsByHolder(holderAddress);
  return ids.map((id) => id.toString());
}

export async function getDidForAddress(address) {
  const { didRegistry } = await getContracts();
  return didRegistry.getDID(address);
}
