const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export async function pinJSONToIPFS(payload) {
  if (PINATA_JWT) {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: payload,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Pinata upload failed.");
    }

    const data = await response.json();
    return `ipfs://${data.IpfsHash}`;
  }

  const localId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `mock-${Date.now()}`;

  localStorage.setItem(`mock-ipfs:${localId}`, JSON.stringify(payload));
  return `local://${localId}`;
}

export async function fetchJSONFromIPFS(uri) {
  if (!uri) {
    throw new Error("Empty IPFS URI.");
  }

  if (uri.startsWith("local://")) {
    const key = uri.replace("local://", "");
    const stored = localStorage.getItem(`mock-ipfs:${key}`);
    if (!stored) {
      throw new Error("Local mock IPFS content not found.");
    }
    return JSON.parse(stored);
  }

  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    const response = await fetch(`${IPFS_GATEWAY}${cid}`);
    if (!response.ok) {
      throw new Error("Failed to fetch IPFS content.");
    }
    return response.json();
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Failed to fetch credential content.");
  }
  return response.json();
}
