import type { RateLimitTier } from "@/lib/validators/api-key";

/** Rate limit configuration per tier (requests per sliding window). */
export const RATE_LIMITS: Record<
  RateLimitTier,
  { requests: number; windowMs: number }
> = {
  free: { requests: 100, windowMs: 3_600_000 },
  pro: { requests: 1_000, windowMs: 3_600_000 },
  enterprise: { requests: 10_000, windowMs: 3_600_000 },
};

/** Result of a rate limit check. */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * In-memory sliding-window store.
 * Maps API key ID to an array of request timestamps (ms).
 */
const requestStore = new Map<string, number[]>();

/**
 * Check whether a request is allowed under the sliding-window rate limit.
 *
 * @param keyId  - The API key ID used as the rate limit bucket key.
 * @param tier   - The rate limit tier for this key.
 * @returns A `RateLimitResult` indicating whether the request is allowed.
 */
export function checkRateLimit(keyId: string, tier: string): RateLimitResult {
  const config = RATE_LIMITS[tier as RateLimitTier] ?? RATE_LIMITS.free;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  /* Retrieve existing timestamps and filter out expired ones. */
  const timestamps = (requestStore.get(keyId) ?? []).filter(
    (ts) => ts > windowStart,
  );

  const allowed = timestamps.length < config.requests;

  if (allowed) {
    timestamps.push(now);
  }

  requestStore.set(keyId, timestamps);

  /* Reset time is the oldest timestamp's expiry, or the end of the current window. */
  const resetAt =
    timestamps.length > 0
      ? (timestamps[0] as number) + config.windowMs
      : now + config.windowMs;

  return {
    allowed,
    remaining: Math.max(0, config.requests - timestamps.length),
    resetAt,
    limit: config.requests,
  };
}

/**
 * Build standard rate-limit response headers from a check result.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
