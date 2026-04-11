import { keccak256, toUtf8Bytes } from "ethers";

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stableStringify(obj) {
  return JSON.stringify(sortValue(obj));
}

export function hashCredential(obj) {
  return keccak256(toUtf8Bytes(stableStringify(obj)));
}
