/**
 * Pagination types and utilities for server-side pagination, sorting, and filtering.
 */

/** Default number of items per page. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size to prevent abuse. */
export const MAX_PAGE_SIZE = 100;

/** Pagination request parameters. */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Sort direction. */
export type SortDirection = "asc" | "desc";

/** Sort request parameters. */
export interface SortParams {
  sortBy: string;
  sortDirection: SortDirection;
}

/** Pagination metadata returned in responses. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Generic paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Combined list query parameters (pagination + sort + search). */
export interface ListQueryParams extends PaginationParams, Partial<SortParams> {
  search?: string;
}

/**
 * Compute Supabase `.range(from, to)` values from page and pageSize.
 * Returns `{ from, to }` (inclusive).
 */
export function buildSupabaseRange(
  page: number,
  pageSize: number,
): { from: number; to: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;
  return { from, to };
}

/**
 * Build pagination metadata from a total count and current page/pageSize.
 */
export function buildPaginationMeta(
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(totalCount / safeSize));
  return {
    page: safePage,
    pageSize: safeSize,
    totalCount,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

/**
 * Parse pagination/sort/search query parameters from URLSearchParams.
 * Returns validated `ListQueryParams` with safe defaults.
 */
export function parseQueryParams(params: URLSearchParams): ListQueryParams {
  const rawPage = params.get("page");
  const rawPageSize = params.get("pageSize");
  const rawSortBy = params.get("sortBy");
  const rawSortDirection = params.get("sortDirection");
  const search = params.get("search") ?? undefined;

  const page = rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;
  const pageSize = rawPageSize
    ? Math.min(
        Math.max(1, parseInt(rawPageSize, 10) || DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      )
    : DEFAULT_PAGE_SIZE;

  const result: ListQueryParams = { page, pageSize };

  if (rawSortBy) {
    result.sortBy = rawSortBy;
  }

  if (rawSortDirection === "asc" || rawSortDirection === "desc") {
    result.sortDirection = rawSortDirection;
  }

  if (search) {
    result.search = search;
  }

  return result;
}
