import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { webhookCreateSchema } from "@/lib/validators/webhook";
import { generateWebhookSecret } from "@/lib/api/webhook-dispatcher";

/** Columns returned for webhook list responses (never includes secret). */
const WEBHOOK_SELECT_COLUMNS =
  "id, workspace_id, url, events, is_active, description, created_at, updated_at";

/**
 * GET /api/workspaces/[id]/webhooks
 *
 * List all webhooks for a workspace. Requires workspace membership.
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

    /* Fetch webhooks, ordered newest first. */
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select(WEBHOOK_SELECT_COLUMNS)
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: webhooks ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/webhooks
 *
 * Create a new webhook for the workspace. Requires admin or lead role.
 * Auto-generates a signing secret that is returned exactly once in the response.
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
  const parsed = webhookCreateSchema.safeParse(payload);
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

    /* Generate signing secret. */
    const secret = generateWebhookSecret();

    /* Insert new webhook record. */
    const { data: record, error: insertError } = await supabase
      .from("webhooks")
      .insert({
        workspace_id: id,
        url: parsed.data.url,
        secret,
        events: parsed.data.events,
        is_active: true,
        description: parsed.data.description ?? null,
      })
      .select(WEBHOOK_SELECT_COLUMNS)
      .single();

    if (insertError || !record) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create webhook" },
        { status: 500 },
      );
    }

    /* Return the record with the secret (shown once). */
    return NextResponse.json({ data: { ...record, secret } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
