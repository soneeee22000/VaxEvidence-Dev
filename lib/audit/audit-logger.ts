import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";

// =============================================================================
// AUDIT LOGGER
// =============================================================================
// Server-only structured audit logger for compliance-grade event tracking.
// Writes immutable, append-only entries to the `compliance_audit_logs` table.
// Fire-and-forget design: errors are swallowed so audit logging never breaks
// business logic.
// =============================================================================

/** Audit log entry fields. */
export interface AuditLogEntry {
  /** The workspace this event belongs to. */
  workspaceId: string;
  /** The user who performed the action. */
  userId: string;
  /** Action verb (e.g., "create", "update", "delete", "export", "login", "api_key.create"). */
  action: string;
  /** Resource type (e.g., "protocol", "evidence", "dataset", "api_key", "webhook", "sso_config"). */
  resourceType: string;
  /** Optional resource identifier. */
  resourceId?: string;
  /** Optional before/after diff for change tracking. */
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  /** Client IP address (from x-forwarded-for). */
  ipAddress?: string;
  /** Client user agent string. */
  userAgent?: string;
  /** Arbitrary metadata for additional context. */
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event. Fire-and-forget — errors are swallowed.
 * Append-only: audit logs cannot be modified or deleted.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("compliance_audit_logs").insert({
      workspace_id: entry.workspaceId,
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      changes: entry.changes ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // Swallow errors — audit logging should never break business logic
  }
}

/**
 * Extract IP and user agent from a request for audit logging.
 */
export function extractRequestContext(request: Request): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
