import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable mock that returns configured response at any terminal point
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
  fetchEvidenceItems,
  fetchEvidenceById,
  createEvidence,
  updateEvidence,
  deleteEvidence,
  getUniqueTags,
  linkEvidenceToProtocol,
  unlinkEvidence,
} from "@/lib/supabase/evidence";

describe("evidence CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  describe("fetchEvidenceItems", () => {
    it("returns evidence items from supabase", async () => {
      const items = [
        { id: "1", title: "Paper A", type: "academic" },
        { id: "2", title: "FDA Guidance", type: "regulatory" },
      ];
      mockResponse = { data: items, error: null };

      const result = await fetchEvidenceItems();

      expect(mockFrom).toHaveBeenCalledWith("evidence_items");
      expect(result.data).toEqual(items);
      expect(result.error).toBeNull();
    });

    it("returns normalized error on failure", async () => {
      mockResponse = { data: null, error: { message: "Network error" } };

      const result = await fetchEvidenceItems();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Network error" });
    });
  });

  describe("fetchEvidenceById", () => {
    it("returns single evidence item by id", async () => {
      const item = { id: "abc", title: "My Paper", type: "academic" };
      mockResponse = { data: item, error: null };

      const result = await fetchEvidenceById("abc");

      expect(mockFrom).toHaveBeenCalledWith("evidence_items");
      expect(result.data).toEqual(item);
    });
  });

  describe("createEvidence", () => {
    it("inserts evidence item and returns result", async () => {
      const payload = {
        user_id: "user-1",
        type: "academic" as const,
        title: "New Paper",
        description: "A description",
      };
      const created = { id: "new-1", ...payload };
      mockResponse = { data: created, error: null };

      const result = await createEvidence(payload);

      expect(mockFrom).toHaveBeenCalledWith("evidence_items");
      expect(result.data).toEqual(created);
    });
  });

  describe("updateEvidence", () => {
    it("updates evidence item with updated_at", async () => {
      const updated = { id: "1", title: "Updated Title" };
      mockResponse = { data: updated, error: null };

      const result = await updateEvidence("1", { title: "Updated Title" });

      expect(mockFrom).toHaveBeenCalledWith("evidence_items");
      expect(result.data).toEqual(updated);
    });
  });

  describe("deleteEvidence", () => {
    it("deletes evidence item by id", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteEvidence("1");

      expect(mockFrom).toHaveBeenCalledWith("evidence_items");
      expect(result.error).toBeNull();
    });
  });

  describe("getUniqueTags", () => {
    it("flattens and deduplicates tags from all evidence", async () => {
      mockResponse = {
        data: [
          { tags: ["COVID-19", "mRNA vaccine"] },
          { tags: ["COVID-19", "efficacy"] },
          { tags: null },
        ],
        error: null,
      };

      const result = await getUniqueTags();

      expect(result.data).toEqual(["COVID-19", "efficacy", "mRNA vaccine"]);
      expect(result.error).toBeNull();
    });

    it("returns empty array when no evidence exists", async () => {
      mockResponse = { data: [], error: null };

      const result = await getUniqueTags();

      expect(result.data).toEqual([]);
    });
  });

  describe("linkEvidenceToProtocol", () => {
    it("creates link between protocol and evidence", async () => {
      const link = { id: "link-1", protocol_id: "p1", evidence_id: "e1" };
      mockResponse = { data: link, error: null };

      const result = await linkEvidenceToProtocol(
        "p1",
        "e1",
        "Important paper",
      );

      expect(mockFrom).toHaveBeenCalledWith("protocol_evidence_links");
      expect(result.data).toEqual(link);
    });
  });

  describe("unlinkEvidence", () => {
    it("deletes evidence link by id", async () => {
      mockResponse = { data: null, error: null };

      const result = await unlinkEvidence("link-1");

      expect(mockFrom).toHaveBeenCalledWith("protocol_evidence_links");
      expect(result.error).toBeNull();
    });
  });
});
