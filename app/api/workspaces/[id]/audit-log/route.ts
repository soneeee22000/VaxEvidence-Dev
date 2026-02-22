import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

// =============================================================================
// AUDIT LOG API ROUTE
// =============================================================================
// GET /api/workspaces/[id]/audit-log
//
// Returns paginated, filterable compliance audit logs for a workspace.
// Requires authenticated user with admin role in the workspace.
// =============================================================================

/**
 * GET /api/workspaces/[id]/audit-log
 *
 * Query params:
 *   page         — Page number (1-indexed, default: 1)
 *   per_page     — Items per page (default: 25, max: 100)
 *   action       — Filter by action (e.g., "create", "update", "delete")
 *   resource_type — Filter by resource type (e.g., "protocol", "evidence")
 *   user_id      — Filter by user ID
 *   from_date    — Filter events after this ISO date
 *   to_date      — Filter events before this ISO date
 *   resource_id  — Filter by exact resource ID
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

    /* Verify user is an admin member of the workspace. */
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminRoles = ["admin", "owner"];
    if (!adminRoles.includes(membership.role as string)) {
      return NextResponse.json(
        { error: "Admin role required to view audit logs" },
        { status: 403 },
      );
    }

    /* Parse query parameters. */
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("per_page") ?? "25", 10)),
    );
    const action = url.searchParams.get("action") || undefined;
    const resourceType = url.searchParams.get("resource_type") || undefined;
    const userId = url.searchParams.get("user_id") || undefined;
    const fromDate = url.searchParams.get("from_date") || undefined;
    const toDate = url.searchParams.get("to_date") || undefined;
    const resourceId = url.searchParams.get("resource_id") || undefined;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    /* Build query with count. */
    let query = supabase
      .from("compliance_audit_logs")
      .select("*", { count: "exact" })
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (userId) query = query.eq("user_id", userId);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);
    if (resourceId) query = query.eq("resource_id", resourceId);

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / perPage),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
