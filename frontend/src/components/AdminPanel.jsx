import { useState } from "react";
import { assignRole, deactivateDID } from "../lib/contracts";

const ROLE_OPTIONS = [
  {
    label: "Holder",
    value: 1,
    description: "Can register DID, view credentials, and share them.",
  },
  {
    label: "Issuer",
    value: 2,
    description: "Can create sessions, issue credentials, and revoke them.",
  },
  {
    label: "Verifier",
    value: 3,
    description: "Can verify credentials as a read-only participant.",
  },
];

export default function AdminPanel() {
  const [roleAddress, setRoleAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState(2);
  const [deactivateAddress, setDeactivateAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingDeactivate, setLoadingDeactivate] = useState(false);

  const selectedRoleInfo =
    ROLE_OPTIONS.find((role) => role.value === Number(selectedRole)) ||
    ROLE_OPTIONS[1];

  async function handleAssignRole(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoadingRole(true);

    try {
      await assignRole(roleAddress, Number(selectedRole));
      setMessage(`Role assigned successfully to ${roleAddress}`);
      setRoleAddress("");
    } catch (err) {
      setError(err.message || "Failed to assign role.");
    } finally {
      setLoadingRole(false);
    }
  }

  async function handleDeactivate(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoadingDeactivate(true);

    try {
      await deactivateDID(deactivateAddress);
      setMessage(`DID deactivated successfully for ${deactivateAddress}`);
      setDeactivateAddress("");
    } catch (err) {
      setError(err.message || "Failed to deactivate DID.");
    } finally {
      setLoadingDeactivate(false);
    }
  }

  return (
    <div className="card admin-card">
      <div className="admin-head">
        <div>
          <h2>Admin Actions</h2>
          <p className="muted">
            The admin wallet can assign on-chain roles and deactivate DIDs when
            required.
          </p>
        </div>
        <span className="admin-tag">Admin only</span>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <h3>Assign Role</h3>
          <p className="muted">
            Promote a registered wallet to Holder, Issuer, or Verifier.
          </p>

          <form onSubmit={handleAssignRole}>
            <div className="form-group">
              <label>Wallet Address</label>
              <input
                value={roleAddress}
                onChange={(e) => setRoleAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label>Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-role-preview">
              <span className="meta-label">Selected Role</span>
              <strong>{selectedRoleInfo.label}</strong>
              <p className="muted">{selectedRoleInfo.description}</p>
            </div>

            <button type="submit" disabled={loadingRole}>
              {loadingRole ? "Assigning Role..." : "Assign Role"}
            </button>
          </form>
        </div>

        <div className="admin-panel danger-panel">
          <h3>Deactivate DID</h3>
          <p className="muted">
            Disable a registered DID if an account should no longer participate
            in the system.
          </p>

          <form onSubmit={handleDeactivate}>
            <div className="form-group">
              <label>Wallet Address</label>
              <input
                value={deactivateAddress}
                onChange={(e) => setDeactivateAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            <div className="danger-box">
              <span className="meta-label">Warning</span>
              <p>
                This action deactivates the DID on-chain. Use it only when the
                account should no longer remain active in the system.
              </p>
            </div>

            <button type="submit" disabled={loadingDeactivate}>
              {loadingDeactivate ? "Deactivating..." : "Deactivate DID"}
            </button>
          </form>
        </div>
      </div>

      {message ? (
        <div className="admin-feedback success-panel">
          <h3>Transaction Successful</h3>
          <p>{message}</p>
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
