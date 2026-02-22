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
  fetchMetaAnalysisEntries,
  createMetaAnalysisEntry,
  updateMetaAnalysisEntry,
  deleteMetaAnalysisEntry,
} from "@/lib/supabase/meta-analysis";

const UUID_P = "550e8400-e29b-41d4-a716-446655440000";
const UUID_E = "660e8400-e29b-41d4-a716-446655440001";

describe("meta-analysis CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchMetaAnalysisEntries
  // -----------------------------------------------------------------------
  describe("fetchMetaAnalysisEntries", () => {
    it("returns entries for a protocol", async () => {
      const entries = [
        { id: "m-1", study_label: "Study A", effect_size: 0.85 },
      ];
      mockResponse = { data: entries, error: null };

      const result = await fetchMetaAnalysisEntries(UUID_P);

      expect(mockFrom).toHaveBeenCalledWith("meta_analysis_entries");
      expect(result.data).toEqual(entries);
      expect(result.error).toBeNull();
    });

    it("returns empty array when no entries exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchMetaAnalysisEntries(UUID_P);

      expect(result.data).toEqual([]);
    });

    it("returns normalized error on failure", async () => {
      mockResponse = { data: null, error: { message: "Timeout" } };

      const result = await fetchMetaAnalysisEntries(UUID_P);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Timeout" });
    });
  });

  // -----------------------------------------------------------------------
  // createMetaAnalysisEntry
  // -----------------------------------------------------------------------
  describe("createMetaAnalysisEntry", () => {
    const payload = {
      protocol_id: UUID_P,
      evidence_id: UUID_E,
      study_label: "Smith 2024",
      effect_size: 0.85,
      ci_lower: 0.72,
      ci_upper: 0.95,
      weight: 12.5,
      subgroup: "Adults",
    };

    it("creates an entry and returns it", async () => {
      const created = { id: "m-1", ...payload };
      mockResponse = { data: created, error: null };

      const result = await createMetaAnalysisEntry(payload);

      expect(mockFrom).toHaveBeenCalledWith("meta_analysis_entries");
      expect(result.data).toEqual(created);
      expect(result.error).toBeNull();
    });

    it("returns error on insert failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Duplicate study_label" },
      };

      const result = await createMetaAnalysisEntry(payload);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Duplicate study_label" });
    });
  });

  // -----------------------------------------------------------------------
  // updateMetaAnalysisEntry
  // -----------------------------------------------------------------------
  describe("updateMetaAnalysisEntry", () => {
    it("updates an entry and returns it", async () => {
      const updated = { id: "m-1", study_label: "Updated Label" };
      mockResponse = { data: updated, error: null };

      const result = await updateMetaAnalysisEntry("m-1", {
        study_label: "Updated Label",
      });

      expect(mockFrom).toHaveBeenCalledWith("meta_analysis_entries");
      expect(result.data).toEqual(updated);
    });

    it("returns error on update failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await updateMetaAnalysisEntry("m-1", {
        effect_size: 1.0,
      });

      expect(result.error).toEqual({ message: "Not found" });
    });
  });

  // -----------------------------------------------------------------------
  // deleteMetaAnalysisEntry
  // -----------------------------------------------------------------------
  describe("deleteMetaAnalysisEntry", () => {
    it("deletes an entry by ID", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteMetaAnalysisEntry("m-1");

      expect(mockFrom).toHaveBeenCalledWith("meta_analysis_entries");
      expect(result.error).toBeNull();
    });

    it("returns error on delete failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Entry does not exist" },
      };

      const result = await deleteMetaAnalysisEntry("m-1");

      expect(result.error).toEqual({ message: "Entry does not exist" });
    });
  });
});
