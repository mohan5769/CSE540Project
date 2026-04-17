import { useState } from "react";
import {
  getDidForAddress,
  getSessionById,
  issueCredential,
} from "../lib/contracts";
import { pinJSONToIPFS } from "../lib/ipfs";
import { hashCredential } from "../lib/hash";
import { buildAttendanceCredential } from "../lib/credentialBuilder";

export default function IssueCredential({ currentAddress }) {
  const [holderAddress, setHolderAddress] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleIssue(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const [session, issuerDID, holderDID] = await Promise.all([
        getSessionById(sessionId),
        getDidForAddress(currentAddress),
        getDidForAddress(holderAddress),
      ]);

      if (!holderDID) {
        throw new Error(
          "Holder DID not found. Make sure the holder registered first.",
        );
      }

      const credentialPayload = buildAttendanceCredential({
        sessionId: session.id,
        holderAddress,
        holderDID,
        issuerAddress: currentAddress,
        issuerDID,
        sessionTitle: session.title,
        sessionDescription: session.description,
        eventType: session.eventType,
        dateAttended: session.date,
      });

      const ipfsURI = await pinJSONToIPFS(credentialPayload);
      const credentialHash = hashCredential(credentialPayload);
      const credentialId = await issueCredential({
        holder: holderAddress,
        sessionId,
        credentialHash,
        ipfsURI,
      });

      setResult({
        credentialId,
        credentialHash,
        ipfsURI,
        payload: credentialPayload,
        session,
      });

      setHolderAddress("");
      setSessionId("");
    } catch (err) {
      setError(err.message || "Failed to issue credential.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card issuer-card">
      <div className="issuer-head">
        <div>
          <h2>Issue Credential</h2>
          <p className="muted">
            Generate an attendance credential, store the full JSON off-chain,
            and anchor its hash on-chain.
          </p>
        </div>
        <span className="issuer-tag">Hybrid flow</span>
      </div>

      <form onSubmit={handleIssue}>
        <div className="form-group">
          <label>Holder Wallet Address</label>
          <input
            value={holderAddress}
            onChange={(e) => setHolderAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-group">
          <label>Session ID</label>
          <input
            type="number"
            min="1"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="1"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Issuing Credential..." : "Issue Credential"}
        </button>
      </form>

      {error ? (
        <div className="alert error-alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="issuer-result success-panel">
          <h3>Credential Issued</h3>
          <p className="muted">
            The credential JSON was generated off-chain, pinned to IPFS, hashed
            locally, and registered on-chain.
          </p>

          <div className="result-grid">
            <div className="result-box">
              <span className="meta-label">Credential ID</span>
              <strong>{result.credentialId}</strong>
            </div>
            <div className="result-box">
              <span className="meta-label">Session</span>
              <strong>
                {result.session?.title || `#${result.session?.id}`}
              </strong>
            </div>
          </div>

          <div className="credential-section">
            <span className="meta-label">IPFS URI</span>
            <div className="code">{result.ipfsURI}</div>
          </div>

          <div className="credential-section">
            <span className="meta-label">Credential Hash</span>
            <div className="code">{result.credentialHash}</div>
          </div>

          <details className="credential-details">
            <summary>View Issued Credential JSON</summary>
            <pre>{JSON.stringify(result.payload, null, 2)}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
