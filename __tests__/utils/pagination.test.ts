import { describe, it, expect } from "vitest";
import {
  buildSupabaseRange,
  buildPaginationMeta,
  parseQueryParams,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/types/pagination";

describe("buildSupabaseRange", () => {
  it("returns correct range for page 1", () => {
    const { from, to } = buildSupabaseRange(1, 20);
    expect(from).toBe(0);
    expect(to).toBe(19);
  });

  it("returns correct range for page 2", () => {
    const { from, to } = buildSupabaseRange(2, 20);
    expect(from).toBe(20);
    expect(to).toBe(39);
  });

  it("returns correct range for page 3 with pageSize 10", () => {
    const { from, to } = buildSupabaseRange(3, 10);
    expect(from).toBe(20);
    expect(to).toBe(29);
  });

  it("clamps page to minimum 1", () => {
    const { from, to } = buildSupabaseRange(0, 20);
    expect(from).toBe(0);
    expect(to).toBe(19);
  });

  it("clamps negative page to 1", () => {
    const { from, to } = buildSupabaseRange(-5, 20);
    expect(from).toBe(0);
    expect(to).toBe(19);
  });

  it("clamps pageSize to MAX_PAGE_SIZE", () => {
    const { from, to } = buildSupabaseRange(1, 500);
    expect(to).toBe(MAX_PAGE_SIZE - 1);
  });

  it("clamps pageSize to minimum 1", () => {
    const { from, to } = buildSupabaseRange(1, 0);
    expect(from).toBe(0);
    expect(to).toBe(0);
  });
});

describe("buildPaginationMeta", () => {
  it("computes correct meta for a typical page", () => {
    const meta = buildPaginationMeta(100, 1, 20);
    expect(meta).toEqual({
      page: 1,
      pageSize: 20,
      totalCount: 100,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("computes correct meta for last page", () => {
    const meta = buildPaginationMeta(100, 5, 20);
    expect(meta).toEqual({
      page: 5,
      pageSize: 20,
      totalCount: 100,
      totalPages: 5,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it("computes correct meta for middle page", () => {
    const meta = buildPaginationMeta(100, 3, 20);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it("handles zero total count", () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it("handles partial last page", () => {
    const meta = buildPaginationMeta(25, 1, 20);
    expect(meta.totalPages).toBe(2);
    expect(meta.hasNextPage).toBe(true);
  });

  it("handles single item total", () => {
    const meta = buildPaginationMeta(1, 1, 20);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });
});

describe("parseQueryParams", () => {
  it("returns defaults for empty params", () => {
    const params = new URLSearchParams();
    const result = parseQueryParams(params);
    expect(result).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("parses page and pageSize", () => {
    const params = new URLSearchParams("page=3&pageSize=10");
    const result = parseQueryParams(params);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });

  it("parses sort params", () => {
    const params = new URLSearchParams("sortBy=title&sortDirection=asc");
    const result = parseQueryParams(params);
    expect(result.sortBy).toBe("title");
    expect(result.sortDirection).toBe("asc");
  });

  it("parses search", () => {
    const params = new URLSearchParams("search=vaccine");
    const result = parseQueryParams(params);
    expect(result.search).toBe("vaccine");
  });

  it("ignores invalid sortDirection", () => {
    const params = new URLSearchParams("sortDirection=invalid");
    const result = parseQueryParams(params);
    expect(result.sortDirection).toBeUndefined();
  });

  it("clamps page to minimum 1", () => {
    const params = new URLSearchParams("page=-1");
    const result = parseQueryParams(params);
    expect(result.page).toBe(1);
  });

  it("clamps pageSize to MAX_PAGE_SIZE", () => {
    const params = new URLSearchParams("pageSize=999");
    const result = parseQueryParams(params);
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it("handles non-numeric page gracefully", () => {
    const params = new URLSearchParams("page=abc");
    const result = parseQueryParams(params);
    expect(result.page).toBe(1);
  });

  it("parses all params together", () => {
    const params = new URLSearchParams(
      "page=2&pageSize=50&sortBy=updated_at&sortDirection=desc&search=covid",
    );
    const result = parseQueryParams(params);
    expect(result).toEqual({
      page: 2,
      pageSize: 50,
      sortBy: "updated_at",
      sortDirection: "desc",
      search: "covid",
    });
  });
});
