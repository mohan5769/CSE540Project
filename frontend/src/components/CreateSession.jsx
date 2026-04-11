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
    <div className="card">
      <h2>Create Session</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
          />
        </div>

        <div className="row">
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
          {loading ? "Creating..." : "Create Session"}
        </button>
      </form>

      {sessionId ? <p className="success">Session ID: {sessionId}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
