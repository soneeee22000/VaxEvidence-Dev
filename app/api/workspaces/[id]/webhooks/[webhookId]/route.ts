import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { webhookUpdateSchema } from "@/lib/validators/webhook";

/** Columns returned for webhook responses (never includes secret). */
const WEBHOOK_SELECT_COLUMNS =
  "id, workspace_id, url, events, is_active, description, created_at, updated_at";

/**
 * GET /api/workspaces/[id]/webhooks/[webhookId]
 *
 * Fetch a single webhook with its 20 most recent delivery records.
 * Requires workspace membership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, webhookId } = await params;
  if (!id || !webhookId) {
    return NextResponse.json(
      { error: "Workspace ID and webhook ID are required" },
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

    /* Fetch the webhook — scoped to this workspace. */
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks")
      .select(WEBHOOK_SELECT_COLUMNS)
      .eq("id", webhookId)
      .eq("workspace_id", id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    /* Fetch the 20 most recent deliveries for this webhook. */
    const { data: deliveries, error: deliveryError } = await supabase
      .from("webhook_deliveries")
      .select(
        "id, webhook_id, event_type, status, attempts, last_response_code, created_at, delivered_at",
      )
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (deliveryError) {
      return NextResponse.json(
        { error: deliveryError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { ...webhook, deliveries: deliveries ?? [] },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/workspaces/[id]/webhooks/[webhookId]
 *
 * Update webhook settings (URL, events, active status, description).
 * Requires workspace membership.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, webhookId } = await params;
  if (!id || !webhookId) {
    return NextResponse.json(
      { error: "Workspace ID and webhook ID are required" },
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
  const parsed = webhookUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
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

    /* Build the update payload — only include provided fields. */
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.url !== undefined) updateFields.url = parsed.data.url;
    if (parsed.data.events !== undefined)
      updateFields.events = parsed.data.events;
    if (parsed.data.is_active !== undefined)
      updateFields.is_active = parsed.data.is_active;
    if (parsed.data.description !== undefined)
      updateFields.description = parsed.data.description;

    /* Update the webhook — scoped to this workspace. */
    const { data: updated, error: updateError } = await supabase
      .from("webhooks")
      .update(updateFields)
      .eq("id", webhookId)
      .eq("workspace_id", id)
      .select(WEBHOOK_SELECT_COLUMNS)
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Webhook not found" },
        { status: updateError ? 500 : 404 },
      );
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/webhooks/[webhookId]
 *
 * Permanently delete a webhook and its delivery records.
 * Requires workspace membership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, webhookId } = await params;
  if (!id || !webhookId) {
    return NextResponse.json(
      { error: "Workspace ID and webhook ID are required" },
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

    /* Delete delivery records first (FK dependency). */
    await supabase
      .from("webhook_deliveries")
      .delete()
      .eq("webhook_id", webhookId);

    /* Delete the webhook — scoped to this workspace. */
    const { error: deleteError } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", webhookId)
      .eq("workspace_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
