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
  fetchReportingChecklist,
  fetchReportingChecklists,
  upsertReportingChecklist,
  deleteReportingChecklist,
} from "@/lib/supabase/reporting-checklists";

const PROTOCOL_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("reporting-checklists CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  // -----------------------------------------------------------------------
  // fetchReportingChecklist
  // -----------------------------------------------------------------------
  describe("fetchReportingChecklist", () => {
    it("returns a checklist for a protocol and type", async () => {
      const checklist = {
        id: "cl-1",
        protocol_id: PROTOCOL_ID,
        checklist_type: "consort",
        items: [],
        completion_pct: 75,
      };
      mockResponse = { data: checklist, error: null };

      const result = await fetchReportingChecklist(PROTOCOL_ID, "consort");

      expect(mockFrom).toHaveBeenCalledWith("reporting_checklists");
      expect(result.data).toEqual(checklist);
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await fetchReportingChecklist(PROTOCOL_ID, "consort");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Not found" });
    });
  });

  // -----------------------------------------------------------------------
  // fetchReportingChecklists
  // -----------------------------------------------------------------------
  describe("fetchReportingChecklists", () => {
    it("returns all checklists for a protocol", async () => {
      const checklists = [
        { id: "cl-1", checklist_type: "consort" },
        { id: "cl-2", checklist_type: "strobe" },
      ];
      mockResponse = { data: checklists, error: null };

      const result = await fetchReportingChecklists(PROTOCOL_ID);

      expect(mockFrom).toHaveBeenCalledWith("reporting_checklists");
      expect(result.data).toEqual(checklists);
      expect(result.error).toBeNull();
    });

    it("returns empty array when no checklists exist", async () => {
      mockResponse = { data: [], error: null };

      const result = await fetchReportingChecklists(PROTOCOL_ID);

      expect(result.data).toEqual([]);
    });

    it("returns error on failure", async () => {
      mockResponse = { data: null, error: { message: "Query failed" } };

      const result = await fetchReportingChecklists(PROTOCOL_ID);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Query failed" });
    });
  });

  // -----------------------------------------------------------------------
  // upsertReportingChecklist
  // -----------------------------------------------------------------------
  describe("upsertReportingChecklist", () => {
    const payload = {
      protocol_id: PROTOCOL_ID,
      checklist_type: "consort" as const,
      items: [
        { item_id: "1a", status: "complete", notes: "Done" },
        { item_id: "1b", status: "incomplete" },
      ],
      completion_pct: 50,
    };

    it("upserts and returns the checklist", async () => {
      const created = { id: "cl-1", ...payload };
      mockResponse = { data: created, error: null };

      const result = await upsertReportingChecklist(payload);

      expect(mockFrom).toHaveBeenCalledWith("reporting_checklists");
      expect(result.data).toEqual(created);
      expect(result.error).toBeNull();
    });

    it("returns error on upsert failure", async () => {
      mockResponse = { data: null, error: { message: "Conflict" } };

      const result = await upsertReportingChecklist(payload);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Conflict" });
    });
  });

  // -----------------------------------------------------------------------
  // deleteReportingChecklist
  // -----------------------------------------------------------------------
  describe("deleteReportingChecklist", () => {
    it("deletes a checklist by ID", async () => {
      mockResponse = { data: null, error: null };

      const result = await deleteReportingChecklist("cl-1");

      expect(mockFrom).toHaveBeenCalledWith("reporting_checklists");
      expect(result.error).toBeNull();
    });

    it("returns error on delete failure", async () => {
      mockResponse = { data: null, error: { message: "Not found" } };

      const result = await deleteReportingChecklist("cl-1");

      expect(result.error).toEqual({ message: "Not found" });
    });
  });
});
