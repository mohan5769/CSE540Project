import { useState } from "react";
import { revokeCredential } from "../lib/contracts";

export default function RevokeCredential() {
  const [credentialId, setCredentialId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRevoke(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await revokeCredential(credentialId);
      setMessage(`Credential ${credentialId} revoked successfully.`);
      setCredentialId("");
    } catch (err) {
      setError(err.message || "Failed to revoke credential.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Revoke Credential</h2>
      <form onSubmit={handleRevoke}>
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
          {loading ? "Revoking..." : "Revoke"}
        </button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
