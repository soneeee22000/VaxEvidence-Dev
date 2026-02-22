import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const mockSupabaseFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}));

import { provisionSSOUser } from "@/lib/auth/sso-provision";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(resolveValue));
  chain.then = (resolve: (val: unknown) => void) => resolve(resolveValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sso-provision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // provisionSSOUser
  // =========================================================================

  describe("provisionSSOUser", () => {
    it("returns error for invalid email format (no domain)", async () => {
      const result = await provisionSSOUser({
        userId: "u-1",
        email: "nodomain",
      });

      expect(result.workspaceId).toBeNull();
      expect(result.error).toBe("Invalid email format");
    });

    it("returns null workspaceId when no SSO config matches the domain", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({
          data: null,
          error: { message: "No rows found", code: "PGRST116" },
        }),
      );

      const result = await provisionSSOUser({
        userId: "u-1",
        email: "user@unknown-domain.com",
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith("sso_configurations");
      expect(result.workspaceId).toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns workspace ID but does not add member when auto_provision is false", async () => {
      const ssoConfig = {
        workspace_id: "ws-corp",
        default_role: "reviewer",
        auto_provision: false,
      };

      const chain = createMockChain({ data: ssoConfig, error: null });
      chain.single = vi.fn(() =>
        Promise.resolve({ data: ssoConfig, error: null }),
      );
      mockSupabaseFrom.mockReturnValue(chain);

      const result = await provisionSSOUser({
        userId: "u-1",
        email: "user@corp.example.com",
      });

      expect(result.workspaceId).toBe("ws-corp");
      expect(result.error).toBeNull();
      // Should only have called from() once (for sso_configurations, not workspace_members)
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);
      expect(mockSupabaseFrom).toHaveBeenCalledWith("sso_configurations");
    });

    it("returns workspace ID without inserting when user is already a member", async () => {
      const ssoConfig = {
        workspace_id: "ws-corp",
        default_role: "reviewer",
        auto_provision: true,
      };

      const existingMember = { id: "m-existing" };

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch SSO config
          const chain = createMockChain({ data: ssoConfig, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: ssoConfig, error: null }),
          );
          return chain;
        }
        // Check existing member
        const chain = createMockChain({
          data: existingMember,
          error: null,
        });
        chain.single = vi.fn(() =>
          Promise.resolve({ data: existingMember, error: null }),
        );
        return chain;
      });

      const result = await provisionSSOUser({
        userId: "u-existing",
        email: "existing@corp.example.com",
      });

      expect(result.workspaceId).toBe("ws-corp");
      expect(result.error).toBeNull();
      // Called sso_configurations and workspace_members (check), but NOT insert
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(2);
    });

    it("provisions new member with default role when auto_provision is true", async () => {
      const ssoConfig = {
        workspace_id: "ws-corp",
        default_role: "reviewer",
        auto_provision: true,
      };

      let callCount = 0;
      const insertChain = createMockChain({ data: null, error: null });
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch SSO config
          const chain = createMockChain({ data: ssoConfig, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: ssoConfig, error: null }),
          );
          return chain;
        }
        if (callCount === 2) {
          // Check existing member — not found
          const chain = createMockChain({ data: null, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: null, error: null }),
          );
          return chain;
        }
        // Insert new member
        return insertChain;
      });

      const result = await provisionSSOUser({
        userId: "u-new",
        email: "newuser@corp.example.com",
      });

      expect(result.workspaceId).toBe("ws-corp");
      expect(result.error).toBeNull();
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(3);
      expect(mockSupabaseFrom).toHaveBeenNthCalledWith(3, "workspace_members");
      expect(insertChain.insert).toHaveBeenCalledWith({
        workspace_id: "ws-corp",
        user_id: "u-new",
        role: "reviewer",
      });
    });

    it("uses 'viewer' as default role when default_role is empty", async () => {
      const ssoConfig = {
        workspace_id: "ws-corp",
        default_role: "",
        auto_provision: true,
      };

      let callCount = 0;
      const insertChain = createMockChain({ data: null, error: null });
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const chain = createMockChain({ data: ssoConfig, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: ssoConfig, error: null }),
          );
          return chain;
        }
        if (callCount === 2) {
          const chain = createMockChain({ data: null, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: null, error: null }),
          );
          return chain;
        }
        return insertChain;
      });

      await provisionSSOUser({
        userId: "u-new",
        email: "user@corp.example.com",
      });

      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ role: "viewer" }),
      );
    });

    it("returns error when member insert fails", async () => {
      const ssoConfig = {
        workspace_id: "ws-corp",
        default_role: "reviewer",
        auto_provision: true,
      };

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const chain = createMockChain({ data: ssoConfig, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: ssoConfig, error: null }),
          );
          return chain;
        }
        if (callCount === 2) {
          const chain = createMockChain({ data: null, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: null, error: null }),
          );
          return chain;
        }
        // Insert fails
        return createMockChain({
          data: null,
          error: { message: "Unique constraint violation" },
        });
      });

      const result = await provisionSSOUser({
        userId: "u-dup",
        email: "dup@corp.example.com",
      });

      expect(result.workspaceId).toBeNull();
      expect(result.error).toBe("Unique constraint violation");
    });

    it("correctly extracts domain from email address", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({
          data: null,
          error: { message: "No rows" },
        }),
      );

      await provisionSSOUser({
        userId: "u-1",
        email: "jane.doe@subdomain.corp.example.com",
      });

      const chain = mockSupabaseFrom.mock.results[0].value;
      // The chain should have been called with eq("domain", "subdomain.corp.example.com")
      expect(chain.eq).toHaveBeenCalledWith(
        "domain",
        "subdomain.corp.example.com",
      );
    });

    it("queries SSO config with correct domain and is_active filter", async () => {
      const ssoConfigChain = createMockChain({
        data: null,
        error: { message: "No rows" },
      });
      mockSupabaseFrom.mockReturnValue(ssoConfigChain);

      await provisionSSOUser({
        userId: "u-1",
        email: "user@example.org",
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith("sso_configurations");
      expect(ssoConfigChain.select).toHaveBeenCalledWith(
        "workspace_id, default_role, auto_provision",
      );
      expect(ssoConfigChain.eq).toHaveBeenCalledWith("domain", "example.org");
      expect(ssoConfigChain.eq).toHaveBeenCalledWith("is_active", true);
    });
  });
});
