import { useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import RoleInfo from "./components/RoleInfo";
import RegisterDID from "./components/RegisterDID";
import CreateSession from "./components/CreateSession";
import IssueCredential from "./components/IssueCredential";
import MyCredentials from "./components/MyCredentials";
import VerifyCredential from "./components/VerifyCredential";
import RevokeCredential from "./components/RevokeCredential";
import { connectWallet } from "./lib/wallet";
import { loadIdentity } from "./lib/contracts";

export default function App() {
  const [address, setAddress] = useState("");
  const [identity, setIdentity] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState("");

  async function refreshIdentity(currentAddress = address) {
    if (!currentAddress) return;
    try {
      const data = await loadIdentity(currentAddress);
      setIdentity(data);
    } catch (err) {
      setError(err.message || "Failed to load identity.");
    }
  }

  async function handleConnect() {
    setLoadingWallet(true);
    setError("");

    try {
      const walletAddress = await connectWallet();
      setAddress(walletAddress);
      await refreshIdentity(walletAddress);
    } catch (err) {
      setError(err.message || "Wallet connection failed.");
    } finally {
      setLoadingWallet(false);
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      const handler = async (accounts) => {
        const nextAddress = accounts?.[0] || "";
        setAddress(nextAddress);
        if (nextAddress) {
          await refreshIdentity(nextAddress);
        } else {
          setIdentity(null);
        }
      };

      window.ethereum.on("accountsChanged", handler);
      return () => {
        window.ethereum.removeListener("accountsChanged", handler);
      };
    }
  }, [address]);

  const isRegistered = Boolean(identity?.isRegistered);
  const isIssuer = identity?.roleLabel === "Issuer";

  return (
    <div className="container">
      <h1>Decentralized IAM Attendance dApp</h1>
      <p className="muted">
        Register a DID, issue attendance credentials, and verify them without
        relying on a central authority.
      </p>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        <ConnectWallet
          address={address}
          onConnect={handleConnect}
          loading={loadingWallet}
        />

        {address ? <RoleInfo identity={identity} /> : null}
      </div>

      {address && !isRegistered ? (
        <div className="grid" style={{ marginTop: 16 }}>
          <RegisterDID onRegistered={() => refreshIdentity()} />
          <VerifyCredential />
        </div>
      ) : null}

      {address && isRegistered ? (
        <div className="grid" style={{ marginTop: 16 }}>
          <MyCredentials address={address} />
          <VerifyCredential />
        </div>
      ) : null}

      {address && isRegistered && !isIssuer ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Issuer Tools</h2>
          <p className="muted">
            You do not currently have the Issuer role. The admin must assign it
            manually before you can create sessions or issue credentials.
          </p>
        </div>
      ) : null}

      {address && isIssuer ? (
        <div className="grid" style={{ marginTop: 16 }}>
          <CreateSession />
          <IssueCredential currentAddress={address} />
          <RevokeCredential />
        </div>
      ) : null}
    </div>
  );
}
