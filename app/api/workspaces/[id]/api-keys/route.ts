import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { apiKeyCreateSchema } from "@/lib/validators/api-key";
import {
  generateApiKey,
  hashApiKey,
  getKeyPrefix,
} from "@/lib/api/api-key-utils";

/** Columns returned for API key list responses (never includes key_hash). */
const API_KEY_SELECT_COLUMNS =
  "id, workspace_id, user_id, name, key_prefix, scopes, rate_limit_tier, last_used_at, expires_at, is_revoked, created_at";

/**
 * GET /api/workspaces/[id]/api-keys
 *
 * List all active (non-revoked) API keys for a workspace.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
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

    /* Fetch active API keys, ordered newest first. */
    const { data: apiKeys, error } = await supabase
      .from("api_keys")
      .select(API_KEY_SELECT_COLUMNS)
      .eq("workspace_id", id)
      .eq("is_revoked", false)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: apiKeys ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/api-keys
 *
 * Create a new API key for the workspace. The raw key is returned exactly
 * once in the response and is never stored.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  /* Validate input. */
  const parsed = apiKeyCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Verify user is a workspace member with admin or lead role. */
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["admin", "lead", "owner"];
    if (!allowedRoles.includes(membership.role as string)) {
      return NextResponse.json(
        { error: "Insufficient role — admin or lead required" },
        { status: 403 },
      );
    }

    /* Generate key material. */
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    /* Insert new API key record. */
    const { data: record, error: insertError } = await supabase
      .from("api_keys")
      .insert({
        workspace_id: id,
        user_id: user.id,
        name: parsed.data.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: parsed.data.scopes,
        rate_limit_tier: parsed.data.rate_limit_tier,
        expires_at: parsed.data.expires_at ?? null,
      })
      .select(API_KEY_SELECT_COLUMNS)
      .single();

    if (insertError || !record) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create API key" },
        { status: 500 },
      );
    }

    /* Return the record with the raw key (shown once). */
    return NextResponse.json({ data: { ...record, raw_key: rawKey } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
