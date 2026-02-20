import { NextResponse } from "next/server";

import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/invitations/[id]/decline — Decline a workspace invitation.
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

    // Update invitation status
    const { error: updateError } = await supabase
      .from("workspace_invitations")
      .update({ status: "declined" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
