import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { deliverWebhook } from "@/lib/api/webhook-dispatcher";

/**
 * POST /api/workspaces/[id]/webhooks/[webhookId]/test
 *
 * Send a test ping event to a webhook. Creates a delivery record with
 * event_type "test.ping" and attempts immediate delivery.
 * Returns the delivery result so the UI can show success/failure.
 */
export async function POST(
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

    /* Verify the webhook exists and belongs to this workspace. */
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks")
      .select("id")
      .eq("id", webhookId)
      .eq("workspace_id", id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    /* Create a test delivery record. */
    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: { test: true, timestamp: new Date().toISOString() },
    };

    const { data: delivery, error: deliveryError } = await supabase
      .from("webhook_deliveries")
      .insert({
        webhook_id: webhookId,
        event_type: "test.ping",
        payload: testPayload,
        status: "pending",
        attempts: 0,
      })
      .select("id")
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: deliveryError?.message ?? "Failed to create test delivery" },
        { status: 500 },
      );
    }

    /* Attempt immediate delivery. */
    const success = await deliverWebhook(delivery.id);

    /* Fetch the final delivery status. */
    const { data: result } = await supabase
      .from("webhook_deliveries")
      .select(
        "id, event_type, status, attempts, last_response_code, created_at, delivered_at",
      )
      .eq("id", delivery.id)
      .single();

    return NextResponse.json({
      data: {
        success,
        delivery: result,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
