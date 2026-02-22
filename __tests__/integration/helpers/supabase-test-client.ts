/**
 * Supabase client factories for integration tests.
 *
 * - getAdminClient() — service role, bypasses RLS
 * - getUserClient(email, password) — signs in via password, respects RLS
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns an admin Supabase client (service role key).
 * Bypasses RLS — use for seeding/cleanup only.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_TEST_URL!;
  const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns a Supabase client authenticated as a specific user.
 * Respects RLS policies — use for testing access control.
 */
export async function getUserClient(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const url = process.env.SUPABASE_TEST_URL!;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }

  return client;
}
