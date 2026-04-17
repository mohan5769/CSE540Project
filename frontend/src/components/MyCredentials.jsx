import { useEffect, useState } from "react";
import {
  getCredentialById,
  getCredentialsForHolder,
  getSessionById,
} from "../lib/contracts";
import { fetchJSONFromIPFS } from "../lib/ipfs";

function CredentialCard({ item }) {
  return (
    <div className="credential-tile">
      <div className="credential-top">
        <div>
          <h3>Credential #{item.id}</h3>
          <p className="muted">
            Session #{item.sessionId} ·{" "}
            {item.session?.eventType || "Unknown type"}
          </p>
        </div>
        <span
          className={`status-pill ${
            item.statusLabel === "Active" ? "active" : "revoked"
          }`}
        >
          {item.statusLabel}
        </span>
      </div>

      <div className="credential-meta">
        <div>
          <span className="meta-label">Event</span>
          <span className="meta-value">
            {item.session?.title || "Unknown Event"}
          </span>
        </div>
        <div>
          <span className="meta-label">Date</span>
          <span className="meta-value">{item.session?.date || "N/A"}</span>
        </div>
      </div>

      <div className="credential-section">
        <span className="meta-label">Issuer</span>
        <div className="code">{item.issuer}</div>
      </div>

      <div className="credential-section">
        <span className="meta-label">IPFS URI</span>
        <div className="code">{item.ipfsURI}</div>
      </div>

      {item.payload ? (
        <details className="credential-details">
          <summary>View Credential JSON</summary>
          <pre>{JSON.stringify(item.payload, null, 2)}</pre>
        </details>
      ) : null}
    </div>
  );
}

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
          let payload = null;

          try {
            session = await getSessionById(credential.sessionId);
          } catch {
            session = null;
          }

          try {
            payload = await fetchJSONFromIPFS(credential.ipfsURI);
          } catch {
            payload = null;
          }

          return { ...credential, session, payload };
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
    <div className="card credentials-card">
      <div className="credentials-head">
        <div>
          <h2>My Credentials</h2>
          <p className="muted">
            Credentials issued to the connected wallet, including on-chain
            status and off-chain data.
          </p>
        </div>
        <button
          className="secondary refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <div className="alert error-alert">{error}</div> : null}

      {!loading && items.length === 0 ? (
        <div className="credential-empty">
          <h3>No Credentials Yet</h3>
          <p className="muted">
            This wallet does not have any issued credentials yet. Once an issuer
            issues one, it will appear here.
          </p>
        </div>
      ) : null}

      <div className="credential-list">
        {items.map((item) => (
          <CredentialCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
