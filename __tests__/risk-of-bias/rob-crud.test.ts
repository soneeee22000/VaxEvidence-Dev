import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Proxy-chain mock
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
  fetchRobAssessments,
  fetchRobAssessmentById,
  upsertRobAssessment,
  deleteRobAssessment,
} from "@/lib/supabase/risk-of-bias";

const UUID_P = "550e8400-e29b-41d4-a716-446655440000";
const UUID_E = "660e8400-e29b-41d4-a716-446655440001";

describe("risk-of-bias CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchRobAssessments
  // -----------------------------------------------------------------------
  describe("fetchRobAssessments", () => {
    it("returns all assessments for a protocol", async () => {
      const assessments = [
        { id: "rob-1", tool: "rob2", overall_judgment: "low" },
      ];
      mockResponse = { data: assessments, error: null };

      const result = await fetchRobAssessments(UUID_P);

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
      expect(result.data).toEqual(assessments);
      expect(result.error).toBeNull();
    });

    it("filters by tool when provided", async () => {
      mockResponse = { data: [], error: null };

      await fetchRobAssessments(UUID_P, "robins_i");

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
    });

    it("returns normalized error on failure", async () => {
      mockResponse = { data: null, error: { message: "Connection lost" } };

      const result = await fetchRobAssessments(UUID_P);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Connection lost" });
    });

    it("returns empty array when no assessments exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchRobAssessments(UUID_P);

      expect(result.data).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // fetchRobAssessmentById
  // -----------------------------------------------------------------------
  describe("fetchRobAssessmentById", () => {
    it("returns single assessment by ID", async () => {
      const assessment = {
        id: "rob-1",
        tool: "rob2",
        overall_judgment: "low",
      };
      mockResponse = { data: assessment, error: null };

      const result = await fetchRobAssessmentById("rob-1");

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
      expect(result.data).toEqual(assessment);
    });

    it("returns error when not found", async () => {
      mockResponse = {
        data: null,
        error: { message: "Row not found (0 rows)" },
      };

      const result = await fetchRobAssessmentById("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // upsertRobAssessment
  // -----------------------------------------------------------------------
  describe("upsertRobAssessment", () => {
    const payload = {
      protocol_id: UUID_P,
      evidence_id: UUID_E,
      tool: "rob2" as const,
      domains: {
        "Randomization process": { judgment: "low" },
        "Missing outcome data": { judgment: "high", justification: "20% lost" },
      },
      overall_judgment: "high",
    };

    it("upserts an assessment and returns it", async () => {
      const assessment = { id: "rob-1", ...payload };
      mockResponse = { data: assessment, error: null };

      const result = await upsertRobAssessment(payload);

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
      expect(result.data).toEqual(assessment);
      expect(result.error).toBeNull();
    });

    it("returns error on upsert failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Invalid domain JSON" },
      };

      const result = await upsertRobAssessment(payload);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Invalid domain JSON" });
    });

    it("includes assessed_by when provided", async () => {
      mockResponse = { data: { id: "rob-1" }, error: null };

      await upsertRobAssessment({
        ...payload,
        assessed_by: "user-123",
      });

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
    });
  });

  // -----------------------------------------------------------------------
  // deleteRobAssessment
  // -----------------------------------------------------------------------
  describe("deleteRobAssessment", () => {
    it("deletes an assessment by ID", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteRobAssessment("rob-1");

      expect(mockFrom).toHaveBeenCalledWith("risk_of_bias_assessments");
      expect(result.error).toBeNull();
    });

    it("returns error on delete failure", async () => {
      mockResponse = { data: null, error: { message: "RLS policy denied" } };

      const result = await deleteRobAssessment("rob-1");

      expect(result.error).toEqual({ message: "RLS policy denied" });
    });
  });
});
