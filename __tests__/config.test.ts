import { describe, it, expect } from "vitest";
import {
  clientConfigSchema,
  serverConfigSchema,
  parseClientConfig,
  parseServerConfig,
  safeParseClientConfig,
  safeParseServerConfig,
  isAiConfigured,
  isCI,
} from "@/lib/config";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal valid env for client config. */
const VALID_CLIENT_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
};

/** Full env with all optional client vars. */
const FULL_CLIENT_ENV: Record<string, string> = {
  ...VALID_CLIENT_ENV,
  NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET: "my-bucket",
  NEXT_PUBLIC_DEBUG_LOG_ENDPOINT: "https://logs.example.com/ingest",
};

/** Minimal valid env for server config. */
const VALID_SERVER_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

/** Full env with all optional server vars. */
const FULL_SERVER_ENV: Record<string, string> = {
  ...VALID_SERVER_ENV,
  NCBI_API_KEY: "ncbi-key-123",
  AI_PROVIDER: "openai",
  AI_MODEL: "gpt-4o-mini",
  GOOGLE_GENERATIVE_AI_API_KEY: "google-key-abc",
  OPENAI_API_KEY: "sk-openai-key",
  IP_HASH_SALT: "random-salt-value",
};

// ---------------------------------------------------------------------------
// Client Config Schema
// ---------------------------------------------------------------------------

