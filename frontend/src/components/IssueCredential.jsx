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
    <div className="card">
      <h2>Issue Credential</h2>
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
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Issuing..." : "Issue Credential"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div style={{ marginTop: 12 }}>
          <p className="success">Credential issued successfully.</p>
          <p>
            <strong>Credential ID:</strong> {result.credentialId}
          </p>
          <p>
            <strong>IPFS URI:</strong>
          </p>
          <div className="code">{result.ipfsURI}</div>
          <p>
            <strong>Credential Hash:</strong>
          </p>
          <div className="code">{result.credentialHash}</div>
          <p>
            <strong>Payload:</strong>
          </p>
          <pre>{JSON.stringify(result.payload, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
