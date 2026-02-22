import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Proxy-chain mock (same pattern as evidence.test.ts)
// ---------------------------------------------------------------------------

function createChain(response: { data: unknown; error: unknown }) {
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

let mockResponse: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

const mockFrom = vi.fn().mockImplementation(() => createChain(mockResponse));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  fetchScreeningDecisions,
  upsertScreeningDecision,
  batchInitScreeningDecisions,
  getScreeningCounts,
  deleteScreeningDecision,
} from "@/lib/supabase/screening";

const UUID_P = "550e8400-e29b-41d4-a716-446655440000";
const UUID_E = "660e8400-e29b-41d4-a716-446655440001";

describe("screening CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchScreeningDecisions
  // -----------------------------------------------------------------------
  describe("fetchScreeningDecisions", () => {
    it("returns decisions from supabase", async () => {
      const items = [
        { id: "d-1", stage: "identification", decision: "pending" },
      ];
      mockResponse = { data: items, error: null };

      const result = await fetchScreeningDecisions(UUID_P);

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
      expect(result.data).toEqual(items);
      expect(result.error).toBeNull();
    });

    it("returns decisions filtered by stage when provided", async () => {
      mockResponse = { data: [], error: null };

      await fetchScreeningDecisions(UUID_P, "screening");

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
    });

    it("returns normalized error on failure", async () => {
      mockResponse = { data: null, error: { message: "Network error" } };

      const result = await fetchScreeningDecisions(UUID_P);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Network error" });
    });

    it("returns empty array when no decisions exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchScreeningDecisions(UUID_P);

      expect(result.data).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // upsertScreeningDecision
  // -----------------------------------------------------------------------
  describe("upsertScreeningDecision", () => {
    it("upserts a screening decision and returns it", async () => {
      const decision = {
        id: "d-1",
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification" as const,
        decision: "include",
      };
      mockResponse = { data: decision, error: null };

      const result = await upsertScreeningDecision({
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification",
        decision: "include",
      });

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
      expect(result.data).toEqual(decision);
      expect(result.error).toBeNull();
    });

    it("returns error on upsert failure", async () => {
      mockResponse = { data: null, error: { message: "Constraint violation" } };

      const result = await upsertScreeningDecision({
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification",
        decision: "include",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Constraint violation" });
    });

    it("handles pending decision with optional fields", async () => {
      const decision = {
        id: "d-2",
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "screening",
        decision: "pending",
      };
      mockResponse = { data: decision, error: null };

      const result = await upsertScreeningDecision({
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "screening",
        decision: "pending",
        exclusion_reason: null,
        notes: "Needs further review",
      });

      expect(result.data).toEqual(decision);
    });
  });

  // -----------------------------------------------------------------------
  // batchInitScreeningDecisions
  // -----------------------------------------------------------------------
  describe("batchInitScreeningDecisions", () => {
    it("batch-initializes decisions for multiple evidence IDs", async () => {
      const decisions = [
        { id: "d-1", decision: "pending" },
        { id: "d-2", decision: "pending" },
      ];
      mockResponse = { data: decisions, error: null };

      const result = await batchInitScreeningDecisions(UUID_P, [
        UUID_E,
        "770e8400-e29b-41d4-a716-446655440002",
      ]);

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
      expect(result.data).toEqual(decisions);
    });

    it("defaults stage to identification", async () => {
      mockResponse = { data: [], error: null };

      await batchInitScreeningDecisions(UUID_P, [UUID_E]);

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
    });

    it("accepts explicit stage parameter", async () => {
      mockResponse = { data: [], error: null };

      await batchInitScreeningDecisions(UUID_P, [UUID_E], "eligibility");

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
    });

    it("returns error on batch failure", async () => {
      mockResponse = { data: null, error: { message: "Batch insert failed" } };

      const result = await batchInitScreeningDecisions(UUID_P, [UUID_E]);

      expect(result.error).toEqual({ message: "Batch insert failed" });
    });
  });

  // -----------------------------------------------------------------------
  // getScreeningCounts
  // -----------------------------------------------------------------------
  describe("getScreeningCounts", () => {
    it("computes stage counts from raw decision rows", async () => {
      mockResponse = {
        data: [
          { stage: "identification", decision: "pending" },
          { stage: "identification", decision: "include" },
          { stage: "identification", decision: "duplicate" },
          { stage: "screening", decision: "pending" },
          { stage: "screening", decision: "exclude" },
          { stage: "eligibility", decision: "include" },
        ],
        error: null,
      };

      const result = await getScreeningCounts(UUID_P);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        identification: {
          total: 3,
          pending: 1,
          include: 1,
          exclude: 0,
          duplicate: 1,
        },
        screening: {
          total: 2,
          pending: 1,
          include: 0,
          exclude: 1,
          duplicate: 0,
        },
        eligibility: {
          total: 1,
          pending: 0,
          include: 1,
          exclude: 0,
          duplicate: 0,
        },
        included: {
          total: 0,
          pending: 0,
          include: 0,
          exclude: 0,
          duplicate: 0,
        },
      });
    });

    it("returns all-zero counts when no decisions exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await getScreeningCounts(UUID_P);

      expect(result.error).toBeNull();
      expect(result.data?.identification.total).toBe(0);
      expect(result.data?.screening.total).toBe(0);
    });

    it("handles null data gracefully", async () => {
      mockResponse = { data: null, error: null };

      const result = await getScreeningCounts(UUID_P);

      expect(result.error).toBeNull();
      // null data is treated as empty array
      expect(result.data?.identification.total).toBe(0);
    });

    it("returns error on query failure", async () => {
      mockResponse = { data: null, error: { message: "DB error" } };

      const result = await getScreeningCounts(UUID_P);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "DB error" });
    });
  });

  // -----------------------------------------------------------------------
  // deleteScreeningDecision
  // -----------------------------------------------------------------------
  describe("deleteScreeningDecision", () => {
    it("deletes a decision by ID", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteScreeningDecision("d-1");

      expect(mockFrom).toHaveBeenCalledWith("screening_decisions");
      expect(result.error).toBeNull();
    });

    it("returns error on delete failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Foreign key violation" },
      };

      const result = await deleteScreeningDecision("d-1");

      expect(result.error).toEqual({ message: "Foreign key violation" });
    });
  });
});
