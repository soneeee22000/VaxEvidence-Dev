import { createClient } from "@/lib/supabase/browser";
import type { Workspace } from "@/lib/validators/workspace";
import type { WorkspaceRole } from "@/lib/auth/permissions";

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
// WORKSPACE CRUD
// =============================================================================

/**
 * Fetches all workspaces the current user is a member of.
 */
export const fetchWorkspaces = (): SupabaseResult<Workspace[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Workspace[]>());
  return safeCall(() =>
    client
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true }),
  );
};

/**
 * Fetches a single workspace by ID.
 */
export const fetchWorkspaceById = (id: string): SupabaseResult<Workspace> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Workspace>());
  return safeCall(() =>
    client.from("workspaces").select("*").eq("id", id).single(),
  );
};

/**
 * Creates a new workspace and adds the creator as admin member.
 */
export const createWorkspace = async (payload: {
  name: string;
  slug: string;
  owner_id: string;
}): SupabaseResult<Workspace> => {
  const client = getClient();
  if (!client) return notConfigured<Workspace>();

  // Create workspace
  const { data: workspace, error: wsError } = await safeCall(() =>
    client
      .from("workspaces")
      .insert({
        name: payload.name,
        slug: payload.slug,
        owner_id: payload.owner_id,
      })
      .select("*")
      .single(),
  );

  if (wsError || !workspace) return { data: null, error: wsError };

  const ws = workspace as Workspace;

  // Add creator as admin member
  await safeCall(() =>
    client.from("workspace_members").insert({
      workspace_id: ws.id,
      user_id: payload.owner_id,
      role: "admin",
    }),
  );

  return { data: ws, error: null };
};

/**
 * Updates workspace settings/name.
 */
export const updateWorkspace = (
  id: string,
  payload: Partial<Pick<Workspace, "name" | "settings">>,
): SupabaseResult<Workspace> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Workspace>());
  return safeCall(() =>
    client
      .from("workspaces")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
};

/**
 * Deletes a workspace (CASCADE removes all members, invitations, and data).
 */
export const deleteWorkspace = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() => client.from("workspaces").delete().eq("id", id));
};

/**
 * Gets the current user's role in a workspace.
 */
export const getUserWorkspaceRole = async (
  workspaceId: string,
  userId: string,
): SupabaseResult<WorkspaceRole> => {
  const client = getClient();
  if (!client) return notConfigured<WorkspaceRole>();

  const { data, error } = await safeCall(() =>
    client
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single(),
  );

  if (error || !data) return { data: null, error };
  return { data: (data as any).role as WorkspaceRole, error: null };
};
