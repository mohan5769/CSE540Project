import { useState } from "react";
import { getCredentialById, verifyCredentialByHash } from "../lib/contracts";
import { fetchJSONFromIPFS } from "../lib/ipfs";
import { hashCredential } from "../lib/hash";

export default function VerifyCredential() {
  const [credentialId, setCredentialId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const credential = await getCredentialById(credentialId);

      if (credential.statusLabel !== "Active") {
        setResult({
          valid: false,
          reason: "Credential is revoked.",
          credential,
          payload: null,
          localHash: null,
          contractValid: false,
        });
        return;
      }

      const payload = await fetchJSONFromIPFS(credential.ipfsURI);
      const localHash = hashCredential(payload);
      const hashMatches =
        localHash.toLowerCase() === credential.credentialHash.toLowerCase();

      const contractValid = await verifyCredentialByHash(
        credentialId,
        localHash,
      );

      setResult({
        valid: hashMatches && contractValid,
        reason:
          hashMatches && contractValid
            ? "Credential is valid and matches the on-chain record."
            : "Credential data does not match the on-chain hash.",
        credential,
        payload,
        localHash,
        contractValid,
      });
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  const statusClass = result?.valid
    ? "verify-status valid"
    : "verify-status invalid";

  return (
    <div className="card verify-card">
      <div className="verify-header">
        <div>
          <h2>Verify Credential</h2>
          <p className="muted">
            Enter a credential ID to validate it using on-chain hash comparison
            and IPFS data.
          </p>
        </div>
      </div>

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>Credential ID</label>
          <input
            type="number"
            min="1"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            placeholder="Enter credential ID"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify Credential"}
        </button>
      </form>

      {error ? (
        <div className="alert error-alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="verify-result">
          <div className={statusClass}>
            <div className="verify-icon">{result.valid ? "✓" : "!"}</div>
            <div>
              <h3>
                {result.valid ? "Valid Credential" : "Invalid Credential"}
              </h3>
              <p>{result.reason}</p>
            </div>
          </div>

          <div className="verify-grid">
            <div className="verify-box">
              <h4>On-chain Record</h4>
              <p>
                <strong>Credential ID:</strong> {result.credential.id}
              </p>
              <p>
                <strong>Status:</strong> {result.credential.statusLabel}
              </p>
              <p>
                <strong>Session ID:</strong> {result.credential.sessionId}
              </p>
              <p>
                <strong>Issuer:</strong>
              </p>
              <div className="code">{result.credential.issuer}</div>
              <p>
                <strong>Holder:</strong>
              </p>
              <div className="code">{result.credential.holder}</div>
            </div>

            <div className="verify-box">
              <h4>Hash Comparison</h4>
              <p>
                <strong>On-chain Hash:</strong>
              </p>
              <div className="code">{result.credential.credentialHash}</div>

              {result.localHash ? (
                <>
                  <p>
                    <strong>Local Hash:</strong>
                  </p>
                  <div className="code">{result.localHash}</div>
                </>
              ) : null}

              <p style={{ marginTop: 10 }}>
                <strong>Contract Verification:</strong>{" "}
                {result.contractValid ? "Passed" : "Failed"}
              </p>
            </div>
          </div>

          <div className="verify-box" style={{ marginTop: 14 }}>
            <h4>IPFS / Off-chain Data</h4>
            <p>
              <strong>IPFS URI:</strong>
            </p>
            <div className="code">{result.credential.ipfsURI}</div>

            {result.payload ? (
              <>
                <p>
                  <strong>Credential JSON:</strong>
                </p>
                <pre>{JSON.stringify(result.payload, null, 2)}</pre>
              </>
            ) : (
              <p className="muted">No off-chain payload loaded.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="verify-empty">
          <p className="muted">
            Verification checks whether the off-chain credential data matches
            the hash stored on-chain.
          </p>
        </div>
      )}
    </div>
  );
}
