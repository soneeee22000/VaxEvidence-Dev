import { NextResponse } from "next/server";

/** Standard success response envelope for the v1 public API. */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

/** Standard error response envelope for the v1 public API. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Pagination metadata included in list responses. */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Parsed pagination values with Supabase-compatible range indices. */
interface ParsedPagination {
  page: number;
  perPage: number;
  from: number;
  to: number;
}

/**
 * Parse pagination query parameters from a URLSearchParams instance.
 *
 * @param searchParams - The URL search parameters to parse.
 * @returns Parsed page, perPage, and zero-indexed `from`/`to` range values
 *          compatible with Supabase `.range(from, to)`.
 */
export function parsePagination(
  searchParams: URLSearchParams,
): ParsedPagination {
  const rawPage = searchParams.get("page");
  const rawPerPage = searchParams.get("per_page");

  const page = Math.max(1, rawPage ? parseInt(rawPage, 10) || 1 : 1);
  const perPage = Math.min(
    100,
    Math.max(1, rawPerPage ? parseInt(rawPerPage, 10) || 20 : 20),
  );

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  return { page, perPage, from, to };
}

/**
 * Return a JSON success response with the standard API envelope.
 *
 * @param data   - The response payload.
 * @param meta   - Optional pagination metadata.
 * @param status - HTTP status code (default 200).
 */
export function jsonSuccess<T>(
  data: T,
  meta?: PaginationMeta,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  const body: ApiResponse<T> = { data };

  if (meta) {
    body.meta = meta;
  }

  return NextResponse.json(body, { status });
}

/**
 * Return a JSON error response with the standard API error envelope.
 *
 * @param code    - Machine-readable error code (e.g., "not_found").
 * @param message - Human-readable error message.
 * @param status  - HTTP status code.
 * @param details - Optional additional error context.
 */
export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ApiError> {
  const body: ApiError = {
    error: { code, message },
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  return NextResponse.json(body, { status });
}
