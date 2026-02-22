import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

/**
 * DELETE /api/workspaces/[id]/api-keys/[keyId]
 *
 * Revoke an API key by setting `is_revoked = true`.
 * The record is soft-deleted and will no longer authenticate requests.
 */
export async function DELETE(
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

    /* Revoke the key — scoped to this workspace to prevent cross-workspace access. */
    const { error: updateError } = await supabase
      .from("api_keys")
      .update({
        is_revoked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", keyId)
      .eq("workspace_id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { revoked: true } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
