// =============================================================================
// CONTENT HASH UTILITY
// =============================================================================
// Isomorphic SHA-256 hashing for protocol version tamper detection.
// Works in both browser (Web Crypto API) and Node.js (crypto module).
// =============================================================================

/**
 * Serialize an object to a deterministic JSON string with sorted keys.
 * Ensures identical content always produces the same hash regardless of
 * property insertion order.
 */
export function serializeForHashing(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  });
}

/**
 * Compute a SHA-256 hash of the given content fields.
 * Uses Web Crypto API (isomorphic — available in browsers and Node.js 18+).
 *
 * @returns 64-character lowercase hex string
 */
export async function computeContentHash(
  content: Record<string, unknown>,
): Promise<string> {
  const serialized = serializeForHashing(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);

  // Web Crypto API is available in modern browsers and Node.js 18+
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify that a content hash matches the given content fields.
 *
 * @returns true if the computed hash matches the expected hash
 */
export async function verifyContentHash(
  content: Record<string, unknown>,
  expectedHash: string,
): Promise<boolean> {
  const computedHash = await computeContentHash(content);
  return computedHash === expectedHash;
}
