import { keccak256, toUtf8Bytes } from 'ethers';

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortKeysDeep(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value));
}

export function normalizeCredentialForHashing(credential) {
  const normalized = JSON.parse(JSON.stringify(credential));

  if (!normalized.proof) {
    normalized.proof = {};
  }

  delete normalized.proof.credentialHash;
  delete normalized.proof.ipfsURI;

  return normalized;
}

export function hashCredentialObject(credential) {
  const normalized = normalizeCredentialForHashing(credential);
  const payload = stableStringify(normalized);
  return keccak256(toUtf8Bytes(payload));
}

export function buildAttendanceCredential({
  credentialId,
  sessionId,
  session,
  holderAddress,
  holderDID,
  issuerAddress,
  issuerDID,
  issuerName,
  location,
  duration,
  registryAddress,
  networkName,
}) {
  const issuedAt = new Date().toISOString();

  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'AttendanceCredential'],
    credentialId,
    sessionId,
    issuer: {
      id: issuerDID,
      name: issuerName || 'Credential Issuer',
      walletAddress: issuerAddress,
    },
    credentialSubject: {
      id: holderDID,
      holderDID,
      walletAddress: holderAddress,
    },
    attendance: {
      sessionId,
      sessionTitle: session.title,
      sessionDescription: session.description,
      dateAttended: session.date,
      location: location || 'Not specified',
      duration: duration || 'Not specified',
      eventType: session.eventType,
    },
    issuanceDate: issuedAt,
    issuedAt,
    credentialStatus: {
      type: 'EthereumRevocationRegistry',
      contractAddress: registryAddress,
      network: networkName,
      credentialId,
      status: 'Active',
    },
    proof: {
      type: 'Keccak256Hash',
      hashAlgorithm: 'keccak256',
      hashingNote:
        'proof.credentialHash and proof.ipfsURI are excluded from the normalized hash preimage',
      credentialHash: '',
      ipfsURI: '',
    },
  };
}

export function addProofFields(credential, { credentialHash, ipfsURI }) {
  return {
    ...credential,
    proof: {
      ...credential.proof,
      credentialHash,
      ipfsURI: ipfsURI || '',
    },
  };
}

export function statusLabel(rawStatus) {
  return Number(rawStatus) === 1 ? 'Revoked' : 'Active';
}
