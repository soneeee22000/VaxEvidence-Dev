import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Proxy-chain mock
// ---------------------------------------------------------------------------

function createChain(response: {
  data: unknown;
  error: unknown;
  count?: number;
}) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === "then") {
        return (resolve: (val: unknown) => void) => resolve(response);
      }
      return vi.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

let mockResponse: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
};

const mockFrom = vi.fn().mockImplementation(() => createChain(mockResponse));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from "@/lib/supabase/notifications";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("notifications CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchNotifications
  // -----------------------------------------------------------------------
  describe("fetchNotifications", () => {
    it("returns notifications for a user", async () => {
      const notifications = [
        { id: "n-1", type: "mention", title: "You were mentioned" },
        { id: "n-2", type: "comment", title: "New comment" },
      ];
      mockResponse = { data: notifications, error: null };

      const result = await fetchNotifications(USER_ID);

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(result.data).toEqual(notifications);
      expect(result.error).toBeNull();
    });

    it("returns empty array when no notifications exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchNotifications(USER_ID);

      expect(result.data).toEqual([]);
    });

    it("returns normalized error on failure", async () => {
      mockResponse = { data: null, error: { message: "Query failed" } };

      const result = await fetchNotifications(USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Query failed" });
    });
  });

  // -----------------------------------------------------------------------
  // fetchUnreadCount
  // -----------------------------------------------------------------------
  describe("fetchUnreadCount", () => {
    it("returns unread count on success", async () => {
      mockResponse = { data: null, error: null, count: 5 };

      const result = await fetchUnreadCount(USER_ID);

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(result.data).toBe(5);
      expect(result.error).toBeNull();
    });

    it("returns 0 when count is null", async () => {
      mockResponse = { data: null, error: null, count: undefined };

      const result = await fetchUnreadCount(USER_ID);

      expect(result.data).toBe(0);
    });

    it("returns error on failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Count failed" },
        count: undefined,
      };

      const result = await fetchUnreadCount(USER_ID);

      expect(result.error).toEqual({ message: "Count failed" });
    });
  });

  // -----------------------------------------------------------------------
  // markAsRead
  // -----------------------------------------------------------------------
  describe("markAsRead", () => {
    it("marks a notification as read and returns it", async () => {
      const notification = { id: "n-1", is_read: true };
      mockResponse = { data: notification, error: null };

      const result = await markAsRead("n-1");

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(result.data).toEqual(notification);
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await markAsRead("n-1");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Not found" });
    });
  });

  // -----------------------------------------------------------------------
  // markAllAsRead
  // -----------------------------------------------------------------------
  describe("markAllAsRead", () => {
    it("marks all unread notifications as read", async () => {
      mockResponse = { data: null, error: null };

      const result = await markAllAsRead(USER_ID);

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "Update failed" } };

      const result = await markAllAsRead(USER_ID);

      expect(result.error).toEqual({ message: "Update failed" });
    });
  });

  // -----------------------------------------------------------------------
  // createNotification
  // -----------------------------------------------------------------------
  describe("createNotification", () => {
    const payload = {
      user_id: USER_ID,
      type: "mention" as const,
      title: "You were mentioned in a comment",
      body: "@user mentioned you",
      resource_type: "comment" as const,
      resource_id: "660e8400-e29b-41d4-a716-446655440001",
    };

    it("creates a notification and returns it", async () => {
      const created = { id: "n-1", ...payload, is_read: false };
      mockResponse = { data: created, error: null };

      const result = await createNotification(payload);

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(result.data).toEqual(created);
      expect(result.error).toBeNull();
    });

    it("returns error on insert failure", async () => {
      mockResponse = { data: null, error: { message: "Insert failed" } };

      const result = await createNotification(payload);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Insert failed" });
    });
  });
});
