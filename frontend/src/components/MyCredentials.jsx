import { useEffect, useState } from "react";
import {
  getCredentialById,
  getCredentialsForHolder,
  getSessionById,
} from "../lib/contracts";

export default function MyCredentials({ address }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    if (!address) return;
    setLoading(true);
    setError("");

    try {
      const ids = await getCredentialsForHolder(address);

      const credentials = await Promise.all(
        ids.map(async (id) => {
          const credential = await getCredentialById(id);
          let session = null;

          try {
            session = await getSessionById(credential.sessionId);
          } catch {
            session = null;
          }

          return { ...credential, session };
        }),
      );

      setItems(credentials);
    } catch (err) {
      setError(err.message || "Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [address]);

  return (
    <div className="card">
      <h2>My Credentials</h2>
      <button className="secondary" onClick={loadData} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">No credentials found for this wallet yet.</p>
      ) : null}

      <ul className="clean">
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: 12 }}>
            <strong>Credential ID:</strong> {item.id}
            <br />
            <strong>Status:</strong> {item.statusLabel}
            <br />
            <strong>Session ID:</strong> {item.sessionId}
            <br />
            <strong>Event:</strong> {item.session?.title || "Unknown"}
            <br />
            <strong>Type:</strong> {item.session?.eventType || "Unknown"}
            <br />
            <strong>IPFS URI:</strong>
            <div className="code">{item.ipfsURI}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
