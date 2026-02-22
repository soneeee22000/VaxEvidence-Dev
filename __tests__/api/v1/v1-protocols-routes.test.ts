import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before route imports
// ---------------------------------------------------------------------------

const mockGetSupabaseAdmin = vi.fn();
const mockAuthenticateApiKey = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockGetRateLimitHeaders = vi.fn();
const mockDispatchEvent = vi.fn();
const mockGetWorkspaceMemberUserIds = vi.fn();
const mockVerifyWorkspaceOwnership = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: (...args: unknown[]) => mockGetSupabaseAdmin(...args),
}));

vi.mock("@/lib/api/api-key-auth", () => ({
  authenticateApiKey: (...args: unknown[]) => mockAuthenticateApiKey(...args),
}));

vi.mock("@/lib/api/rate-limiter", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

vi.mock("@/lib/api/webhook-dispatcher", () => ({
  dispatchEvent: (...args: unknown[]) => mockDispatchEvent(...args),
}));

vi.mock("@/lib/api/v1/workspace-helpers", () => ({
  getWorkspaceMemberUserIds: (...args: unknown[]) =>
    mockGetWorkspaceMemberUserIds(...args),
  verifyWorkspaceOwnership: (...args: unknown[]) =>
    mockVerifyWorkspaceOwnership(...args),
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = "ws-001";
const USER_ID = "u-001";
const API_KEY_ID = "ak-001";
const PROTOCOL_ID = "550e8400-e29b-41d4-a716-446655440000";

/** Standard authenticated API key payload. */
const AUTH_SUCCESS = {
  data: {
    apiKeyId: API_KEY_ID,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    scopes: ["read", "write", "admin"],
    rateLimitTier: "pro",
  },
  error: null,
};

/** Standard rate limit pass result. */
const RATE_LIMIT_OK = {
  allowed: true,
  remaining: 999,
  resetAt: Date.now() + 3_600_000,
  limit: 1000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a chainable mock that mimics the Supabase query builder.
 * All method calls return the chain; awaiting resolves to `resolvedValue`.
 */
function createMockChain(resolvedValue: unknown) {
  const handler: ProxyHandler<any> = {
    get(_, prop) {
      if (prop === "then") {
        return (resolvedValue as Promise<unknown>)?.then
          ? (resolvedValue as Promise<unknown>).then.bind(resolvedValue)
          : (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      return new Proxy(() => resolvedValue, handler);
    },
    apply() {
      return new Proxy(resolvedValue, handler);
    },
  };
  return new Proxy(() => resolvedValue, handler);
}

function makeGetRequest(path: string, params?: Record<string, string>) {
  const url = new URL(path, "http://localhost:3000");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url, {
    headers: { Authorization: "Bearer vxe_testkey123" },
  });
}

function makePostRequest(path: string, body: unknown) {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer vxe_testkey123",
    },
  });
}

function makePatchRequest(path: string, body: unknown) {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer vxe_testkey123",
    },
  });
}

function makeDeleteRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "DELETE",
    headers: { Authorization: "Bearer vxe_testkey123" },
  });
}

/** Set up all mocks for an authenticated, rate-limit-passing request. */
function setupAuthMocks() {
  mockAuthenticateApiKey.mockResolvedValue(AUTH_SUCCESS);
  mockCheckRateLimit.mockReturnValue(RATE_LIMIT_OK);
  mockGetRateLimitHeaders.mockReturnValue({});
  mockDispatchEvent.mockResolvedValue(undefined);
  // Fire-and-forget request log
  const logChain = createMockChain({ data: null, error: null });
  mockGetSupabaseAdmin.mockReturnValue({ from: () => logChain });
}

// ===========================================================================
// GET /api/v1/protocols — list paginated
// ===========================================================================

