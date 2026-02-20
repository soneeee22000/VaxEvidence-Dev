import { createClient } from "@/lib/supabase/browser";
import type {
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
} from "@/lib/validators/workspace";

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

const notConfigured = <T>(
  message = "Supabase is not configured.",
): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } };
};

const safeCall = async <T>(
  fn: () => Promise<{ data: T | null; error: any }>,
): SupabaseResult<T> => {
  try {
    const { data, error } = await fn();
    return {
      data: (data ?? null) as T | null,
      error: error ? { message: error.message ?? String(error) } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

// =============================================================================
// WORKSPACE MEMBERS
// =============================================================================

/**
 * Fetches all members of a workspace.
 */
export const fetchMembers = (
  workspaceId: string,
): SupabaseResult<WorkspaceMember[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceMember[]>());
  return safeCall(() =>
    client
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("joined_at", { ascending: true }),
  );
};

/**
 * Adds a member to a workspace.
 */
export const addMember = (payload: {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
}): SupabaseResult<WorkspaceMember> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceMember>());
  return safeCall(() =>
    client.from("workspace_members").insert(payload).select("*").single(),
  );
};

/**
 * Updates a member's role.
 */
export const updateMemberRole = (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): SupabaseResult<WorkspaceMember> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceMember>());
  return safeCall(() =>
    client
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .select("*")
      .single(),
  );
};

/**
 * Removes a member from a workspace.
 */
export const removeMember = (
  workspaceId: string,
  userId: string,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId),
  );
};

/**
 * Counts admins in a workspace (used to prevent removing the last admin).
 */
export const countAdmins = async (
  workspaceId: string,
): SupabaseResult<number> => {
  const client = getClient();
  if (!client) return notConfigured<number>();

  const { data, error } = await safeCall(async () => {
    const res = await client
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role", "admin");
    return { data: (res.count ?? 0) as any, error: res.error };
  });

  return { data, error };
};

// =============================================================================
// WORKSPACE INVITATIONS
// =============================================================================

/**
 * Fetches all invitations for a workspace.
 */
export const fetchInvitations = (
  workspaceId: string,
): SupabaseResult<WorkspaceInvitation[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceInvitation[]>());
  return safeCall(() =>
    client
      .from("workspace_invitations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  );
};

/**
 * Fetches pending invitations for the current user (by email).
 */
export const fetchMyInvitations = (
  email: string,
): SupabaseResult<WorkspaceInvitation[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceInvitation[]>());
  return safeCall(() =>
    client
      .from("workspace_invitations")
      .select("*, workspaces(name)")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  );
};

/**
 * Creates an invitation.
 */
export const createInvitation = (payload: {
  workspace_id: string;
  email: string;
  role: string;
  invited_by: string;
}): SupabaseResult<WorkspaceInvitation> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<WorkspaceInvitation>());
  return safeCall(() =>
    client
      .from("workspace_invitations")
      .insert({
        workspace_id: payload.workspace_id,
        email: payload.email,
        role: payload.role,
        invited_by: payload.invited_by,
        status: "pending",
      })
      .select("*")
      .single(),
  );
};

/**
 * Accepts an invitation: updates status and adds user as member.
 */
export const acceptInvitation = async (
  invitationId: string,
  userId: string,
): SupabaseResult<WorkspaceMember> => {
  const client = getClient();
  if (!client) return notConfigured<WorkspaceMember>();

  // Fetch the invitation
  const { data: invitation, error: fetchError } = await safeCall(() =>
    client
      .from("workspace_invitations")
      .select("*")
      .eq("id", invitationId)
      .single(),
  );

  if (fetchError || !invitation) {
    return {
      data: null,
      error: fetchError ?? { message: "Invitation not found" },
    };
  }

  const inv = invitation as WorkspaceInvitation;

  // Check if expired
  if (new Date(inv.expires_at) < new Date()) {
    return { data: null, error: { message: "Invitation has expired" } };
  }

  // Update invitation status
  await safeCall(() =>
    client
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId),
  );

  // Add user as member with the invited role
  return safeCall(() =>
    client
      .from("workspace_members")
      .insert({
        workspace_id: inv.workspace_id,
        user_id: userId,
        role: inv.role,
      })
      .select("*")
      .single(),
  );
};

/**
 * Declines an invitation.
 */
export const declineInvitation = (
  invitationId: string,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client
      .from("workspace_invitations")
      .update({ status: "declined" })
      .eq("id", invitationId),
  );
};

/**
 * Deletes an invitation (admin action).
 */
export const deleteInvitation = (
  invitationId: string,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("workspace_invitations").delete().eq("id", invitationId),
  );
};
