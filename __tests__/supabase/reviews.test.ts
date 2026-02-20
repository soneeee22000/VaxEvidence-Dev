import { describe, it, expect, vi, beforeEach } from "vitest";

function createChain(response: {
  data: unknown;
  error: unknown;
  count?: number | null;
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

let mockResponse: { data: unknown; error: unknown; count?: number | null } = {
  data: null,
  error: null,
};

const mockFrom = vi.fn().mockImplementation(() => createChain(mockResponse));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  fetchReviews,
  requestReview,
  submitReviewDecision,
  cancelReview,
  fetchPendingReviewCount,
} from "@/lib/supabase/reviews";

describe("reviews CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  describe("fetchPendingReviewCount", () => {
    it("returns count of pending reviews for user", async () => {
      mockResponse = { data: null, error: null, count: 3 };

      const result = await fetchPendingReviewCount("user-1");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(result.data).toBe(3);
    });

    it("returns 0 when no pending reviews", async () => {
      mockResponse = { data: null, error: null, count: 0 };

      const result = await fetchPendingReviewCount("user-1");

      expect(result.data).toBe(0);
    });
  });

  describe("fetchReviews", () => {
    it("returns reviews transformed with toWithDetails", async () => {
      // Raw rows as returned from Supabase (flat structure)
      const rawRows = [
        {
          id: "r1",
          protocol_id: "p1",
          reviewer_id: "rev-1",
          requester_id: "req-1",
          reviewer_email: "reviewer@test.com",
          requester_email: "requester@test.com",
          protocol_title: "My Protocol",
          protocol_status: "draft",
          status: "pending",
        },
      ];
      mockResponse = { data: rawRows, error: null };

      const result = await fetchReviews("p1");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].reviewer.email).toBe("reviewer@test.com");
      expect(result.data![0].requester.email).toBe("requester@test.com");
      expect(result.data![0].protocol.title).toBe("My Protocol");
    });

    it("uses fallback values when emails/titles are missing", async () => {
      const rawRows = [{ id: "r1", status: "pending" }];
      mockResponse = { data: rawRows, error: null };

      const result = await fetchReviews("p1");

      expect(result.data![0].reviewer.email).toBe("Unknown user");
      expect(result.data![0].protocol.title).toBe("Protocol");
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "DB error" } };

      const result = await fetchReviews("p1");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "DB error" });
    });
  });

  describe("requestReview", () => {
    it("creates review and transforms with toWithDetails", async () => {
      const rawRow = {
        id: "r-new",
        protocol_id: "p1",
        reviewer_id: "rev-1",
        requester_id: "req-1",
        reviewer_email: "reviewer@test.com",
        requester_email: "requester@test.com",
        status: "pending",
      };
      mockResponse = { data: rawRow, error: null };

      const result = await requestReview({
        protocol_id: "p1",
        reviewer_id: "rev-1",
        requester_id: "req-1",
        reviewer_email: "reviewer@test.com",
        requester_email: "requester@test.com",
      });

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(result.data!.id).toBe("r-new");
      expect(result.data!.reviewer.email).toBe("reviewer@test.com");
      expect(result.data!.requester.email).toBe("requester@test.com");
    });
  });

  describe("submitReviewDecision", () => {
    it("updates review and transforms with toWithDetails", async () => {
      const rawRow = {
        id: "r1",
        protocol_id: "p1",
        reviewer_id: "rev-1",
        requester_id: "req-1",
        reviewer_email: "reviewer@test.com",
        requester_email: "requester@test.com",
        status: "approved",
        decision: "Well structured protocol",
      };
      mockResponse = { data: rawRow, error: null };

      const result = await submitReviewDecision("r1", {
        status: "approved",
        decision: "The protocol meets all requirements and is well structured.",
      });

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(result.data!.status).toBe("approved");
      expect(result.data!.reviewer.email).toBe("reviewer@test.com");
    });
  });

  describe("cancelReview", () => {
    it("deletes a review by id", async () => {
      mockResponse = { data: null, error: null };

      const result = await cancelReview("r1");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(result.error).toBeNull();
    });
  });
});
