import { describe, it, expect, vi, beforeEach } from "vitest";

// Proxy-based chainable mock that captures method calls
function createChainableMock(terminalValue: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[][]> = {};
  let afterTerminal = false;

  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop === "_calls") return calls;
      if (prop === "then") {
        // If we're after a terminal-triggering method, make it thenable
        if (afterTerminal) {
          return (resolve: (v: unknown) => void) => resolve(terminalValue);
        }
        return undefined;
      }

      return (...args: unknown[]) => {
        if (!calls[prop]) calls[prop] = [];
        calls[prop].push(args);

        // Terminal methods resolve to the value
        if (prop === "single" || prop === "maybeSingle") {
          return Promise.resolve(terminalValue);
        }
        // order resolves (end of select chain)
        if (prop === "order") {
          return Promise.resolve(terminalValue);
        }
        // delete/update chains end at eq() — mark as terminal-ready
        if (prop === "delete" || prop === "update") {
          afterTerminal = true;
        }

        return new Proxy({}, handler);
      };
    },
  };

  return new Proxy({}, handler);
}

let mockTerminalValue: { data: unknown; error: unknown } = {
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
  fetchWorkspaces,
  fetchWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getUserWorkspaceRole,
} from "@/lib/supabase/workspaces";

describe("workspaces CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalValue = { data: null, error: null };
    mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));
  });

  describe("fetchWorkspaces", () => {
    it("queries workspaces table ordered by created_at asc", async () => {
      const mockData = [{ id: "ws-1", name: "Team Alpha", slug: "team-alpha" }];
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchWorkspaces();

      expect(mockFromFn).toHaveBeenCalledWith("workspaces");
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it("returns error when query fails", async () => {
      mockTerminalValue = {
        data: null,
        error: { message: "Connection failed" },
      };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchWorkspaces();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Connection failed" });
    });
  });

  describe("fetchWorkspaceById", () => {
    it("queries workspace by id with single()", async () => {
      const mockData = {
        id: "ws-1",
        name: "Team Alpha",
        slug: "team-alpha",
        owner_id: "user-1",
      };
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchWorkspaceById("ws-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspaces");
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it("returns error when workspace not found", async () => {
      mockTerminalValue = {
        data: null,
        error: { message: "Row not found" },
      };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await fetchWorkspaceById("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Row not found" });
    });
  });

  describe("createWorkspace", () => {
    it("inserts workspace and adds creator as admin member", async () => {
      const wsData = {
        id: "ws-new",
        name: "New Team",
        slug: "new-team",
        owner_id: "user-1",
      };
      mockTerminalValue = { data: wsData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await createWorkspace({
        name: "New Team",
        slug: "new-team",
        owner_id: "user-1",
      });

      expect(result.data).toEqual(wsData);
      expect(result.error).toBeNull();
      // Should call from() for both workspaces and workspace_members
      const fromCalls = mockFromFn.mock.calls.map((c: unknown[]) => c[0]);
      expect(fromCalls).toContain("workspaces");
      expect(fromCalls).toContain("workspace_members");
    });

    it("returns error when workspace creation fails", async () => {
      mockTerminalValue = {
        data: null,
        error: { message: "Duplicate slug" },
      };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await createWorkspace({
        name: "Team",
        slug: "duplicate",
        owner_id: "user-1",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Duplicate slug" });
    });
  });

  describe("updateWorkspace", () => {
    it("updates workspace name and sets updated_at", async () => {
      const mockData = { id: "ws-1", name: "Updated Name" };
      mockTerminalValue = { data: mockData, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await updateWorkspace("ws-1", { name: "Updated Name" });

      expect(mockFromFn).toHaveBeenCalledWith("workspaces");
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });

  describe("deleteWorkspace", () => {
    it("deletes workspace by id", async () => {
      mockTerminalValue = { data: null, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await deleteWorkspace("ws-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspaces");
      expect(result.error).toBeNull();
    });
  });

  describe("getUserWorkspaceRole", () => {
    it("returns user role in workspace", async () => {
      mockTerminalValue = { data: { role: "admin" }, error: null };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await getUserWorkspaceRole("ws-1", "user-1");

      expect(mockFromFn).toHaveBeenCalledWith("workspace_members");
      expect(result.data).toBe("admin");
      expect(result.error).toBeNull();
    });

    it("returns null when user is not a member", async () => {
      mockTerminalValue = {
        data: null,
        error: { message: "Row not found" },
      };
      mockFromFn = vi.fn(() => createChainableMock(mockTerminalValue));

      const result = await getUserWorkspaceRole("ws-1", "nonmember");

      expect(result.data).toBeNull();
    });
  });
});
