import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

import {
  logAuditEvent,
  extractRequestContext,
  type AuditLogEntry,
} from "@/lib/audit/audit-logger";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("audit-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ data: null, error: null });
  });

  // =========================================================================
  // logAuditEvent
  // =========================================================================

  describe("logAuditEvent", () => {
    it("inserts a record into compliance_audit_logs with all required fields", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "create",
        resourceType: "protocol",
        resourceId: "p-1",
      };

      await logAuditEvent(entry);

      expect(mockFrom).toHaveBeenCalledWith("compliance_audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        workspace_id: "ws-1",
        user_id: "u-1",
        action: "create",
        resource_type: "protocol",
        resource_id: "p-1",
        changes: null,
        ip_address: null,
        user_agent: null,
        metadata: {},
      });
    });

    it("includes optional changes field when provided", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "update",
        resourceType: "evidence",
        resourceId: "e-1",
        changes: {
          before: { title: "Old Title" },
          after: { title: "New Title" },
        },
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            before: { title: "Old Title" },
            after: { title: "New Title" },
          },
        }),
      );
    });

    it("includes IP address and user agent when provided", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "export",
        resourceType: "protocol",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0",
        }),
      );
    });

    it("includes metadata when provided", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "api_key.create",
        resourceType: "api_key",
        metadata: { key_prefix: "vax_pk_", scope: "read" },
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { key_prefix: "vax_pk_", scope: "read" },
        }),
      );
    });

    it("defaults resource_id to null when not provided", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "login",
        resourceType: "session",
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_id: null,
        }),
      );
    });

    it("defaults metadata to empty object when not provided", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "delete",
        resourceType: "dataset",
        resourceId: "d-1",
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        }),
      );
    });

    it("does not throw when insert fails (fire-and-forget)", async () => {
      mockInsert.mockRejectedValue(new Error("Database connection lost"));

      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "create",
        resourceType: "protocol",
      };

      // Should not throw
      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });

    it("does not throw when insert returns error", async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: "RLS violation" },
      });

      const entry: AuditLogEntry = {
        workspaceId: "ws-1",
        userId: "u-1",
        action: "create",
        resourceType: "protocol",
      };

      // Fire-and-forget: should not propagate
      await expect(logAuditEvent(entry)).resolves.toBeUndefined();
    });

    it("maps all camelCase fields to snake_case correctly", async () => {
      const entry: AuditLogEntry = {
        workspaceId: "ws-abc",
        userId: "u-xyz",
        action: "update",
        resourceType: "sso_config",
        resourceId: "sso-123",
        ipAddress: "10.0.0.1",
        userAgent: "TestAgent/1.0",
        changes: {
          before: { domain: "old.com" },
          after: { domain: "new.com" },
        },
        metadata: { initiated_by: "admin" },
      };

      await logAuditEvent(entry);

      expect(mockInsert).toHaveBeenCalledWith({
        workspace_id: "ws-abc",
        user_id: "u-xyz",
        action: "update",
        resource_type: "sso_config",
        resource_id: "sso-123",
        changes: {
          before: { domain: "old.com" },
          after: { domain: "new.com" },
        },
        ip_address: "10.0.0.1",
        user_agent: "TestAgent/1.0",
        metadata: { initiated_by: "admin" },
      });
    });
  });

  // =========================================================================
  // extractRequestContext
  // =========================================================================

  describe("extractRequestContext", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.50",
          "user-agent": "TestBrowser/1.0",
        },
      });

      const ctx = extractRequestContext(request);

      expect(ctx.ipAddress).toBe("203.0.113.50");
      expect(ctx.userAgent).toBe("TestBrowser/1.0");
    });

    it("extracts first IP from comma-separated x-forwarded-for", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.50, 70.41.3.18, 150.172.238.178",
        },
      });

      const ctx = extractRequestContext(request);

      expect(ctx.ipAddress).toBe("203.0.113.50");
    });

    it("trims whitespace from IP address", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          "x-forwarded-for": "  10.0.0.1  , 192.168.1.1",
        },
      });

      const ctx = extractRequestContext(request);

      expect(ctx.ipAddress).toBe("10.0.0.1");
    });

    it("returns undefined for missing headers", () => {
      const request = new Request("http://localhost/api/test");

      const ctx = extractRequestContext(request);

      expect(ctx.ipAddress).toBeUndefined();
      expect(ctx.userAgent).toBeUndefined();
    });

    it("returns undefined for ipAddress when x-forwarded-for is missing", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });

      const ctx = extractRequestContext(request);

      expect(ctx.ipAddress).toBeUndefined();
      expect(ctx.userAgent).toBe("Mozilla/5.0");
    });
  });
});
