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
            ? "Credential is valid."
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

  return (
    <div className="card">
      <h2>Verify Credential</h2>
      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>Credential ID</label>
          <input
            type="number"
            min="1"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div style={{ marginTop: 12 }}>
          <p className={result.valid ? "success" : "error"}>{result.reason}</p>

          {result.credential ? (
            <>
              <p>
                <strong>On-chain Hash:</strong>
              </p>
              <div className="code">{result.credential.credentialHash}</div>

              {result.localHash ? (
                <>
                  <p>
                    <strong>Locally Computed Hash:</strong>
                  </p>
                  <div className="code">{result.localHash}</div>
                </>
              ) : null}

              <p>
                <strong>Status:</strong> {result.credential.statusLabel}
              </p>
              <p>
                <strong>IPFS URI:</strong>
              </p>
              <div className="code">{result.credential.ipfsURI}</div>
            </>
          ) : null}

          {result.payload ? (
            <>
              <p>
                <strong>Credential JSON:</strong>
              </p>
              <pre>{JSON.stringify(result.payload, null, 2)}</pre>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
