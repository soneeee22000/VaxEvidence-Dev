import { describe, it, expect } from "vitest";
import {
  integrationCreateSchema,
  integrationUpdateSchema,
  integrationProviders,
} from "@/lib/validators/integration";

describe("integrationCreateSchema", () => {
  const validPayload = {
    provider: "zotero" as const,
    display_name: "My Zotero",
    config: { library_id: "12345" },
    credentials: { api_token: "test-token-abc123" },
  };

  it("accepts a fully populated valid payload", () => {
    const result = integrationCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal payload with only provider and display_name", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "mendeley",
      display_name: "Mendeley Lib",
    });
    expect(result.success).toBe(true);
  });

  it("applies default config as empty object when omitted", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "redcap",
      display_name: "REDCap Instance",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config).toEqual({});
    }
  });

  it("applies default credentials as empty object when omitted", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Zotero Default Creds",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.credentials).toEqual({});
    }
  });

  it("accepts all valid provider values", () => {
    for (const provider of integrationProviders) {
      const result = integrationCreateSchema.safeParse({
        provider,
        display_name: `Integration: ${provider}`,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid provider value", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "notion",
      display_name: "Notion Integration",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing provider", () => {
    const result = integrationCreateSchema.safeParse({
      display_name: "No Provider",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing display_name", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty display_name", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.message.includes("required"),
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects display_name exceeding 255 characters", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Z".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("accepts display_name at exactly 255 characters", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Z".repeat(255),
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with api_key", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Zotero Key",
      credentials: { api_token: "test-token-123" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with api_token", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "mendeley",
      display_name: "Mendeley Token",
      credentials: { api_token: "token456" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with access_token", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "mendeley",
      display_name: "Mendeley Access",
      credentials: { access_token: "at789" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with user_id", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Zotero User",
      credentials: { user_id: "user-42" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with valid api_url", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "redcap",
      display_name: "REDCap URL",
      credentials: { api_url: "https://redcap.example.edu/api/" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects credentials with invalid api_url", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "redcap",
      display_name: "REDCap Bad URL",
      credentials: { api_url: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts credentials with all fields populated", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "redcap",
      display_name: "Full Credentials",
      credentials: {
        api_token: "test-token",
        access_token: "at",
        user_id: "uid",
        api_url: "https://example.com/api",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts config with arbitrary key-value pairs", () => {
    const result = integrationCreateSchema.safeParse({
      provider: "zotero",
      display_name: "Arbitrary Config",
      config: { sync_interval: 60, auto_sync: true, tags: ["a", "b"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects null input", () => {
    const result = integrationCreateSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects completely empty input", () => {
    const result = integrationCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("integrationUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = integrationUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts updating only display_name", () => {
    const result = integrationUpdateSchema.safeParse({
      display_name: "Renamed Integration",
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating is_active", () => {
    const result = integrationUpdateSchema.safeParse({
      is_active: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(false);
    }
  });

  it("accepts updating sync_state", () => {
    const result = integrationUpdateSchema.safeParse({
      sync_state: { cursor: "abc", page: 2 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating last_synced_at with valid datetime", () => {
    const result = integrationUpdateSchema.safeParse({
      last_synced_at: "2026-02-22T12:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null for last_synced_at", () => {
    const result = integrationUpdateSchema.safeParse({
      last_synced_at: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid datetime for last_synced_at", () => {
    const result = integrationUpdateSchema.safeParse({
      last_synced_at: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty display_name in update", () => {
    const result = integrationUpdateSchema.safeParse({
      display_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display_name exceeding 255 characters in update", () => {
    const result = integrationUpdateSchema.safeParse({
      display_name: "U".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("accepts updating credentials with valid api_url", () => {
    const result = integrationUpdateSchema.safeParse({
      credentials: { api_url: "https://new.example.com/api" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects updating credentials with invalid api_url", () => {
    const result = integrationUpdateSchema.safeParse({
      credentials: { api_url: "bad" },
    });
    expect(result.success).toBe(false);
  });
});

describe("integrationProviders constant", () => {
  it("exports exactly 3 provider values", () => {
    expect(integrationProviders).toHaveLength(3);
  });

  it("contains zotero, mendeley, and redcap", () => {
    expect(integrationProviders).toContain("zotero");
    expect(integrationProviders).toContain("mendeley");
    expect(integrationProviders).toContain("redcap");
  });
});
