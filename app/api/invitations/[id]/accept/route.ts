import { NextResponse } from "next/server";

import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/invitations/[id]/accept — Accept a workspace invitation.
 * The invitation must be pending and not expired.
 * The user is added as a workspace member with the invited role.
 */
export async function POST(_request: Request, context: RouteContext) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const supabase = getSupabaseAdmin();

    // Fetch the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Verify the invitation belongs to this user's email
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: "This invitation is not for your account" },
        { status: 403 },
      );
    }

    // Check status
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 },
      );
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invitation.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Mark invitation as accepted but don't add duplicate member
      await supabase
        .from("workspace_invitations")
        .update({ status: "accepted" })
        .eq("id", id);

      return NextResponse.json(
        { error: "You are already a member of this workspace" },
        { status: 409 },
      );
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Add user as workspace member
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      })
      .select("*")
      .single();

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ data: member });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
