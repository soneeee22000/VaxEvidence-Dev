import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateAuditLogPDF } from "@/lib/export/pdf-generator";
import type { ActivityFilters } from "@/lib/validators/activity";

/**
 * Export activity log as PDF
 * POST /api/export/activity/pdf
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
      limit: body.limit || 500,
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

    const limit = filters.limit ?? 500;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch activity logs" },
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

    if (activityLogs.length === 0) {
      return NextResponse.json(
        { error: "No activity logs found" },
        { status: 404 },
      );
    }

    // Generate PDF
    const pdfBlob = await generateAuditLogPDF(
      activityLogs,
      filters.from_date,
      filters.to_date,
    );

    // Generate filename with date range
    const fromDateStr = filters.from_date
      ? new Date(filters.from_date).toISOString().split("T")[0]
      : "all";
    const toDateStr = filters.to_date
      ? new Date(filters.to_date).toISOString().split("T")[0]
      : "all";
    const filename = `activity-audit-log-${fromDateStr}-to-${toDateStr}.pdf`;

    // Return PDF as download
    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting activity log as PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
