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

import { fetchProtocolsPaginated } from "@/lib/supabase/protocols";

describe("fetchProtocolsPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = { data: null, error: null };
  });

  it("returns paginated items with totalCount", async () => {
    const items = [
      { id: "1", title: "Protocol 1" },
      { id: "2", title: "Protocol 2" },
    ];
    mockResponse = { data: items, error: null, count: 15 };

    const result = await fetchProtocolsPaginated({ page: 1, pageSize: 12 });

    expect(mockFrom).toHaveBeenCalledWith("protocols");
    expect(result.data).toEqual({ items, totalCount: 15 });
    expect(result.error).toBeNull();
  });

  it("returns empty items when no results", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    const result = await fetchProtocolsPaginated({ page: 1, pageSize: 12 });

    expect(result.data).toEqual({ items: [], totalCount: 0 });
  });

  it("returns error on failure", async () => {
    mockResponse = { data: null, error: { message: "DB error" } };

    const result = await fetchProtocolsPaginated({ page: 1, pageSize: 12 });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "DB error" });
  });

  it("passes search and status filters", async () => {
    mockResponse = { data: [], error: null, count: 0 };

    await fetchProtocolsPaginated({
      page: 1,
      pageSize: 20,
      search: "vaccine efficacy",
      statuses: ["draft", "in_review"],
      sortBy: "title",
      sortDirection: "asc",
    });

    expect(mockFrom).toHaveBeenCalledWith("protocols");
  });
});
