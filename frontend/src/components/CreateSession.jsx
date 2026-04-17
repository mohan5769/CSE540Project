import { useState } from "react";
import { createSession } from "../lib/contracts";

const EVENT_TYPES = [
  "University Class",
  "Webinar",
  "Guest Lecture",
  "Workshop",
  "Conference",
  "Training Session",
];

export default function CreateSession() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    eventType: EVENT_TYPES[0],
  });
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSessionId("");
    setLoading(true);

    try {
      const createdSessionId = await createSession(form);
      setSessionId(createdSessionId || "Created successfully");
      setForm({
        title: "",
        description: "",
        date: "",
        eventType: EVENT_TYPES[0],
      });
    } catch (err) {
      setError(err.message || "Failed to create session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card issuer-card">
      <div className="issuer-head">
        <div>
          <h2>Create Session</h2>
          <p className="muted">
            Create an attendance event on-chain that can later be used to issue
            credentials.
          </p>
        </div>
        <span className="issuer-tag">On-chain action</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Session Title</label>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="Blockchain Lecture"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="Week 1 lecture on decentralized identity and verifiable credentials."
          />
        </div>

        <div className="issuer-grid">
          <div className="form-group">
            <label>Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={updateField}
              required
            />
          </div>

          <div className="form-group">
            <label>Event Type</label>
            <select
              name="eventType"
              value={form.eventType}
              onChange={updateField}
            >
              {EVENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating Session..." : "Create Session"}
        </button>
      </form>

      {sessionId ? (
        <div className="issuer-result success-panel">
          <h3>Session Created</h3>
          <p className="muted">
            This session was stored on-chain and can now be used for credential
            issuance.
          </p>
          <div className="result-pill">
            <span>Session ID</span>
            <strong>{sessionId}</strong>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="alert error-alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
