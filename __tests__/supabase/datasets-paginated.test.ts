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

import { fetchDatasetsPaginated } from "@/lib/supabase/datasets";

describe("fetchDatasetsPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  it("returns paginated items with totalCount", async () => {
    const items = [
      { id: "1", name: "Dataset 1" },
      { id: "2", name: "Dataset 2" },
    ];
    mockResponse = { data: items, error: null, count: 30 };

    const result = await fetchDatasetsPaginated({ page: 1, pageSize: 20 });

    expect(mockFrom).toHaveBeenCalledWith("datasets");
    expect(result.data).toEqual({ items, totalCount: 30 });
    expect(result.error).toBeNull();
  });

  it("returns empty items when no results", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    const result = await fetchDatasetsPaginated({ page: 1, pageSize: 20 });

    expect(result.data).toEqual({ items: [], totalCount: 0 });
  });

  it("returns error on failure", async () => {
    mockResponse = { data: null, error: { message: "DB error" } };

    const result = await fetchDatasetsPaginated({ page: 1, pageSize: 20 });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "DB error" });
  });

  it("passes search, type, status, fileType, and tag filters", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    await fetchDatasetsPaginated({
      page: 2,
      pageSize: 10,
      search: "clinical",
      types: ["clinical_trial"],
      statuses: ["validated"],
      fileTypes: ["csv"],
      tags: ["COVID-19"],
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(mockFrom).toHaveBeenCalledWith("datasets");
  });
});
