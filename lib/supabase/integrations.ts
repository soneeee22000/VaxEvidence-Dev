import { createClient } from "@/lib/supabase/browser";
import type {
  IntegrationRecord,
  IntegrationProvider,
  IntegrationCreateValues,
  IntegrationUpdateValues,
} from "@/lib/validators/integration";

// =============================================================================
// INTEGRATIONS CRUD
// =============================================================================
// Browser-side CRUD for the `integrations` table.
// Follows the same getClient/safeCall/notConfigured pattern as other CRUD
// modules (e.g., lib/supabase/screening.ts, lib/supabase/evidence.ts).
// =============================================================================

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

const notConfigured = <T>(): {
  data: T | null;
  error: { message: string };
} => ({
  data: null,
  error: { message: "Supabase is not configured." },
});

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

// -----------------------------------------------------------------------------
// CRUD Operations
// -----------------------------------------------------------------------------

/** Fetch all integrations for a workspace. */
export const fetchIntegrations = (
  workspaceId: string,
): SupabaseResult<IntegrationRecord[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<IntegrationRecord[]>());
  return safeCall(() =>
    client
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  );
};

/** Fetch a single integration by ID. */
export const fetchIntegrationById = (
  id: string,
): SupabaseResult<IntegrationRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<IntegrationRecord>());
  return safeCall(() =>
    client.from("integrations").select("*").eq("id", id).single(),
  );
};

/** Fetch a specific provider integration for a workspace. */
export const fetchIntegrationByProvider = (
  workspaceId: string,
  provider: IntegrationProvider,
): SupabaseResult<IntegrationRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<IntegrationRecord>());
  return safeCall(() =>
    client
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .single(),
  );
};

/** Create a new integration. */
export const createIntegration = (
  payload: IntegrationCreateValues & {
    workspace_id: string;
    created_by: string;
  },
): SupabaseResult<IntegrationRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<IntegrationRecord>());
  return safeCall(() =>
    client.from("integrations").insert(payload).select("*").single(),
  );
};

/** Update an existing integration. */
export const updateIntegration = (
  id: string,
  payload: IntegrationUpdateValues,
): SupabaseResult<IntegrationRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<IntegrationRecord>());
  return safeCall(() =>
    client
      .from("integrations")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
};

/** Delete an integration by ID. */
export const deleteIntegration = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() => client.from("integrations").delete().eq("id", id));
};
