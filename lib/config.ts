/**
 * Centralized application configuration with Zod validation.
 *
 * Provides typed, validated access to all environment variables.
 * Server config includes secrets and must never be imported in client components.
 * Client config contains only NEXT_PUBLIC_* variables safe for the browser.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Schema for client-safe configuration (NEXT_PUBLIC_* vars only). */
export const clientConfigSchema = z.object({
  supabaseUrl: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .describe("Supabase project URL"),
  supabaseAnonKey: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
    .describe("Supabase anonymous/public key"),
  datasetsBucket: z
    .string()
    .default("datasets")
    .describe("Supabase Storage bucket for dataset uploads"),
  debugLogEndpoint: z
    .string()
    .url()
    .optional()
    .describe("Debug log shipping endpoint (development only)"),
});

/** Schema for server-only configuration (includes secrets). */
export const serverConfigSchema = z.object({
  supabaseUrl: z
    .string()
    .url("Supabase URL is required for server operations")
    .describe("Supabase project URL (falls back to SUPABASE_URL)"),
  supabaseAnonKey: z
    .string()
    .min(1, "Supabase anon key is required")
    .describe("Supabase anonymous/public key"),
  supabaseServiceRoleKey: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for server operations")
    .describe("Supabase service role key (admin access, bypasses RLS)"),
  ncbiApiKey: z
    .string()
    .optional()
    .describe("NCBI/PubMed API key for higher rate limits"),
  aiProvider: z
    .enum(["google", "openai"])
    .default("google")
    .describe("AI provider selection"),
  aiModel: z
    .string()
    .optional()
    .describe("Override AI model ID (defaults to provider default)"),
  googleApiKey: z.string().optional().describe("Google Generative AI API key"),
  openaiApiKey: z.string().optional().describe("OpenAI API key"),
  ipHashSalt: z
    .string()
    .default("")
    .describe("Salt for hashing IPs in waitlist submissions"),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClientConfig = z.infer<typeof clientConfigSchema>;
export type ServerConfig = z.infer<typeof serverConfigSchema>;

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/**
 * Parses client configuration from environment variables.
 *
 * @returns Validated client config or throws ZodError with descriptive messages.
 */
export function parseClientConfig(
  env: Record<string, string | undefined> = process.env,
): ClientConfig {
  return clientConfigSchema.parse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    datasetsBucket: env.NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET,
    debugLogEndpoint: env.NEXT_PUBLIC_DEBUG_LOG_ENDPOINT || undefined,
  });
}

/**
 * Parses server configuration from environment variables.
 *
 * @returns Validated server config or throws ZodError with descriptive messages.
 */
export function parseServerConfig(
  env: Record<string, string | undefined> = process.env,
): ServerConfig {
  return serverConfigSchema.parse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    ncbiApiKey: env.NCBI_API_KEY || undefined,
    aiProvider: env.AI_PROVIDER,
    aiModel: env.AI_MODEL || undefined,
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    ipHashSalt: env.IP_HASH_SALT,
  });
}

// ---------------------------------------------------------------------------
// Safe parsers (return { success, data?, error? } instead of throwing)
// ---------------------------------------------------------------------------

/**
 * Safely parses client configuration. Returns a discriminated result
 * instead of throwing, useful for conditional initialization.
 */
export function safeParseClientConfig(
  env: Record<string, string | undefined> = process.env,
) {
  return clientConfigSchema.safeParse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    datasetsBucket: env.NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET,
    debugLogEndpoint: env.NEXT_PUBLIC_DEBUG_LOG_ENDPOINT || undefined,
  });
}

/**
 * Safely parses server configuration. Returns a discriminated result
 * instead of throwing, useful for conditional initialization.
 */
export function safeParseServerConfig(
  env: Record<string, string | undefined> = process.env,
) {
  return serverConfigSchema.safeParse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    ncbiApiKey: env.NCBI_API_KEY || undefined,
    aiProvider: env.AI_PROVIDER,
    aiModel: env.AI_MODEL || undefined,
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    ipHashSalt: env.IP_HASH_SALT,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the AI feature is available (at least one API key set).
 */
export function isAiConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !!(env.GOOGLE_GENERATIVE_AI_API_KEY || env.OPENAI_API_KEY);
}

/**
 * Returns true when running in a CI environment.
 */
export function isCI(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !!env.CI;
}
