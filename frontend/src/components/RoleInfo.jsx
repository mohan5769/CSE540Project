export default function RoleInfo({ identity }) {
  if (!identity?.address) return null;

  return (
    <div className="card">
      <h2>Wallet Profile</h2>
      <p>
        <span className="badge">{identity.roleLabel}</span>
        {identity.isAdmin ? <span className="badge">Admin</span> : null}
        {identity.active ? <span className="badge">Active</span> : null}
      </p>

      <p>
        <strong>Address:</strong>
      </p>
      <div className="code">{identity.address}</div>

      <p style={{ marginTop: 12 }}>
        <strong>DID:</strong>
      </p>
      <div className="code">{identity.did || "Not registered yet"}</div>
    </div>
  );
}
