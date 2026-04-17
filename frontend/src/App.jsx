import { useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import RoleInfo from "./components/RoleInfo";
import RegisterDID from "./components/RegisterDID";
import CreateSession from "./components/CreateSession";
import IssueCredential from "./components/IssueCredential";
import MyCredentials from "./components/MyCredentials";
import VerifyCredential from "./components/VerifyCredential";
import RevokeCredential from "./components/RevokeCredential";
import AdminPanel from "./components/AdminPanel";
import { connectWallet } from "./lib/wallet";
import { loadIdentity } from "./lib/contracts";

function Section({ title, subtitle, children }) {
  return (
    <section className="section-block">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="grid">{children}</div>
    </section>
  );
}

function StepBar({ address, identity }) {
  const isRegistered = Boolean(identity?.isRegistered);
  const isIssuer = identity?.roleLabel === "Issuer";

  const steps = [
    { label: "Connect Wallet", active: Boolean(address) },
    { label: "Register DID", active: isRegistered },
    {
      label: "Assign Role",
      active:
        Boolean(
          identity?.roleLabel &&
            identity.roleLabel !== "Holder" &&
            identity.roleLabel !== "None",
        ) || Boolean(identity?.isAdmin),
    },
    { label: "Create / Issue", active: isIssuer },
    { label: "Verify", active: true },
  ];

  return (
    <div className="stepbar">
      {steps.map((step, index) => (
        <div key={step.label} className={`step ${step.active ? "active" : ""}`}>
          <div className="step-index">{index + 1}</div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
}

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
      if (
        err?.code === 4001 ||
        String(err?.message || "").includes("User rejected")
      ) {
        setError(
          "MetaMask connection was cancelled. Please click Connect Wallet and approve the request.",
        );
      } else {
        setError(err.message || "Wallet connection failed.");
      }
    } finally {
      setLoadingWallet(false);
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      const nextAddress = accounts?.[0] || "";
      setAddress(nextAddress);
      setError("");

      if (nextAddress) {
        await refreshIdentity(nextAddress);
      } else {
        setIdentity(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [address]);

  const isRegistered = Boolean(identity?.isRegistered);
  const isIssuer = identity?.roleLabel === "Issuer";
  const isAdmin = Boolean(identity?.isAdmin);

  return (
    <div className="page-shell">
      <div className="hero">
        <div className="container">
          <div className="hero-content">
            <div>
              <p className="hero-kicker">CSE 540 · IAM dApp Demo</p>
              <h1>Decentralized Attendance Credential System</h1>
              <p className="hero-subtext">
                A blockchain-based system for DID registration, attendance
                credential issuance, and trustless verification using Ethereum,
                MetaMask, and IPFS.
              </p>
            </div>

            <div className="hero-stats card">
              <div className="stat">
                <span className="stat-label">Network</span>
                <span className="stat-value">Sepolia</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wallet</span>
                <span className="stat-value small">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "Not connected"}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Role</span>
                <span className="stat-value">
                  {identity?.roleLabel || "None"}
                </span>
              </div>
            </div>
          </div>

          <StepBar address={address} identity={identity} />
        </div>
      </div>

      <div className="container app-content">
        {error ? <div className="alert error-alert">{error}</div> : null}

        <Section
          title="Identity & Wallet"
          subtitle="Connect MetaMask, inspect the current profile, and register a decentralized identifier."
        >
          <ConnectWallet
            address={address}
            onConnect={handleConnect}
            loading={loadingWallet}
          />
          {address ? (
            <RoleInfo identity={identity} />
          ) : (
            <div className="card empty-card">
              <h3>Wallet Profile</h3>
              <p className="muted">
                Connect a wallet to load role, DID, and account status.
              </p>
            </div>
          )}
        </Section>

        {address && !isRegistered ? (
          <Section
            title="Getting Started"
            subtitle="This wallet is not registered yet. Register a DID first before accessing role-specific actions."
          >
            <RegisterDID onRegistered={() => refreshIdentity()} />
            <VerifyCredential />
          </Section>
        ) : null}

        {address && isRegistered && isAdmin ? (
          <Section
            title="Admin Actions"
            subtitle="The deployer wallet can assign roles and deactivate DIDs."
          >
            <AdminPanel />
          </Section>
        ) : null}

        {address && isRegistered ? (
          <Section
            title="Verification & Credentials"
            subtitle="View issued credentials and verify their authenticity using on-chain hashes and IPFS data."
          >
            <MyCredentials address={address} />
            <VerifyCredential />
          </Section>
        ) : null}

        {address && isRegistered && !isIssuer ? (
          <section className="section-block">
            <div className="info-banner">
              <h3>Issuer Tools Locked</h3>
              <p>
                This wallet does not currently have the Issuer role. An admin
                must assign it before session creation and credential issuance
                become available.
              </p>
            </div>
          </section>
        ) : null}

        {address && isRegistered && isIssuer ? (
          <Section
            title="Issuer Workspace"
            subtitle="Create sessions, issue credentials, and revoke credentials you originally issued."
          >
            <CreateSession />
            <IssueCredential currentAddress={address} />
            <RevokeCredential />
          </Section>
        ) : null}
      </div>
    </div>
  );
}
