import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Fetch all user IDs that belong to a given workspace.
 *
 * Used by v1 API routes to scope data access: records are only returned
 * when their `user_id` matches a member of the authenticated workspace.
 *
 * @param workspaceId - The workspace to look up members for.
 * @returns Array of user ID strings (empty if none found or on error).
 */
export async function getWorkspaceMemberUserIds(
  workspaceId: string,
): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId);

  if (error || !data) {
    return [];
  }

  return data.map((m: { user_id: string }) => m.user_id);
}

/**
 * Verify that a database record belongs to a workspace by checking that
 * its `user_id` is among the workspace's members.
 *
 * @param table       - The Supabase table name to query.
 * @param recordId    - The record's primary key (`id` column).
 * @param workspaceId - The workspace to check membership against.
 * @returns `{ data, error }` — data is the full record if found, or null with
 *          a descriptive error string.
 */
export async function verifyWorkspaceOwnership(
  table: string,
  recordId: string,
  workspaceId: string,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const memberIds = await getWorkspaceMemberUserIds(workspaceId);

  if (memberIds.length === 0) {
    return { data: null, error: "No workspace members found" };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", recordId)
    .in("user_id", memberIds)
    .single();

  if (error || !data) {
    return { data: null, error: "Not found" };
  }

  return { data: data as Record<string, unknown>, error: null };
}
