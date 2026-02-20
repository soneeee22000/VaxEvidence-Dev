import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { memberRoleUpdateSchema } from "@/lib/validators/workspace";

type RouteContext = { params: Promise<{ id: string; uid: string }> };

/**
 * PATCH /api/workspaces/[id]/members/[uid] — Update a member's role.
 * Only admins can change member roles.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, uid } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = memberRoleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify caller is admin
    const { data: callerMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!callerMembership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (callerMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change member roles" },
        { status: 403 },
      );
    }

    // Prevent demoting the last admin
    if (uid === user.id && parsed.data.role !== "admin") {
      const { count } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", id)
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin" },
          { status: 400 },
        );
      }
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ role: parsed.data.role })
      .eq("workspace_id", id)
      .eq("user_id", uid)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/members/[uid] — Remove a member from workspace.
 * Admins can remove anyone. Members can remove themselves (leave).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, uid } = await context.params;
  const isSelfRemoval = uid === user.id;

  try {
    const supabase = getSupabaseAdmin();

    // Verify caller membership
    const { data: callerMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!callerMembership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Non-admins can only remove themselves
    if (!isSelfRemoval && callerMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can remove other members" },
        { status: 403 },
      );
    }

    // Prevent removing the last admin
    if (isSelfRemoval && callerMembership.role === "admin") {
      const { count } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", id)
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin" },
          { status: 400 },
        );
      }
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", id)
      .eq("user_id", uid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
