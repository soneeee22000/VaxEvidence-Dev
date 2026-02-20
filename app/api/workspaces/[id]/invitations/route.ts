import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { invitationCreateSchema } from "@/lib/validators/workspace";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/invitations — List all invitations for a workspace.
 * Only admins can view invitations.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const supabase = getSupabaseAdmin();

    // Verify admin role
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view invitations" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/invitations — Create an invitation.
 * Only admins can invite members.
 * Prevents duplicate pending invitations and inviting existing members.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = invitationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { email, role } = parsed.data;

  try {
    const supabase = getSupabaseAdmin();

    // Verify admin role
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite members" },
        { status: 403 },
      );
    }

    // Check for existing pending invitation to same email
    const { data: existingInvitation } = await supabase
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 409 },
      );
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: id,
        email,
        role,
        invited_by: user.id,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
