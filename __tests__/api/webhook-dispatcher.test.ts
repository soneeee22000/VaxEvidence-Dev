import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

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

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  signPayload,
  generateWebhookSecret,
  dispatchEvent,
  deliverWebhook,
  retryPendingDeliveries,
} from "@/lib/api/webhook-dispatcher";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(resolveValue));
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.then = (resolve: (val: unknown) => void) => resolve(resolveValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("webhook-dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // signPayload
  // =========================================================================

  describe("signPayload", () => {
    it("generates a valid HMAC-SHA256 hex signature", () => {
      const payload = '{"event":"protocol.created","data":{}}';
      const secret = "whsec_test123";

      const result = signPayload(payload, secret);

      const expected = createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      expect(result).toBe(expected);
    });

    it("produces different signatures for different secrets", () => {
      const payload = '{"event":"test"}';

      const sig1 = signPayload(payload, "secret-a");
      const sig2 = signPayload(payload, "secret-b");

      expect(sig1).not.toBe(sig2);
    });

    it("produces different signatures for different payloads", () => {
      const secret = "shared-secret";

      const sig1 = signPayload("payload-a", secret);
      const sig2 = signPayload("payload-b", secret);

      expect(sig1).not.toBe(sig2);
    });

    it("returns a 64-character hex string (SHA-256)", () => {
      const result = signPayload("test", "secret");

      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // =========================================================================
  // generateWebhookSecret
  // =========================================================================

  describe("generateWebhookSecret", () => {
    it("returns a string starting with 'whsec_'", () => {
      const secret = generateWebhookSecret();

      expect(secret.startsWith("whsec_")).toBe(true);
    });

    it("returns a string with 48 hex characters after prefix (24 bytes)", () => {
      const secret = generateWebhookSecret();

      // "whsec_" (6 chars) + 48 hex chars = 54 total
      expect(secret).toHaveLength(6 + 48);
      expect(secret.slice(6)).toMatch(/^[a-f0-9]{48}$/);
    });

    it("generates unique secrets on each call", () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();

      expect(secret1).not.toBe(secret2);
    });
  });

  // =========================================================================
  // dispatchEvent
  // =========================================================================

  describe("dispatchEvent", () => {
    it("returns early when no webhooks are found", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: null, error: { message: "Not found" } }),
      );

      await dispatchEvent("ws-1", "protocol.created", { id: "p-1" });

      expect(mockSupabaseFrom).toHaveBeenCalledWith("webhooks");
      // Should not try to create deliveries
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);
    });

    it("returns early when webhooks list is empty", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: [], error: null }),
      );

      await dispatchEvent("ws-1", "protocol.created", { id: "p-1" });

      expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);
    });

    it("skips webhooks that do not subscribe to the event", async () => {
      const webhooks = [
        {
          id: "wh-1",
          url: "https://example.com/hook",
          secret: "whsec_abc",
          events: ["evidence.created"],
        },
      ];
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: webhooks, error: null }),
      );

      await dispatchEvent("ws-1", "protocol.created", { id: "p-1" });

      // Only the initial webhooks query, no delivery inserts
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);
    });

    it("creates delivery records for matching webhooks", async () => {
      const webhooks = [
        {
          id: "wh-1",
          url: "https://example.com/hook",
          secret: "whsec_abc",
          events: ["protocol.created"],
        },
      ];

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch webhooks
          return createMockChain({ data: webhooks, error: null });
        }
        // Insert delivery
        const deliveryChain = createMockChain({
          data: { id: "del-1" },
          error: null,
        });
        deliveryChain.single = vi.fn(() =>
          Promise.resolve({ data: { id: "del-1" }, error: null }),
        );
        return deliveryChain;
      });

      // Mock deliverWebhook's fetch chain to prevent unhandled promises
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      await dispatchEvent("ws-1", "protocol.created", { id: "p-1" });

      // First call: webhooks, second call: webhook_deliveries insert
      expect(mockSupabaseFrom).toHaveBeenCalledWith("webhooks");
      expect(mockSupabaseFrom).toHaveBeenCalledWith("webhook_deliveries");
    });

    it("continues to next webhook when delivery record creation fails", async () => {
      const webhooks = [
        {
          id: "wh-1",
          url: "https://a.com/hook",
          secret: "s1",
          events: ["protocol.created"],
        },
        {
          id: "wh-2",
          url: "https://b.com/hook",
          secret: "s2",
          events: ["protocol.created"],
        },
      ];

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createMockChain({ data: webhooks, error: null });
        }
        if (callCount === 2) {
          // First delivery insert fails
          const chain = createMockChain({
            data: null,
            error: { message: "Insert failed" },
          });
          chain.single = vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Insert failed" },
            }),
          );
          return chain;
        }
        // Second delivery insert succeeds
        const chain = createMockChain({
          data: { id: "del-2" },
          error: null,
        });
        chain.single = vi.fn(() =>
          Promise.resolve({ data: { id: "del-2" }, error: null }),
        );
        return chain;
      });

      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      await dispatchEvent("ws-1", "protocol.created", { id: "p-1" });

      // Allow fire-and-forget deliverWebhook to settle
      await new Promise((r) => setTimeout(r, 50));

      // Calls: (1) webhooks, (2) delivery insert #1 (fails), (3) delivery insert #2 (succeeds),
      // (4+) deliverWebhook("del-2") fire-and-forget calls from() internally
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(4);
    });
  });

  // =========================================================================
  // deliverWebhook
  // =========================================================================

  describe("deliverWebhook", () => {
    it("returns false when delivery record is not found", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: null, error: { message: "Not found" } }),
      );

      const result = await deliverWebhook("del-missing");

      expect(result).toBe(false);
    });

    it("returns false when webhook relation is missing", async () => {
      const chain = createMockChain({
        data: {
          id: "del-1",
          payload: { event: "test" },
          event_type: "protocol.created",
          attempts: 0,
          webhooks: null,
        },
        error: null,
      });
      chain.single = vi.fn(() =>
        Promise.resolve({
          data: {
            id: "del-1",
            payload: { event: "test" },
            event_type: "protocol.created",
            attempts: 0,
            webhooks: null,
          },
          error: null,
        }),
      );
      mockSupabaseFrom.mockReturnValue(chain);

      const result = await deliverWebhook("del-1");

      expect(result).toBe(false);
    });

    it("sends POST with correct headers on successful delivery", async () => {
      const deliveryData = {
        id: "del-1",
        payload: { event: "protocol.created", data: { id: "p-1" } },
        event_type: "protocol.created",
        attempts: 0,
        max_attempts: 5,
        webhooks: {
          url: "https://example.com/hook",
          secret: "whsec_testsecret",
        },
      };

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch delivery
          const chain = createMockChain({ data: deliveryData, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: deliveryData, error: null }),
          );
          return chain;
        }
        // Update delivery status
        return createMockChain({ data: null, error: null });
      });

      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const result = await deliverWebhook("del-1");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://example.com/hook");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["X-VaxEvidence-Event"]).toBe("protocol.created");
      expect(options.headers["X-VaxEvidence-Delivery"]).toBe("del-1");
      expect(options.headers["X-VaxEvidence-Signature"]).toBeDefined();

      // Verify signature correctness
      const payloadStr = JSON.stringify(deliveryData.payload);
      const expectedSig = signPayload(payloadStr, "whsec_testsecret");
      expect(options.headers["X-VaxEvidence-Signature"]).toBe(expectedSig);
    });

    it("marks delivery as failed after max attempts on non-2xx response", async () => {
      const deliveryData = {
        id: "del-1",
        payload: { event: "test" },
        event_type: "protocol.created",
        attempts: 4, // This will become attempt 5 (>= max_attempts)
        max_attempts: 5,
        webhooks: {
          url: "https://example.com/hook",
          secret: "whsec_abc",
        },
      };

      let callCount = 0;
      const updateChain = createMockChain({ data: null, error: null });
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const chain = createMockChain({ data: deliveryData, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: deliveryData, error: null }),
          );
          return chain;
        }
        return updateChain;
      });

      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await deliverWebhook("del-1");

      expect(result).toBe(false);
      // Verify the update was called to set status to "failed"
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          attempts: 5,
          last_response_code: 500,
        }),
      );
    });

    it("marks delivery as pending with retry on non-2xx within max attempts", async () => {
      const deliveryData = {
        id: "del-1",
        payload: { event: "test" },
        event_type: "protocol.created",
        attempts: 1,
        max_attempts: 5,
        webhooks: {
          url: "https://example.com/hook",
          secret: "whsec_abc",
        },
      };

      let callCount = 0;
      const updateChain = createMockChain({ data: null, error: null });
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const chain = createMockChain({ data: deliveryData, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: deliveryData, error: null }),
          );
          return chain;
        }
        return updateChain;
      });

      mockFetch.mockResolvedValue({ ok: false, status: 503 });

      const result = await deliverWebhook("del-1");

      expect(result).toBe(false);
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
          attempts: 2,
          last_response_code: 503,
          next_retry_at: expect.any(String),
        }),
      );
    });

    it("handles network errors by marking for retry", async () => {
      const deliveryData = {
        id: "del-1",
        payload: { event: "test" },
        event_type: "protocol.created",
        attempts: 0,
        max_attempts: 5,
        webhooks: {
          url: "https://example.com/hook",
          secret: "whsec_abc",
        },
      };

      let callCount = 0;
      const updateChain = createMockChain({ data: null, error: null });
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const chain = createMockChain({ data: deliveryData, error: null });
          chain.single = vi.fn(() =>
            Promise.resolve({ data: deliveryData, error: null }),
          );
          return chain;
        }
        return updateChain;
      });

      mockFetch.mockRejectedValue(new Error("Network timeout"));

      const result = await deliverWebhook("del-1");

      expect(result).toBe(false);
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
          attempts: 1,
          next_retry_at: expect.any(String),
        }),
      );
    });
  });

  // =========================================================================
  // retryPendingDeliveries
  // =========================================================================

  describe("retryPendingDeliveries", () => {
    it("returns zero counts when no pending deliveries exist", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: [], error: null }),
      );

      const result = await retryPendingDeliveries();

      expect(result).toEqual({ attempted: 0, delivered: 0 });
    });

    it("returns zero counts when query fails", async () => {
      mockSupabaseFrom.mockReturnValue(
        createMockChain({ data: null, error: { message: "DB error" } }),
      );

      const result = await retryPendingDeliveries();

      expect(result).toEqual({ attempted: 0, delivered: 0 });
    });

    it("queries pending deliveries with correct filters", async () => {
      const pendingChain = createMockChain({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(pendingChain);

      await retryPendingDeliveries();

      expect(mockSupabaseFrom).toHaveBeenCalledWith("webhook_deliveries");
      expect(pendingChain.select).toHaveBeenCalledWith("id");
      expect(pendingChain.in).toHaveBeenCalledWith("status", [
        "pending",
        "failed",
      ]);
    });
  });
});
