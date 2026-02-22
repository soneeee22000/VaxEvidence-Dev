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

let mockResponse: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

const mockFrom = vi.fn().mockImplementation(() => createChain(mockResponse));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  fetchGCPCompliance,
  upsertGCPCompliance,
  deleteGCPCompliance,
} from "@/lib/supabase/gcp-compliance";

const PROTOCOL_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("gcp-compliance CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchGCPCompliance
  // -----------------------------------------------------------------------
  describe("fetchGCPCompliance", () => {
    it("returns compliance data for a protocol", async () => {
      const compliance = {
        id: "gcp-1",
        protocol_id: PROTOCOL_ID,
        principles: [],
        protocol_sections: [],
        essential_documents: [],
        compliance_score: 85,
      };
      mockResponse = { data: compliance, error: null };

      const result = await fetchGCPCompliance(PROTOCOL_ID);

      expect(mockFrom).toHaveBeenCalledWith("gcp_compliance");
      expect(result.data).toEqual(compliance);
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await fetchGCPCompliance(PROTOCOL_ID);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Not found" });
    });
  });

  // -----------------------------------------------------------------------
  // upsertGCPCompliance
  // -----------------------------------------------------------------------
  describe("upsertGCPCompliance", () => {
    const payload = {
      protocol_id: PROTOCOL_ID,
      principles: [
        { principle_number: 1, status: "compliant", notes: "Verified" },
      ],
      protocol_sections: [{ section_number: "6.1", status: "compliant" }],
      essential_documents: [{ document_id: "doc-1", status: "available" }],
      compliance_score: 90,
    };

    it("upserts and returns compliance data", async () => {
      const created = { id: "gcp-1", ...payload };
      mockResponse = { data: created, error: null };

      const result = await upsertGCPCompliance(payload);

      expect(mockFrom).toHaveBeenCalledWith("gcp_compliance");
      expect(result.data).toEqual(created);
      expect(result.error).toBeNull();
    });

    it("returns error on upsert failure", async () => {
      mockResponse = { data: null, error: { message: "Constraint violation" } };

      const result = await upsertGCPCompliance(payload);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Constraint violation" });
    });
  });

  // -----------------------------------------------------------------------
  // deleteGCPCompliance
  // -----------------------------------------------------------------------
  describe("deleteGCPCompliance", () => {
    it("deletes compliance data by ID", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteGCPCompliance("gcp-1");

      expect(mockFrom).toHaveBeenCalledWith("gcp_compliance");
      expect(result.error).toBeNull();
    });

    it("returns error on delete failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await deleteGCPCompliance("gcp-1");

      expect(result.error).toEqual({ message: "Not found" });
    });
  });
});
