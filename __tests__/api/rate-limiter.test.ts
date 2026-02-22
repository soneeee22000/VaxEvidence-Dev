import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
  type RateLimitResult,
} from "@/lib/api/rate-limiter";

describe("RATE_LIMITS", () => {
  it("defines free tier as 100 requests per hour", () => {
    expect(RATE_LIMITS.free).toEqual({
      requests: 100,
      windowMs: 3_600_000,
    });
  });

  it("defines pro tier as 1000 requests per hour", () => {
    expect(RATE_LIMITS.pro).toEqual({
      requests: 1_000,
      windowMs: 3_600_000,
    });
  });

  it("defines enterprise tier as 10000 requests per hour", () => {
    expect(RATE_LIMITS.enterprise).toEqual({
      requests: 10_000,
      windowMs: 3_600_000,
    });
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a new key", () => {
    const result = checkRateLimit("key-fresh-1", "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(result.limit).toBe(100);
  });

  it("blocks requests when the limit is exceeded", () => {
    const keyId = "key-block-1";
    // Exhaust all 100 free-tier requests
    for (let i = 0; i < 100; i++) {
      const r = checkRateLimit(keyId, "free");
      expect(r.allowed).toBe(true);
    }
    // 101st request should be blocked
    const blocked = checkRateLimit(keyId, "free");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("decrements remaining count with each allowed request", () => {
    const keyId = "key-decrement-1";
    const r1 = checkRateLimit(keyId, "free");
    expect(r1.remaining).toBe(99);

    const r2 = checkRateLimit(keyId, "free");
    expect(r2.remaining).toBe(98);

    const r3 = checkRateLimit(keyId, "free");
    expect(r3.remaining).toBe(97);
  });

  it("respects pro tier limit (1000 requests)", () => {
    const keyId = "key-pro-1";
    const first = checkRateLimit(keyId, "pro");
    expect(first.limit).toBe(1_000);
    expect(first.remaining).toBe(999);
  });

  it("respects enterprise tier limit (10000 requests)", () => {
    const keyId = "key-enterprise-1";
    const first = checkRateLimit(keyId, "enterprise");
    expect(first.limit).toBe(10_000);
    expect(first.remaining).toBe(9_999);
  });

  it("falls back to free tier for unknown tier strings", () => {
    const keyId = "key-unknown-tier-1";
    const result = checkRateLimit(keyId, "nonexistent_tier");
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
  });

  it("tracks different key IDs independently", () => {
    const keyA = "key-independent-a";
    const keyB = "key-independent-b";

    // Exhaust key A
    for (let i = 0; i < 100; i++) {
      checkRateLimit(keyA, "free");
    }
    const blockedA = checkRateLimit(keyA, "free");
    expect(blockedA.allowed).toBe(false);

    // Key B should still be allowed
    const allowedB = checkRateLimit(keyB, "free");
    expect(allowedB.allowed).toBe(true);
    expect(allowedB.remaining).toBe(99);
  });

  it("resets after the sliding window expires", () => {
    const keyId = "key-window-1";

    // Use all 100 requests
    for (let i = 0; i < 100; i++) {
      checkRateLimit(keyId, "free");
    }
    expect(checkRateLimit(keyId, "free").allowed).toBe(false);

    // Advance time past the 1-hour window
    vi.advanceTimersByTime(3_600_001);

    // Should be allowed again — old timestamps expired
    const afterReset = checkRateLimit(keyId, "free");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(99);
  });

  it("provides a resetAt timestamp in the future", () => {
    const now = Date.now();
    const result = checkRateLimit("key-reset-1", "free");
    expect(result.resetAt).toBeGreaterThanOrEqual(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + 3_600_000);
  });

  it("does not add a timestamp when request is blocked", () => {
    const keyId = "key-no-add-blocked-1";
    for (let i = 0; i < 100; i++) {
      checkRateLimit(keyId, "free");
    }

    // Blocked request
    const blocked = checkRateLimit(keyId, "free");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    // Remaining stays at 0 — no extra timestamps were added
    const stillBlocked = checkRateLimit(keyId, "free");
    expect(stillBlocked.remaining).toBe(0);
  });

  it("partially expires old timestamps within a sliding window", () => {
    const keyId = "key-sliding-1";

    // Make 50 requests at T=0
    for (let i = 0; i < 50; i++) {
      checkRateLimit(keyId, "free");
    }

    // Advance 30 minutes
    vi.advanceTimersByTime(1_800_000);

    // Make 50 more requests at T=30min
    for (let i = 0; i < 50; i++) {
      checkRateLimit(keyId, "free");
    }

    // Now all 100 slots used — should be blocked
    expect(checkRateLimit(keyId, "free").allowed).toBe(false);

    // Advance another 31 minutes (past 1-hour mark from first batch)
    vi.advanceTimersByTime(1_860_001);

    // First 50 expired, 50 remain — should be allowed again
    const afterPartial = checkRateLimit(keyId, "free");
    expect(afterPartial.allowed).toBe(true);
    // 50 remaining from second batch + 1 just added = 51 used => 49 remaining
    expect(afterPartial.remaining).toBe(49);
  });
});

describe("getRateLimitHeaders", () => {
  it("returns X-RateLimit-Limit header", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 99,
      resetAt: 1700000000000,
      limit: 100,
    };
    const headers = getRateLimitHeaders(result);
    expect(headers["X-RateLimit-Limit"]).toBe("100");
  });

  it("returns X-RateLimit-Remaining header", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 42,
      resetAt: 1700000000000,
      limit: 100,
    };
    const headers = getRateLimitHeaders(result);
    expect(headers["X-RateLimit-Remaining"]).toBe("42");
  });

  it("returns X-RateLimit-Reset as seconds (ceiling)", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 99,
      resetAt: 1700000000500, // 500ms past the second
      limit: 100,
    };
    const headers = getRateLimitHeaders(result);
    // Math.ceil(1700000000500 / 1000) = 1700000001
    expect(headers["X-RateLimit-Reset"]).toBe("1700000001");
  });

  it("returns all three required headers", () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      resetAt: 1700000000000,
      limit: 1000,
    };
    const headers = getRateLimitHeaders(result);
    expect(Object.keys(headers)).toEqual(
      expect.arrayContaining([
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ]),
    );
    expect(Object.keys(headers)).toHaveLength(3);
  });

  it("converts all values to strings", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 0,
      resetAt: 0,
      limit: 10000,
    };
    const headers = getRateLimitHeaders(result);
    for (const value of Object.values(headers)) {
      expect(typeof value).toBe("string");
    }
  });
});
