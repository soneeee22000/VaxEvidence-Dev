import "server-only";

import { type NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api/api-key-utils";
import type { ApiKeyScope, RateLimitTier } from "@/lib/validators/api-key";

/** Authenticated API key payload attached to validated requests. */
export interface AuthenticatedApiKey {
  apiKeyId: string;
  workspaceId: string;
  userId: string;
  scopes: ApiKeyScope[];
  rateLimitTier: RateLimitTier;
}

/**
 * Authenticate an incoming request using a Bearer API key.
 *
 * Extracts the token from the Authorization header, hashes it, and looks up
 * the matching record in the `api_keys` table. Returns the authenticated key
 * payload on success or a descriptive error string on failure.
 */
export async function authenticateApiKey(
  request: NextRequest,
): Promise<
  { data: AuthenticatedApiKey; error: null } | { data: null; error: string }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { data: null, error: "Missing or malformed Authorization header" };
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return { data: null, error: "Empty API key token" };
  }

  const keyHash = hashApiKey(token);
  const supabase = getSupabaseAdmin();

  const { data: keyRecord, error: dbError } = await supabase
    .from("api_keys")
    .select(
      "id, workspace_id, user_id, scopes, rate_limit_tier, expires_at, is_revoked",
    )
    .eq("key_hash", keyHash)
    .eq("is_revoked", false)
    .single();

  if (dbError || !keyRecord) {
    return { data: null, error: "Invalid or revoked API key" };
  }

  /* Check expiry if set. */
  if (keyRecord.expires_at) {
    const expiresAt = new Date(keyRecord.expires_at);
    if (expiresAt <= new Date()) {
      return { data: null, error: "API key has expired" };
    }
  }

  /* Update last_used_at (fire-and-forget). */
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then(() => {
      /* intentionally empty — fire-and-forget */
    });

  return {
    data: {
      apiKeyId: keyRecord.id as string,
      workspaceId: keyRecord.workspace_id as string,
      userId: keyRecord.user_id as string,
      scopes: keyRecord.scopes as ApiKeyScope[],
      rateLimitTier: keyRecord.rate_limit_tier as RateLimitTier,
    },
    error: null,
  };
}
