import { describe, it, expect, vi, beforeEach } from "vitest";

// Proxy-based chainable mock
function createChainableMock(terminalValue: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[][]> = {};
  let afterTerminal = false;

  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop === "_calls") return calls;
      if (prop === "then") {
        if (afterTerminal) {
          return (resolve: (v: unknown) => void) => resolve(terminalValue);
        }
        return undefined;
      }

      return (...args: unknown[]) => {
        if (!calls[prop]) calls[prop] = [];
        calls[prop].push(args);

        if (prop === "single" || prop === "maybeSingle") {
          return Promise.resolve(terminalValue);
        }
        if (prop === "order") {
          return Promise.resolve(terminalValue);
        }
        if (prop === "delete" || prop === "update") {
          afterTerminal = true;
        }

        return new Proxy({}, handler);
      };
    },
  };

  return new Proxy({}, handler);
}

let mockTerminalValue: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
};
let mockFromFn: any; // vi.fn — needs `any` for .mock.calls access

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    from: (...args: unknown[]) => mockFromFn(...args),
  }),
}));

import {
  fetchMembers,
  addMember,
  updateMemberRole,
  removeMember,
  countAdmins,
  fetchInvitations,
  fetchMyInvitations,
  createInvitation,
  acceptInvitation,
  declineInvitation,
  deleteInvitation,
} from "@/lib/supabase/workspace-members";

describe("workspace-members CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalValue = { data: null, error: null };
    mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));
  });

  // =========================================================================
  // MEMBERS
  // =========================================================================

  describe("fetchMembers", () => {
    it("queries members for a workspace ordered by joined_at", async () => {
      const mockData = [
        { id: "m-1", workspace_id: "ws-1", user_id: "u-1", role: "admin" },
      ];
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchMembers("ws-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });

  describe("addMember", () => {
    it("inserts a new member and returns result", async () => {
      const memberData = {
        id: "m-new",
        workspace_id: "ws-1",
        user_id: "u-2",
        role: "reviewer",
      };
      mockTerminalValue = { data: memberData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await addMember({
        workspace_id: "ws-1",
        user_id: "u-2",
        role: "reviewer",
      });

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.data).toEqual(memberData);
    });
  });

  describe("updateMemberRole", () => {
    it("updates member role", async () => {
      const updatedMember = {
        id: "m-1",
        workspace_id: "ws-1",
        user_id: "u-1",
        role: "lead",
      };
      mockTerminalValue = { data: updatedMember, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await updateMemberRole("ws-1", "u-1", "lead");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.data).toEqual(updatedMember);
    });
  });

  describe("removeMember", () => {
    it("deletes member from workspace", async () => {
      mockTerminalValue = { data: null, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await removeMember("ws-1", "u-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.error).toBeNull();
    });
  });

  describe("countAdmins", () => {
    it("returns admin count for workspace", async () => {
      // countAdmins uses a special pattern with { count: "exact", head: true }
      // The mock needs to return count in the response
      const mockCount = 2;
      mockFromFn = vi.fn(() => {
        const handler: ProxyHandler<object> = {
          get(_target, prop: string) {
            if (prop === "then") return undefined;
            return (..._args: unknown[]) => {
              if (prop === "select") {
                // Return a chain that ends with eq() resolving to count
                return new Proxy(
                  {},
                  {
                    get(_t, p: string) {
                      if (p === "then") return undefined;
                      return () => {
                        if (p === "eq") {
                          return new Proxy(
                            {},
                            {
                              get(_t2, p2: string) {
                                if (p2 === "then") return undefined;
                                return () =>
                                  Promise.resolve({
                                    count: mockCount,
                                    data: null,
                                    error: null,
                                  });
                              },
                            },
                          );
                        }
                        return new Proxy({}, handler);
                      };
                    },
                  },
                );
              }
              return new Proxy({}, handler);
            };
          },
        };
        return new Proxy({}, handler);
      });

      const result = await countAdmins("ws-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.data).toBe(mockCount);
      expect(result.error).toBeNull();
    });
  });

  // =========================================================================
  // INVITATIONS
  // =========================================================================

  describe("fetchInvitations", () => {
    it("queries invitations for a workspace", async () => {
      const mockData = [
        {
          id: "inv-1",
          workspace_id: "ws-1",
          email: "test@example.com",
          role: "reviewer",
          status: "pending",
        },
      ];
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchInvitations("ws-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_invitations");
      expect(result.data).toEqual(mockData);
    });
  });

  describe("fetchMyInvitations", () => {
    it("queries pending invitations for an email with workspace name", async () => {
      const mockData = [
        {
          id: "inv-1",
          email: "me@example.com",
          status: "pending",
          workspaces: { name: "Team Alpha" },
        },
      ];
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchMyInvitations("me@example.com");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_invitations");
      expect(result.data).toEqual(mockData);
    });
  });

  describe("createInvitation", () => {
    it("creates a pending invitation", async () => {
      const invData = {
        id: "inv-new",
        workspace_id: "ws-1",
        email: "new@example.com",
        role: "reviewer",
        invited_by: "u-admin",
        status: "pending",
      };
      mockTerminalValue = { data: invData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await createInvitation({
        workspace_id: "ws-1",
        email: "new@example.com",
        role: "reviewer",
        invited_by: "u-admin",
      });

      expect(mockFromFn).toHaveBeenCalledWith("workspace_invitations");
      expect(result.data).toEqual(invData);
    });
  });

  describe("acceptInvitation", () => {
    it("fetches invitation, updates status, and adds user as member", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const invData = {
        id: "inv-1",
        workspace_id: "ws-1",
        email: "user@example.com",
        role: "reviewer",
        status: "pending",
        expires_at: futureDate.toISOString(),
      };
      const memberData = {
        id: "m-new",
        workspace_id: "ws-1",
        user_id: "u-1",
        role: "reviewer",
      };

      // First call: fetch invitation (single), second: update status, third: insert member (single)
      let callCount = 0;
      mockFromFn = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch invitation
          return createChainableMock({ data: invData, error: null });
        }
        if (callCount === 2) {
          // Update status
          return createChainableMock({ data: null, error: null });
        }
        // Insert member
        return createChainableMock({ data: memberData, error: null });
      });

      const result = await acceptInvitation("inv-1", "u-1");

      const fromCalls = mockFromFn.mock.calls.map((c: unknown[]) => c[0]);
      expect(fromCalls).toContain("workspace_invitations");
      expect(fromCalls).toContain("workspace_members");
      expect(result.data).toEqual(memberData);
      expect(result.error).toBeNull();
    });

    it("returns error for expired invitation", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invData = {
        id: "inv-1",
        workspace_id: "ws-1",
        email: "user@example.com",
        role: "reviewer",
        status: "pending",
        expires_at: pastDate.toISOString(),
      };

      mockTerminalValue = { data: invData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await acceptInvitation("inv-1", "u-1");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Invitation has expired");
    });
  });

  describe("declineInvitation", () => {
    it("updates invitation status to declined", async () => {
      mockTerminalValue = { data: null, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await declineInvitation("inv-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_invitations");
      expect(result.error).toBeNull();
    });
  });

  describe("deleteInvitation", () => {
    it("deletes invitation by id", async () => {
      mockTerminalValue = { data: null, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await deleteInvitation("inv-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_invitations");
      expect(result.error).toBeNull();
    });
  });
});
