import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  generateApiKey,
  hashApiKey,
  getKeyPrefix,
} from "@/lib/api/api-key-utils";

/** Columns returned for API key responses (never includes key_hash). */
const API_KEY_SELECT_COLUMNS =
  "id, workspace_id, user_id, name, key_prefix, scopes, rate_limit_tier, last_used_at, expires_at, is_revoked, created_at";

/**
 * POST /api/workspaces/[id]/api-keys/[keyId]/rotate
 *
 * Rotate an API key: revoke the existing key and create a new one with
 * the same name, scopes, and rate limit tier. The new raw key is returned
 * exactly once in the response.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, keyId } = await params;
  if (!id || !keyId) {
    return NextResponse.json(
      { error: "Workspace ID and key ID are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Verify user is a member of the workspace. */
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* Fetch the existing key record to carry over name, scopes, and tier. */
    const { data: existingKey, error: fetchError } = await supabase
      .from("api_keys")
      .select("name, scopes, rate_limit_tier")
      .eq("id", keyId)
      .eq("workspace_id", id)
      .eq("is_revoked", false)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: "API key not found or already revoked" },
        { status: 404 },
      );
    }

    /* Revoke the old key. */
    const { error: revokeError } = await supabase
      .from("api_keys")
      .update({
        is_revoked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", keyId)
      .eq("workspace_id", id);

    if (revokeError) {
      return NextResponse.json({ error: revokeError.message }, { status: 500 });
    }

    /* Generate new key material. */
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    /* Insert new API key record with the same name, scopes, and tier. */
    const { data: newRecord, error: insertError } = await supabase
      .from("api_keys")
      .insert({
        workspace_id: id,
        user_id: user.id,
        name: existingKey.name as string,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: existingKey.scopes,
        rate_limit_tier: existingKey.rate_limit_tier as string,
      })
      .select(API_KEY_SELECT_COLUMNS)
      .single();

    if (insertError || !newRecord) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create rotated API key" },
        { status: 500 },
      );
    }

    /* Return the new record with the raw key (shown once). */
    return NextResponse.json({ data: { ...newRecord, raw_key: rawKey } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
