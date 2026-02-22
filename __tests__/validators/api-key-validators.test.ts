import { describe, it, expect } from "vitest";
import {
  apiKeyCreateSchema,
  apiKeyScopes,
  rateLimitTiers,
} from "@/lib/validators/api-key";

describe("apiKeyCreateSchema", () => {
  const validPayload = {
    name: "My API Key",
    scopes: ["read", "write"] as const,
    rate_limit_tier: "pro" as const,
    expires_at: "2026-12-31T23:59:59Z",
  };

  it("accepts a fully populated valid payload", () => {
    const result = apiKeyCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal payload with only name", () => {
    const result = apiKeyCreateSchema.safeParse({ name: "Minimal Key" });
    expect(result.success).toBe(true);
  });

  it("applies default scopes when omitted", () => {
    const result = apiKeyCreateSchema.safeParse({ name: "Default Scopes" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scopes).toEqual(["read"]);
    }
  });

  it("applies default rate_limit_tier when omitted", () => {
    const result = apiKeyCreateSchema.safeParse({ name: "Default Tier" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rate_limit_tier).toBe("free");
    }
  });

  it("accepts all valid scope values individually", () => {
    for (const scope of apiKeyScopes) {
      const result = apiKeyCreateSchema.safeParse({
        name: `Key with ${scope}`,
        scopes: [scope],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid rate limit tiers", () => {
    for (const tier of rateLimitTiers) {
      const result = apiKeyCreateSchema.safeParse({
        name: `Key with tier ${tier}`,
        rate_limit_tier: tier,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts multiple scopes combined", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "All Scopes",
      scopes: ["read", "write", "admin"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scopes).toEqual(["read", "write", "admin"]);
    }
  });

  it("rejects missing name", () => {
    const result = apiKeyCreateSchema.safeParse({
      scopes: ["read"],
      rate_limit_tier: "free",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = apiKeyCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("rejects name exceeding 100 characters", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 100 characters", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid scope value", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Bad Scope",
      scopes: ["superadmin"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid rate_limit_tier value", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Bad Tier",
      rate_limit_tier: "ultimate",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string name", () => {
    const result = apiKeyCreateSchema.safeParse({ name: 42 });
    expect(result.success).toBe(false);
  });

  it("rejects non-array scopes", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Scalar Scope",
      scopes: "read",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime for expires_at", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Bad Expiry",
      expires_at: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-ISO datetime for expires_at", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Bad Expiry Format",
      expires_at: "2026-12-31",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid ISO datetime for expires_at", () => {
    const result = apiKeyCreateSchema.safeParse({
      name: "Good Expiry",
      expires_at: "2027-01-15T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("allows expires_at to be omitted", () => {
    const result = apiKeyCreateSchema.safeParse({ name: "No Expiry" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expires_at).toBeUndefined();
    }
  });

  it("rejects completely empty input", () => {
    const result = apiKeyCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = apiKeyCreateSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("apiKeyScopes constant", () => {
  it("exports exactly 3 scope values", () => {
    expect(apiKeyScopes).toHaveLength(3);
  });

  it("contains read, write, and admin", () => {
    expect(apiKeyScopes).toContain("read");
    expect(apiKeyScopes).toContain("write");
    expect(apiKeyScopes).toContain("admin");
  });
});

describe("rateLimitTiers constant", () => {
  it("exports exactly 3 tier values", () => {
    expect(rateLimitTiers).toHaveLength(3);
  });

  it("contains free, pro, and enterprise", () => {
    expect(rateLimitTiers).toContain("free");
    expect(rateLimitTiers).toContain("pro");
    expect(rateLimitTiers).toContain("enterprise");
  });
});