describe("clientConfigSchema", () => {
  it("accepts minimal valid input", () => {
    const result = clientConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
    });
    expect(result.success).toBe(true);
  });

  it("applies default datasetsBucket when omitted", () => {
    const result = clientConfigSchema.parse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
    });
    expect(result.datasetsBucket).toBe("datasets");
  });

  it("accepts all optional fields", () => {
    const result = clientConfigSchema.parse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      datasetsBucket: "custom-bucket",
      debugLogEndpoint: "https://logs.example.com",
    });
    expect(result.datasetsBucket).toBe("custom-bucket");
    expect(result.debugLogEndpoint).toBe("https://logs.example.com");
  });

  it("rejects missing supabaseUrl", () => {
    const result = clientConfigSchema.safeParse({
      supabaseAnonKey: "test-key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid supabaseUrl", () => {
    const result = clientConfigSchema.safeParse({
      supabaseUrl: "not-a-url",
      supabaseAnonKey: "test-key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing supabaseAnonKey", () => {
    const result = clientConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty supabaseAnonKey", () => {
    const result = clientConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid debugLogEndpoint", () => {
    const result = clientConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "key",
      debugLogEndpoint: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Server Config Schema
// ---------------------------------------------------------------------------

describe("serverConfigSchema", () => {
  it("accepts minimal valid input", () => {
    const result = serverConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
    });
    expect(result.success).toBe(true);
  });

  it("applies default aiProvider when omitted", () => {
    const result = serverConfigSchema.parse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
    });
    expect(result.aiProvider).toBe("google");
  });

  it("applies default ipHashSalt when omitted", () => {
    const result = serverConfigSchema.parse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
    });
    expect(result.ipHashSalt).toBe("");
  });

  it("accepts all optional fields", () => {
    const result = serverConfigSchema.parse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
      ncbiApiKey: "ncbi-123",
      aiProvider: "openai",
      aiModel: "gpt-4o",
      googleApiKey: "google-abc",
      openaiApiKey: "sk-openai",
      ipHashSalt: "salt-value",
    });
    expect(result.ncbiApiKey).toBe("ncbi-123");
    expect(result.aiProvider).toBe("openai");
    expect(result.aiModel).toBe("gpt-4o");
    expect(result.googleApiKey).toBe("google-abc");
    expect(result.openaiApiKey).toBe("sk-openai");
    expect(result.ipHashSalt).toBe("salt-value");
  });

  it("rejects missing supabaseServiceRoleKey", () => {
    const result = serverConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty supabaseServiceRoleKey", () => {
    const result = serverConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid aiProvider", () => {
    const result = serverConfigSchema.safeParse({
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
      aiProvider: "anthropic",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid supabaseUrl", () => {
    const result = serverConfigSchema.safeParse({
      supabaseUrl: "not-a-url",
      supabaseAnonKey: "test-key",
      supabaseServiceRoleKey: "service-key",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseClientConfig
// ---------------------------------------------------------------------------

describe("parseClientConfig", () => {
  it("parses valid environment variables", () => {
    const config = parseClientConfig(VALID_CLIENT_ENV);
    expect(config.supabaseUrl).toBe("https://test.supabase.co");
    expect(config.supabaseAnonKey).toBe("test-anon-key");
    expect(config.datasetsBucket).toBe("datasets");
    expect(config.debugLogEndpoint).toBeUndefined();
  });

  it("parses all optional variables when present", () => {
    const config = parseClientConfig(FULL_CLIENT_ENV);
    expect(config.datasetsBucket).toBe("my-bucket");
    expect(config.debugLogEndpoint).toBe("https://logs.example.com/ingest");
  });

  it("throws ZodError for missing required vars", () => {
    expect(() => parseClientConfig({})).toThrow();
  });

  it("treats empty NEXT_PUBLIC_DEBUG_LOG_ENDPOINT as undefined", () => {
    const config = parseClientConfig({
      ...VALID_CLIENT_ENV,
      NEXT_PUBLIC_DEBUG_LOG_ENDPOINT: "",
    });
    expect(config.debugLogEndpoint).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseServerConfig
// ---------------------------------------------------------------------------

describe("parseServerConfig", () => {
  it("parses valid environment variables", () => {
    const config = parseServerConfig(VALID_SERVER_ENV);
    expect(config.supabaseUrl).toBe("https://test.supabase.co");
    expect(config.supabaseAnonKey).toBe("test-anon-key");
    expect(config.supabaseServiceRoleKey).toBe("test-service-role-key");
    expect(config.aiProvider).toBe("google");
    expect(config.ipHashSalt).toBe("");
  });

  it("parses all optional variables when present", () => {
    const config = parseServerConfig(FULL_SERVER_ENV);
    expect(config.ncbiApiKey).toBe("ncbi-key-123");
    expect(config.aiProvider).toBe("openai");
    expect(config.aiModel).toBe("gpt-4o-mini");
    expect(config.googleApiKey).toBe("google-key-abc");
    expect(config.openaiApiKey).toBe("sk-openai-key");
    expect(config.ipHashSalt).toBe("random-salt-value");
  });

  it("falls back to SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    const env = {
      SUPABASE_URL: "https://fallback.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
    };
    const config = parseServerConfig(env);
    expect(config.supabaseUrl).toBe("https://fallback.supabase.co");
  });

  it("prefers NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://primary.supabase.co",
      SUPABASE_URL: "https://fallback.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
    };
    const config = parseServerConfig(env);
    expect(config.supabaseUrl).toBe("https://primary.supabase.co");
  });

  it("throws ZodError for missing required vars", () => {
    expect(() => parseServerConfig({})).toThrow();
  });

  it("treats empty optional string vars as undefined", () => {
    const env = {
      ...VALID_SERVER_ENV,
      NCBI_API_KEY: "",
      AI_MODEL: "",
      GOOGLE_GENERATIVE_AI_API_KEY: "",
      OPENAI_API_KEY: "",
    };
    const config = parseServerConfig(env);
    expect(config.ncbiApiKey).toBeUndefined();
    expect(config.aiModel).toBeUndefined();
    expect(config.googleApiKey).toBeUndefined();
    expect(config.openaiApiKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// safeParseClientConfig
// ---------------------------------------------------------------------------

describe("safeParseClientConfig", () => {
  it("returns success: true for valid env", () => {
    const result = safeParseClientConfig(VALID_CLIENT_ENV);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supabaseUrl).toBe("https://test.supabase.co");
    }
  });

  it("returns success: false for invalid env", () => {
    const result = safeParseClientConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// safeParseServerConfig
// ---------------------------------------------------------------------------

describe("safeParseServerConfig", () => {
  it("returns success: true for valid env", () => {
    const result = safeParseServerConfig(VALID_SERVER_ENV);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supabaseServiceRoleKey).toBe("test-service-role-key");
    }
  });

  it("returns success: false for invalid env", () => {
    const result = safeParseServerConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// isAiConfigured
// ---------------------------------------------------------------------------

describe("isAiConfigured", () => {
  it("returns true when Google API key is set", () => {
    expect(isAiConfigured({ GOOGLE_GENERATIVE_AI_API_KEY: "key-123" })).toBe(
      true,
    );
  });

  it("returns true when OpenAI API key is set", () => {
    expect(isAiConfigured({ OPENAI_API_KEY: "sk-key" })).toBe(true);
  });

  it("returns true when both keys are set", () => {
    expect(
      isAiConfigured({
        GOOGLE_GENERATIVE_AI_API_KEY: "key",
        OPENAI_API_KEY: "sk-key",
      }),
    ).toBe(true);
  });

  it("returns false when no AI keys are set", () => {
    expect(isAiConfigured({})).toBe(false);
  });

  it("returns false when keys are empty strings", () => {
    expect(
      isAiConfigured({
        GOOGLE_GENERATIVE_AI_API_KEY: "",
        OPENAI_API_KEY: "",
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isCI
// ---------------------------------------------------------------------------

describe("isCI", () => {
  it("returns true when CI is set to 'true'", () => {
    expect(isCI({ CI: "true" })).toBe(true);
  });

  it("returns true when CI is set to '1'", () => {
    expect(isCI({ CI: "1" })).toBe(true);
  });

  it("returns false when CI is not set", () => {
    expect(isCI({})).toBe(false);
  });

  it("returns false when CI is empty", () => {
    expect(isCI({ CI: "" })).toBe(false);
  });
});
