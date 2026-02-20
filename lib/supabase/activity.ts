import { createClient } from "@/lib/supabase/browser";

import type {
  ActivityFilters,
  ActivityLogWithUser,
} from "@/lib/validators/activity";

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

const withUser = (rows: any[] | null): ActivityLogWithUser[] => {
  const list = rows ?? [];
  return list.map((row) => ({
    ...row,
    action_type: row.action ?? row.action_type,
    user: {
      id: row.user_id,
      email: row.user_email ?? "Unknown user",
    },
  }));
};

export const fetchActivityLog = async (
  filters: ActivityFilters = {},
): SupabaseResult<ActivityLogWithUser[]> => {
  const client = getClient();
  if (!client) return notConfigured<ActivityLogWithUser[]>();

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const { data, error } = await safeCall(async () => {
    let query = client
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.user_id) query = query.eq("user_id", filters.user_id);
    if (filters.action_type && filters.action_type.length > 0)
      query = query.in("action", filters.action_type as any);
    if (filters.resource_type && filters.resource_type.length > 0)
      query = query.in("resource_type", filters.resource_type as any);
    if (filters.from_date) query = query.gte("created_at", filters.from_date);
    if (filters.to_date) query = query.lte("created_at", filters.to_date);

    query = query.range(offset, offset + limit - 1);

    const res = await query;
    return { data: (res.data as any) ?? null, error: res.error };
  });

  if (error) return { data: null, error };
  return { data: withUser((data as any[]) ?? []), error: null };
};

/**
 * Log an activity event.
 * Call from client components after successful write operations.
 */
export const logActivity = async (
  userId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return notConfigured<null>();

  return safeCall(() =>
    client
      .from("activity_logs")
      .insert({
        user_id: userId,
        action: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: metadata ?? {},
      })
      .select()
      .then(({ error }: { error: { message: string } | null }) => ({
        data: null,
        error,
      })),
  );
};
