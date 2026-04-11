import { useState } from "react";
import { registerDID } from "../lib/contracts";

export default function RegisterDID({ onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await registerDID();
      setMessage("DID registered successfully.");
      await onRegistered?.();
    } catch (err) {
      setError(err.message || "Failed to register DID.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Register DID</h2>
      <p className="muted">
        First-time users must register a DID before using the system.
      </p>
      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Registering..." : "Register DID"}
      </button>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
