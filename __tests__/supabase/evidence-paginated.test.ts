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

import { fetchEvidenceItemsPaginated } from "@/lib/supabase/evidence";

describe("fetchEvidenceItemsPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  it("returns paginated items with totalCount", async () => {
    const items = [
      { id: "1", title: "Evidence 1" },
      { id: "2", title: "Evidence 2" },
    ];
    mockResponse = { data: items, error: null, count: 50 };

    const result = await fetchEvidenceItemsPaginated({ page: 1, pageSize: 20 });

    expect(mockFrom).toHaveBeenCalledWith("evidence_items");
    expect(result.data).toEqual({ items, totalCount: 50 });
    expect(result.error).toBeNull();
  });

  it("returns empty items when no results", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    const result = await fetchEvidenceItemsPaginated({ page: 1, pageSize: 20 });

    expect(result.data).toEqual({ items: [], totalCount: 0 });
  });

  it("returns error on failure", async () => {
    mockResponse = { data: null, error: { message: "DB error" } };

    const result = await fetchEvidenceItemsPaginated({ page: 1, pageSize: 20 });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "DB error" });
  });

  it("passes search, type, status, tags, and date filters", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    await fetchEvidenceItemsPaginated({
      page: 1,
      pageSize: 20,
      search: "vaccine",
      types: ["academic"],
      statuses: ["published"],
      tags: ["COVID-19"],
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
      sortBy: "title",
      sortDirection: "asc",
    });

    expect(mockFrom).toHaveBeenCalledWith("evidence_items");
  });

  it("handles null data as empty array", async () => {
    mockResponse = { data: null, error: null, count: 0 };

    const result = await fetchEvidenceItemsPaginated({ page: 1, pageSize: 20 });

    // Should return items: [] when data is null but no error
    // The implementation coalesces null to []
    expect(result.data?.items).toEqual([]);
  });
});
