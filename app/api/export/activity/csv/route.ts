import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateActivityCSV } from "@/lib/export/csv-generator";
import type { ActivityFilters } from "@/lib/validators/activity";

/**
 * Export activity log as CSV
 * POST /api/export/activity/csv
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const filters: ActivityFilters = {
      user_id: body.userId,
      action_type: body.actionType,
      resource_type: body.resourceType,
      from_date: body.fromDate,
      to_date: body.toDate,
      limit: body.limit || 1000,
    };

    const admin = getSupabaseAdmin();

    // Build query with filters
    let query = admin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.user_id) query = query.eq("user_id", filters.user_id);
    if (filters.action_type && filters.action_type.length > 0)
      query = query.in("action", filters.action_type as string[]);
    if (filters.resource_type && filters.resource_type.length > 0)
      query = query.in("resource_type", filters.resource_type as string[]);
    if (filters.from_date) query = query.gte("created_at", filters.from_date);
    if (filters.to_date) query = query.lte("created_at", filters.to_date);

    const limit = filters.limit ?? 1000;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data: rows, error } = await query;

    if (error) {
      console.error("[Activity Export] Failed to fetch activity logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity logs", details: error.message },
        { status: 500 },
      );
    }

    // Transform rows to match ActivityLogWithUser shape
    const activityLogs = (rows ?? []).map((row: any) => ({
      ...row,
      action_type: row.action ?? row.action_type,
      user: {
        id: row.user_id,
        email: row.user_email ?? "Unknown user",
      },
    }));

    // If no activity logs, return empty CSV with headers (not 404)
    if (activityLogs.length === 0) {
      const emptyCSV =
        "timestamp,user,action,resource_type,resource_id,description\n";
      const filename = "activity-log-empty.csv";
      return new Response(emptyCSV, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Generate CSV
    const csv = generateActivityCSV(activityLogs);

    // Generate filename with date range
    const fromDateStr = filters.from_date
      ? new Date(filters.from_date).toISOString().split("T")[0]
      : "all";
    const toDateStr = filters.to_date
      ? new Date(filters.to_date).toISOString().split("T")[0]
      : "all";
    const filename = `activity-log-${fromDateStr}-to-${toDateStr}.csv`;

    // Return CSV as download
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting activity log as CSV:", error);
    return NextResponse.json(
      {
        error: "Failed to generate CSV",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
