import crypto from "crypto";

/** Prefix prepended to all generated API keys. */
export const API_KEY_PREFIX = "vxe_";

/**
 * Generate a new API key with the VaxEvidence prefix.
 * Format: `vxe_` + 40 random hex characters (20 random bytes).
 */
export function generateApiKey(): string {
  const randomHex = crypto.randomBytes(20).toString("hex");
  return `${API_KEY_PREFIX}${randomHex}`;
}

/**
 * Compute a SHA-256 hash of the given API key.
 * Used for secure storage — raw keys are never persisted.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Extract the display prefix from a raw API key.
 * Returns the first 8 characters after the `vxe_` prefix.
 */
export function getKeyPrefix(key: string): string {
  const withoutPrefix = key.startsWith(API_KEY_PREFIX)
    ? key.slice(API_KEY_PREFIX.length)
    : key;
  return withoutPrefix.slice(0, 8);
}
