import { NextResponse, type NextRequest } from "next/server";
import { eventBatchSchema } from "@/lib/validators/analytics";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

const EVENTS_RATE_LIMIT = 100; // 100 events per minute
const EVENTS_WINDOW_MS = 60_000;

/**
 * POST /api/analytics/events — Batch-insert custom analytics events.
 * Accepts up to 50 events per request. Auth is optional.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const rl = checkIpRateLimit(request, EVENTS_RATE_LIMIT, EVENTS_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429, headers: getIpRateLimitHeaders(rl) },
      );
    }

    const body = await request.json();
    const parsed = eventBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Optional auth
    const user = await getServerUser();
    const userId = user?.id ?? null;

    const rows = parsed.data.events.map((event) => ({
      user_id: userId,
      event_name: event.event_name,
      properties: event.properties ?? {},
      page_url: event.page_url ?? null,
      session_id: event.session_id ?? null,
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("custom_events").insert(rows);

    if (error) {
      console.error("Failed to insert events:", error.message);
      return NextResponse.json(
        { error: "Failed to save events." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, count: rows.length },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
