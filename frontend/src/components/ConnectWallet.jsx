export default function ConnectWallet({ address, onConnect, loading }) {
  return (
    <div className="card">
      <h2>Connect Wallet</h2>
      {address ? (
        <>
          <p className="success">Wallet connected</p>
          <div className="code">{address}</div>
        </>
      ) : (
        <>
          <p className="muted">Connect MetaMask to use the dApp.</p>
          <button onClick={onConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        </>
      )}
    </div>
  );
}