describe("GET /api/v1/protocols", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when API key is invalid", async () => {
    mockAuthenticateApiKey.mockResolvedValue({
      data: null,
      error: "Invalid or revoked API key",
    });

    const { GET } = await import("@/app/api/v1/protocols/route");
    const res = await GET(makeGetRequest("/api/v1/protocols"));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("unauthorized");
  });

  it("returns empty list when workspace has no members", async () => {
    setupAuthMocks();
    mockGetWorkspaceMemberUserIds.mockResolvedValue([]);

    const { GET } = await import("@/app/api/v1/protocols/route");
    const res = await GET(makeGetRequest("/api/v1/protocols"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
    expect(json.meta.total).toBe(0);
  });

  it("returns paginated protocols on success", async () => {
    setupAuthMocks();
    mockGetWorkspaceMemberUserIds.mockResolvedValue([USER_ID]);

    const protocols = [
      { id: PROTOCOL_ID, title: "Flu Vaccine Study", user_id: USER_ID },
    ];
    const queryChain = createMockChain({
      data: protocols,
      error: null,
      count: 1,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/route");
    const res = await GET(
      makeGetRequest("/api/v1/protocols", { page: "1", per_page: "10" }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(protocols);
    expect(json.meta.page).toBe(1);
    expect(json.meta.per_page).toBe(10);
    expect(json.meta.total).toBe(1);
    expect(json.meta.total_pages).toBe(1);
  });

  it("applies status filter when provided", async () => {
    setupAuthMocks();
    mockGetWorkspaceMemberUserIds.mockResolvedValue([USER_ID]);

    const queryChain = createMockChain({ data: [], error: null, count: 0 });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/route");
    const res = await GET(
      makeGetRequest("/api/v1/protocols", { status: "draft" }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    setupAuthMocks();
    mockGetWorkspaceMemberUserIds.mockResolvedValue([USER_ID]);

    const queryChain = createMockChain({
      data: null,
      error: { message: "DB connection lost" },
      count: null,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/route");
    const res = await GET(makeGetRequest("/api/v1/protocols"));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("query_failed");
  });
});

// ===========================================================================
// POST /api/v1/protocols — create protocol
// ===========================================================================

describe("POST /api/v1/protocols", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const validBody = {
    title: "COVID-19 Vaccine Efficacy",
    study_question: "Does vaccine X reduce infection rates?",
    population: "Adults 18+",
    comparator: "Placebo",
    outcomes: "Infection rate reduction",
    design: "RCT",
  };

  it("creates a protocol with valid data and returns 201", async () => {
    setupAuthMocks();

    const insertedProtocol = {
      id: PROTOCOL_ID,
      ...validBody,
      user_id: USER_ID,
    };
    const insertChain = createMockChain({
      data: insertedProtocol,
      error: null,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => insertChain });

    const { POST } = await import("@/app/api/v1/protocols/route");
    const res = await POST(makePostRequest("/api/v1/protocols", validBody));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.title).toBe(validBody.title);
    expect(json.data.user_id).toBe(USER_ID);
  });

  it("returns 422 when required fields are missing", async () => {
    setupAuthMocks();

    const { POST } = await import("@/app/api/v1/protocols/route");
    const res = await POST(
      makePostRequest("/api/v1/protocols", { title: "Incomplete" }),
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.details.missing_fields).toContain("study_question");
    expect(json.error.details.missing_fields).toContain("population");
  });

  it("returns 400 on invalid JSON body", async () => {
    setupAuthMocks();

    const { POST } = await import("@/app/api/v1/protocols/route");
    const req = new NextRequest(
      new URL("/api/v1/protocols", "http://localhost:3000"),
      {
        method: "POST",
        body: "not-json",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer vxe_testkey123",
        },
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_json");
  });

  it("returns 500 on insert database error", async () => {
    setupAuthMocks();

    const insertChain = createMockChain({
      data: null,
      error: { message: "Insert failed: duplicate key" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => insertChain });

    const { POST } = await import("@/app/api/v1/protocols/route");
    const res = await POST(makePostRequest("/api/v1/protocols", validBody));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("insert_failed");
  });
});

// ===========================================================================
// GET /api/v1/protocols/:id — retrieve single protocol
// ===========================================================================

describe("GET /api/v1/protocols/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns protocol when found", async () => {
    setupAuthMocks();
    const protocol = { id: PROTOCOL_ID, title: "Study Alpha" };
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: protocol,
      error: null,
    });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(PROTOCOL_ID);
  });

  it("returns 404 when protocol is not found in workspace", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: null,
      error: "Not found",
    });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/v1/protocols/nonexistent"), {
      params: Promise.resolve({ id: "nonexistent" }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe("not_found");
  });
});

// ===========================================================================
// PATCH /api/v1/protocols/:id — partial update
// ===========================================================================

describe("PATCH /api/v1/protocols/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("updates protocol fields on success", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const updated = { id: PROTOCOL_ID, title: "Updated Title" };
    const updateChain = createMockChain({ data: updated, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => updateChain });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest(`/api/v1/protocols/${PROTOCOL_ID}`, {
        title: "Updated Title",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.title).toBe("Updated Title");
  });

  it("returns 404 when protocol does not belong to workspace", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: null,
      error: "Not found",
    });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest(`/api/v1/protocols/${PROTOCOL_ID}`, {
        title: "X",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid JSON body", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const req = new NextRequest(
      new URL(`/api/v1/protocols/${PROTOCOL_ID}`, "http://localhost:3000"),
      {
        method: "PATCH",
        body: "not-json",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer vxe_testkey123",
        },
      },
    );
    const res = await mod.PATCH(req, {
      params: Promise.resolve({ id: PROTOCOL_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_json");
  });
});

// ===========================================================================
// DELETE /api/v1/protocols/:id — delete protocol
// ===========================================================================

describe("DELETE /api/v1/protocols/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("deletes protocol on success", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const deleteChain = createMockChain({ data: null, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => deleteChain });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.DELETE(
      makeDeleteRequest(`/api/v1/protocols/${PROTOCOL_ID}`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.deleted).toBe(true);
  });

  it("returns 404 when protocol not found", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: null,
      error: "Not found",
    });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.DELETE(
      makeDeleteRequest("/api/v1/protocols/nonexistent"),
      { params: Promise.resolve({ id: "nonexistent" }) },
    );

    expect(res.status).toBe(404);
  });

  it("returns 500 on delete database error", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const deleteChain = createMockChain({
      data: null,
      error: { message: "FK constraint violation" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => deleteChain });

    const mod = await import("@/app/api/v1/protocols/[id]/route");
    const res = await mod.DELETE(
      makeDeleteRequest(`/api/v1/protocols/${PROTOCOL_ID}`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("delete_failed");
  });
});
