import { describe, it, expect, vi } from "vitest";
import { parsePagination, jsonSuccess, jsonError } from "@/lib/api/v1/types";

// ---------------------------------------------------------------------------
// Mock NextResponse.json — returns a plain object mirroring the response shape
// so we can inspect the body and status without running a real HTTP server.
// ---------------------------------------------------------------------------
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

describe("parsePagination", () => {
  it("returns defaults when no params are provided", () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.from).toBe(0);
    expect(result.to).toBe(19);
  });

  it("parses custom page and per_page values", () => {
    const params = new URLSearchParams({ page: "3", per_page: "10" });
    const result = parsePagination(params);

    expect(result.page).toBe(3);
    expect(result.perPage).toBe(10);
    expect(result.from).toBe(20);
    expect(result.to).toBe(29);
  });

  it("clamps page to minimum of 1", () => {
    const params = new URLSearchParams({ page: "0" });
    expect(parsePagination(params).page).toBe(1);

    const negative = new URLSearchParams({ page: "-5" });
    expect(parsePagination(negative).page).toBe(1);
  });

  it("treats per_page=0 as default (0 is falsy, falls through to 20)", () => {
    const params = new URLSearchParams({ per_page: "0" });
    // parseInt("0") = 0, which is falsy → falls to default 20
    expect(parsePagination(params).perPage).toBe(20);
  });

  it("clamps negative per_page to minimum of 1", () => {
    const negative = new URLSearchParams({ per_page: "-10" });
    // parseInt("-10") = -10, truthy → Math.max(1, -10) = 1
    expect(parsePagination(negative).perPage).toBe(1);
  });

  it("caps per_page at 100", () => {
    const params = new URLSearchParams({ per_page: "500" });
    expect(parsePagination(params).perPage).toBe(100);
  });

  it("uses default 20 for non-numeric per_page", () => {
    const params = new URLSearchParams({ per_page: "abc" });
    expect(parsePagination(params).perPage).toBe(20);
  });

  it("uses default 1 for non-numeric page", () => {
    const params = new URLSearchParams({ page: "xyz" });
    expect(parsePagination(params).page).toBe(1);
  });

  it("calculates correct from/to for page 1, per_page 50", () => {
    const params = new URLSearchParams({ page: "1", per_page: "50" });
    const result = parsePagination(params);
    expect(result.from).toBe(0);
    expect(result.to).toBe(49);
  });

  it("calculates correct from/to for page 5, per_page 25", () => {
    const params = new URLSearchParams({ page: "5", per_page: "25" });
    const result = parsePagination(params);
    expect(result.from).toBe(100);
    expect(result.to).toBe(124);
  });

  it("handles per_page of 1 correctly", () => {
    const params = new URLSearchParams({ page: "3", per_page: "1" });
    const result = parsePagination(params);
    expect(result.from).toBe(2);
    expect(result.to).toBe(2);
  });
});

describe("jsonSuccess", () => {
  it("wraps data in a { data } envelope", () => {
    const resp = jsonSuccess({ id: 1, name: "test" }) as unknown as {
      body: { data: unknown; meta?: unknown };
      status: number;
    };

    expect(resp.body.data).toEqual({ id: 1, name: "test" });
  });

  it("defaults to status 200", () => {
    const resp = jsonSuccess("ok") as unknown as {
      body: unknown;
      status: number;
    };
    expect(resp.status).toBe(200);
  });

  it("allows a custom status code", () => {
    const resp = jsonSuccess(null, undefined, 201) as unknown as {
      body: unknown;
      status: number;
    };
    expect(resp.status).toBe(201);
  });

  it("includes pagination meta when provided", () => {
    const meta = { page: 2, per_page: 10, total: 50, total_pages: 5 };
    const resp = jsonSuccess([1, 2, 3], meta) as unknown as {
      body: { data: unknown; meta: typeof meta };
      status: number;
    };

    expect(resp.body.meta).toEqual(meta);
  });

  it("omits meta field when not provided", () => {
    const resp = jsonSuccess("data") as unknown as {
      body: { data: unknown; meta?: unknown };
    };
    expect(resp.body.meta).toBeUndefined();
  });

  it("handles null data", () => {
    const resp = jsonSuccess(null) as unknown as {
      body: { data: unknown };
    };
    expect(resp.body.data).toBeNull();
  });

  it("handles array data", () => {
    const resp = jsonSuccess([1, 2, 3]) as unknown as {
      body: { data: unknown };
    };
    expect(resp.body.data).toEqual([1, 2, 3]);
  });
});

describe("jsonError", () => {
  it("wraps error in a { error: { code, message } } envelope", () => {
    const resp = jsonError(
      "not_found",
      "Resource not found",
      404,
    ) as unknown as {
      body: { error: { code: string; message: string; details?: unknown } };
      status: number;
    };

    expect(resp.body.error.code).toBe("not_found");
    expect(resp.body.error.message).toBe("Resource not found");
  });

  it("sets the correct HTTP status code", () => {
    const resp = jsonError("unauthorized", "Missing token", 401) as unknown as {
      body: unknown;
      status: number;
    };
    expect(resp.status).toBe(401);
  });

  it("includes details when provided", () => {
    const details = { field: "email", reason: "invalid format" };
    const resp = jsonError(
      "validation_error",
      "Invalid input",
      422,
      details,
    ) as unknown as {
      body: { error: { code: string; message: string; details: unknown } };
    };

    expect(resp.body.error.details).toEqual(details);
  });

  it("omits details field when not provided", () => {
    const resp = jsonError(
      "server_error",
      "Internal error",
      500,
    ) as unknown as {
      body: { error: { code: string; message: string; details?: unknown } };
    };
    expect(resp.body.error.details).toBeUndefined();
  });

  it("handles string details", () => {
    const resp = jsonError(
      "bad_request",
      "Bad request",
      400,
      "extra info",
    ) as unknown as {
      body: { error: { details: unknown } };
    };
    expect(resp.body.error.details).toBe("extra info");
  });

  it("handles array details", () => {
    const errors = [
      { field: "name", issue: "required" },
      { field: "email", issue: "invalid" },
    ];
    const resp = jsonError(
      "validation_error",
      "Multiple errors",
      422,
      errors,
    ) as unknown as {
      body: { error: { details: unknown } };
    };
    expect(resp.body.error.details).toEqual(errors);
  });
});
