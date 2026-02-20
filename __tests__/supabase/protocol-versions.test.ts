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
  fetchVersionsByProtocolId,
  fetchVersionById,
  fetchLatestVersion,
  createVersion,
} from "@/lib/supabase/protocol-versions";

const sampleVersion = {
  id: "ver-1",
  protocol_id: "proto-1",
  version_number: 1,
  title: "Test Protocol",
  study_question: "Does X affect Y?",
  population: "Adults",
  intervention: "Drug A",
  comparator: "Placebo",
  outcomes: "Recovery rate",
  design: "RCT",
  status: "draft",
  change_summary: "Initial version",
  content_hash: "abc123hash",
  created_by: "user-1",
  signed_by: null,
  signed_at: null,
  signature_meaning: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("protocol-versions CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  describe("fetchVersionsByProtocolId", () => {
    it("returns versions ordered by version_number desc", async () => {
      mockResponse = { data: [sampleVersion], error: null };

      const result = await fetchVersionsByProtocolId("proto-1");

      expect(mockFrom).toHaveBeenCalledWith("protocol_versions");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].version_number).toBe(1);
    });

    it("returns empty array when no versions exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchVersionsByProtocolId("proto-1");

      expect(result.data).toHaveLength(0);
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "DB error" } };

      const result = await fetchVersionsByProtocolId("proto-1");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "DB error" });
    });
  });

  describe("fetchVersionById", () => {
    it("returns a single version by id", async () => {
      mockResponse = { data: sampleVersion, error: null };

      const result = await fetchVersionById("ver-1");

      expect(mockFrom).toHaveBeenCalledWith("protocol_versions");
      expect(result.data?.id).toBe("ver-1");
    });

    it("returns error when version not found", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await fetchVersionById("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Not found");
    });
  });

  describe("fetchLatestVersion", () => {
    it("returns the latest version for a protocol", async () => {
      const latest = { ...sampleVersion, version_number: 3 };
      mockResponse = { data: latest, error: null };

      const result = await fetchLatestVersion("proto-1");

      expect(mockFrom).toHaveBeenCalledWith("protocol_versions");
      expect(result.data?.version_number).toBe(3);
    });

    it("returns null data when no versions exist", async () => {
      mockResponse = { data: null, error: { message: "No rows" } };

      const result = await fetchLatestVersion("proto-1");

      expect(result.data).toBeNull();
    });
  });

  describe("createVersion", () => {
    it("inserts a new version and returns it", async () => {
      mockResponse = { data: sampleVersion, error: null };

      const result = await createVersion({
        protocol_id: "proto-1",
        version_number: 1,
        title: "Test Protocol",
        study_question: "Does X affect Y?",
        population: "Adults",
        intervention: "Drug A",
        comparator: "Placebo",
        outcomes: "Recovery rate",
        design: "RCT",
        status: "draft",
        change_summary: "Initial version",
        content_hash: "abc123hash",
        created_by: "user-1",
      });

      expect(mockFrom).toHaveBeenCalledWith("protocol_versions");
      expect(result.data?.id).toBe("ver-1");
      expect(result.error).toBeNull();
    });

    it("returns error on insert failure", async () => {
      mockResponse = {
        data: null,
        error: { message: "Unique constraint violated" },
      };

      const result = await createVersion({
        protocol_id: "proto-1",
        version_number: 1,
        title: "Test",
        study_question: "Question?",
        population: "Adults",
        intervention: "",
        comparator: "Placebo",
        outcomes: "Outcomes",
        design: "RCT",
        status: "draft",
        change_summary: "",
        content_hash: "hash",
        created_by: "user-1",
      });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Unique constraint violated");
    });
  });
});
