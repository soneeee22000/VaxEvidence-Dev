import { NextRequest, NextResponse } from "next/server";
import { retryPendingDeliveries } from "@/lib/api/webhook-dispatcher";

/**
 * GET /api/cron/webhook-retry
 *
 * Cron endpoint for retrying failed/pending webhook deliveries.
 * Authenticated via CRON_SECRET environment variable — no Supabase user auth.
 * Returns the number of deliveries attempted and successfully delivered.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  /* If CRON_SECRET is not configured, the cron endpoint is unavailable. */
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron endpoint not configured — CRON_SECRET is missing" },
      { status: 503 },
    );
  }

  /* Verify the Authorization header matches the cron secret. */
  const authHeader = request.headers.get("Authorization");
  const expectedHeader = `Bearer ${cronSecret}`;

  if (authHeader !== expectedHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await retryPendingDeliveries();

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
