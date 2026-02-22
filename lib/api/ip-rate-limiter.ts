import type { NextRequest } from "next/server";

/** Default: 60 requests per minute per IP. */
const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_WINDOW_MS = 60_000;

/** Result of an IP rate limit check. */
export interface IpRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * In-memory sliding-window store keyed by IP address.
 * Maps IP -> array of request timestamps (ms).
 */
const ipStore = new Map<string, number[]>();

/**
 * Extract the client IP from the request.
 * Uses x-forwarded-for (Vercel/proxied), falls back to x-real-ip.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Check whether a request is allowed under the IP-based sliding-window rate limit.
 */
export function checkIpRateLimit(
  request: NextRequest,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): IpRateLimitResult {
  const ip = getClientIp(request);
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (ipStore.get(ip) ?? []).filter((ts) => ts > windowStart);
  const allowed = timestamps.length < maxRequests;

  if (allowed) {
    timestamps.push(now);
  }

  ipStore.set(ip, timestamps);

  const resetAt =
    timestamps.length > 0
      ? (timestamps[0] as number) + windowMs
      : now + windowMs;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - timestamps.length),
    resetAt,
    limit: maxRequests,
  };
}

/**
 * Build standard rate-limit response headers from a check result.
 */
export function getIpRateLimitHeaders(
  result: IpRateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}
