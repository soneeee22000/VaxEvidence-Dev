/**
 * Global setup for integration tests.
 * Validates required environment variables and Supabase connectivity.
 *
 * Exports `isConfigured` so individual test files can skip gracefully
 * when the Supabase test instance is not available.
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.test from project root
config({ path: resolve(__dirname, "../../../.env.test") });

const REQUIRED_VARS = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_ANON_KEY",
  "SUPABASE_TEST_SERVICE_KEY",
] as const;

const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

/**
 * Whether all required env vars are present.
 * Test files should guard their `describe` blocks with this.
 */
export const isConfigured = missing.length === 0;

if (!isConfigured) {
  console.warn(
    `\n[SKIP] Integration tests require environment variables: ${missing.join(", ")}.\n` +
      `Copy .env.test.example to .env.test and fill in values from your Supabase dev branch.\n`,
  );
}
