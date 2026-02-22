import { createClient } from "@/lib/supabase/browser";

// =============================================================================
// AUDIT LOGS CRUD MODULE
// =============================================================================
// Read-only client-side module for the `compliance_audit_logs` table.
// Audit logs are immutable — only SELECT is supported (no create/update/delete).
// Writes happen exclusively via the server-side audit logger.
// =============================================================================

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

/** A single audit log record from the database. */
export interface AuditLogRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Filter options for fetching audit logs. */
export interface AuditLogFilters {
  /** Filter by action (e.g., "create", "update", "delete"). */
  action?: string;
  /** Filter by resource type (e.g., "protocol", "evidence"). */
  resourceType?: string;
  /** Filter by user ID. */
  userId?: string;
  /** Filter by start date (ISO string). */
  fromDate?: string;
  /** Filter by end date (ISO string). */
  toDate?: string;
  /** Search by resource ID (exact match). */
  resourceId?: string;
  /** Page number (1-indexed). */
  page?: number;
  /** Items per page. */
  perPage?: number;
}

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

/**
 * Fetch paginated audit logs for a workspace with optional filters.
 */
export const fetchAuditLogs = async (
  workspaceId: string,
  options: AuditLogFilters = {},
): SupabaseResult<AuditLogRecord[]> => {
  const client = getClient();
  if (!client) return notConfigured<AuditLogRecord[]>();

  const page = options.page ?? 1;
  const perPage = options.perPage ?? 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  return safeCall(async () => {
    let query = client
      .from("compliance_audit_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (options.action) {
      query = query.eq("action", options.action);
    }
    if (options.resourceType) {
      query = query.eq("resource_type", options.resourceType);
    }
    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options.fromDate) {
      query = query.gte("created_at", options.fromDate);
    }
    if (options.toDate) {
      query = query.lte("created_at", options.toDate);
    }
    if (options.resourceId) {
      query = query.eq("resource_id", options.resourceId);
    }

    query = query.range(from, to);

    const res = await query;
    return { data: (res.data as AuditLogRecord[]) ?? null, error: res.error };
  });
};

/**
 * Fetch the total count of audit logs for a workspace with optional filters.
 * Used for pagination.
 */
export const fetchAuditLogCount = async (
  workspaceId: string,
  options: AuditLogFilters = {},
): SupabaseResult<number> => {
  const client = getClient();
  if (!client) return notConfigured<number>();

  try {
    let query = client
      .from("compliance_audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (options.action) {
      query = query.eq("action", options.action);
    }
    if (options.resourceType) {
      query = query.eq("resource_type", options.resourceType);
    }
    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options.fromDate) {
      query = query.gte("created_at", options.fromDate);
    }
    if (options.toDate) {
      query = query.lte("created_at", options.toDate);
    }
    if (options.resourceId) {
      query = query.eq("resource_id", options.resourceId);
    }

    const { count, error } = await query;
    return {
      data: count ?? 0,
      error: error ? { message: error.message } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};
