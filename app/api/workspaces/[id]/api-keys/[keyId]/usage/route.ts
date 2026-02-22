import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

/** Maximum number of days that can be queried. */
const MAX_DAYS = 30;

/** Default number of days when no `days` query parameter is provided. */
const DEFAULT_DAYS = 7;

/**
 * GET /api/workspaces/[id]/api-keys/[keyId]/usage?days=7
 *
 * Return daily aggregated usage stats for a specific API key.
 * Accepts an optional `days` query parameter (1-30, default 7).
 */
export async function GET(
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

    /* Parse and clamp the days parameter. */
    const url = new URL(request.url);
    const rawDays = url.searchParams.get("days");
    const days = Math.min(
      MAX_DAYS,
      Math.max(
        1,
        rawDays ? parseInt(rawDays, 10) || DEFAULT_DAYS : DEFAULT_DAYS,
      ),
    );

    /* Calculate the cutoff date. */
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffIso = cutoff.toISOString();

    /* Fetch request logs for this API key within the window. */
    const { data: logs, error: logsError } = await supabase
      .from("api_request_logs")
      .select("created_at, response_time_ms")
      .eq("api_key_id", keyId)
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: true });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    /* Aggregate logs by day. */
    const dailyMap = new Map<
      string,
      { count: number; totalResponseMs: number }
    >();

    for (const log of logs ?? []) {
      const date = (log.created_at as string).slice(0, 10); // YYYY-MM-DD
      const existing = dailyMap.get(date) ?? {
        count: 0,
        totalResponseMs: 0,
      };

      existing.count += 1;
      existing.totalResponseMs += (log.response_time_ms as number) ?? 0;
      dailyMap.set(date, existing);
    }

    const daily = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      count: stats.count,
      avg_response_ms:
        stats.count > 0 ? Math.round(stats.totalResponseMs / stats.count) : 0,
    }));

    const totalRequests = (logs ?? []).length;

    return NextResponse.json({
      data: {
        total_requests: totalRequests,
        daily,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
