import "server-only";

import { createHmac, randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { WebhookEvent } from "@/lib/validators/webhook";

/** HMAC-SHA256 sign a payload with a secret. */
export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Generate a random webhook secret. */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

/**
 * Dispatch a webhook event to all active webhooks in a workspace.
 * Creates delivery records and attempts immediate delivery.
 * This is fire-and-forget — errors are logged but don't propagate.
 */
export async function dispatchEvent(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  /* Find all active webhooks for this workspace that subscribe to this event. */
  const { data: webhooks, error } = await supabase
    .from("webhooks")
    .select("id, url, secret, events")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  if (error || !webhooks || webhooks.length === 0) return;

  /* Filter to webhooks that subscribe to this event. */
  const matching = webhooks.filter((w: { events: string[] }) =>
    w.events.includes(event),
  );

  if (matching.length === 0) return;

  /* Create delivery records and attempt delivery for each. */
  for (const webhook of matching) {
    const deliveryPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    /* Create the delivery record. */
    const { data: delivery, error: deliveryError } = await supabase
      .from("webhook_deliveries")
      .insert({
        webhook_id: webhook.id,
        event_type: event,
        payload: deliveryPayload,
        status: "pending",
        attempts: 0,
      })
      .select("id")
      .single();

    if (deliveryError || !delivery) continue;

    /* Attempt immediate delivery (fire-and-forget). */
    deliverWebhook(delivery.id).catch(() => {
      /* intentionally empty — delivery will be retried */
    });
  }
}

/**
 * Attempt to deliver a single webhook.
 * Fetches the delivery record, signs the payload, sends HTTP POST.
 * Updates delivery status based on outcome.
 */
export async function deliverWebhook(deliveryId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  /* Fetch the delivery + webhook details. */
  const { data: delivery, error: fetchError } = await supabase
    .from("webhook_deliveries")
    .select("*, webhooks(url, secret)")
    .eq("id", deliveryId)
    .single();

  if (fetchError || !delivery) return false;

  const webhook = delivery.webhooks as { url: string; secret: string } | null;
  if (!webhook) return false;

  const payloadStr = JSON.stringify(delivery.payload);
  const signature = signPayload(payloadStr, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VaxEvidence-Signature": signature,
        "X-VaxEvidence-Event": delivery.event_type,
        "X-VaxEvidence-Delivery": deliveryId,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "delivered",
          attempts: delivery.attempts + 1,
          last_response_code: response.status,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", deliveryId);
      return true;
    }

    /* Non-2xx response — mark for retry. */
    const nextAttempt = delivery.attempts + 1;
    const backoffMs = Math.min(1000 * Math.pow(2, nextAttempt), 3600000); // exponential backoff, max 1 hour

    await supabase
      .from("webhook_deliveries")
      .update({
        status: nextAttempt >= delivery.max_attempts ? "failed" : "pending",
        attempts: nextAttempt,
        last_response_code: response.status,
        next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
      })
      .eq("id", deliveryId);
    return false;
  } catch {
    /* Network error — mark for retry. */
    const nextAttempt = delivery.attempts + 1;
    const backoffMs = Math.min(1000 * Math.pow(2, nextAttempt), 3600000);

    await supabase
      .from("webhook_deliveries")
      .update({
        status: nextAttempt >= delivery.max_attempts ? "failed" : "pending",
        attempts: nextAttempt,
        next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
      })
      .eq("id", deliveryId);
    return false;
  }
}

/**
 * Retry all failed/pending deliveries that are past their retry time.
 * Called by the cron endpoint.
 */
export async function retryPendingDeliveries(): Promise<{
  attempted: number;
  delivered: number;
}> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from("webhook_deliveries")
    .select("id")
    .in("status", ["pending", "failed"])
    .lt("next_retry_at", now)
    .lt("attempts", 5) // max retry attempts
    .order("next_retry_at", { ascending: true })
    .limit(100);

  if (error || !pending) return { attempted: 0, delivered: 0 };

  let delivered = 0;
  for (const record of pending) {
    const success = await deliverWebhook(record.id);
    if (success) delivered++;
  }

  return { attempted: pending.length, delivered };
}
