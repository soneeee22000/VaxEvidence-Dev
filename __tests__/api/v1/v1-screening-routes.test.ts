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
  getWorkspaceMemberUserIds: vi.fn(),
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
const EVIDENCE_ID = "660e8400-e29b-41d4-a716-446655440001";

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

const RATE_LIMIT_OK = {
  allowed: true,
  remaining: 999,
  resetAt: Date.now() + 3_600_000,
  limit: 1000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function setupAuthMocks() {
  mockAuthenticateApiKey.mockResolvedValue(AUTH_SUCCESS);
  mockCheckRateLimit.mockReturnValue(RATE_LIMIT_OK);
  mockGetRateLimitHeaders.mockReturnValue({});
  mockDispatchEvent.mockResolvedValue(undefined);
  const logChain = createMockChain({ data: null, error: null });
  mockGetSupabaseAdmin.mockReturnValue({ from: () => logChain });
}

// ===========================================================================
// GET /api/v1/protocols/:id/screening — list screening decisions
// ===========================================================================

describe("GET /api/v1/protocols/:id/screening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when API key is invalid", async () => {
    mockAuthenticateApiKey.mockResolvedValue({
      data: null,
      error: "Invalid or revoked API key",
    });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("unauthorized");
  });

  it("returns 404 when protocol not found in workspace", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: null,
      error: "Not found",
    });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe("not_found");
    expect(json.error.message).toBe("Protocol not found");
  });

  it("returns paginated screening decisions on success", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const decisions = [
      {
        id: "sd-1",
        protocol_id: PROTOCOL_ID,
        evidence_id: EVIDENCE_ID,
        stage: "identification",
        decision: "include",
        evidence_items: { id: EVIDENCE_ID, title: "Study A" },
      },
    ];
    const queryChain = createMockChain({
      data: decisions,
      error: null,
      count: 1,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        page: "1",
        per_page: "10",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].stage).toBe("identification");
    expect(json.meta.page).toBe(1);
    expect(json.meta.total).toBe(1);
  });

  it("filters by stage query parameter", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const queryChain = createMockChain({ data: [], error: null, count: 0 });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        stage: "eligibility",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("filters by decision query parameter", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const queryChain = createMockChain({ data: [], error: null, count: 0 });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        decision: "exclude",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database query error", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const queryChain = createMockChain({
      data: null,
      error: { message: "Query timeout" },
      count: null,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => queryChain });

    const { GET } = await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await GET(
      makeGetRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("query_failed");
  });
});

// ===========================================================================
// POST /api/v1/protocols/:id/screening — upsert decision
// ===========================================================================

describe("POST /api/v1/protocols/:id/screening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const validBody = {
    evidence_id: EVIDENCE_ID,
    stage: "identification",
    decision: "include",
  };

  it("upserts a screening decision on success and returns 201", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const upsertedDecision = {
      id: "sd-1",
      protocol_id: PROTOCOL_ID,
      evidence_id: EVIDENCE_ID,
      stage: "identification",
      decision: "include",
    };
    const upsertChain = createMockChain({
      data: upsertedDecision,
      error: null,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => upsertChain });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, validBody),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.decision).toBe("include");
    expect(json.data.protocol_id).toBe(PROTOCOL_ID);
  });

  it("returns 422 when required fields are missing", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        evidence_id: EVIDENCE_ID,
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.details.missing_fields).toContain("stage");
    expect(json.error.details.missing_fields).toContain("decision");
  });

  it("returns 422 for invalid stage value", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        evidence_id: EVIDENCE_ID,
        stage: "invalid_stage",
        decision: "include",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.message).toContain("Invalid stage");
  });

  it("returns 422 for invalid decision value", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        evidence_id: EVIDENCE_ID,
        stage: "identification",
        decision: "invalid_decision",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.message).toContain("Invalid decision");
  });

  it("returns 404 when protocol not found in workspace", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: null,
      error: "Not found",
    });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, validBody),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe("not_found");
  });

  it("returns 400 on invalid JSON body", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const req = new NextRequest(
      new URL(
        `/api/v1/protocols/${PROTOCOL_ID}/screening`,
        "http://localhost:3000",
      ),
      {
        method: "POST",
        body: "not-json",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer vxe_testkey123",
        },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: PROTOCOL_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_json");
  });

  it("returns 500 on upsert database error", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const upsertChain = createMockChain({
      data: null,
      error: { message: "Upsert failed: integrity constraint" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => upsertChain });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, validBody),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("upsert_failed");
  });

  it("includes optional exclusion_reason and notes when provided", async () => {
    setupAuthMocks();
    mockVerifyWorkspaceOwnership.mockResolvedValue({
      data: { id: PROTOCOL_ID },
      error: null,
    });

    const upsertedDecision = {
      id: "sd-2",
      protocol_id: PROTOCOL_ID,
      evidence_id: EVIDENCE_ID,
      stage: "screening",
      decision: "exclude",
      exclusion_reason: "Wrong population",
      notes: "Study targets children, not adults",
    };
    const upsertChain = createMockChain({
      data: upsertedDecision,
      error: null,
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => upsertChain });

    const { POST } =
      await import("@/app/api/v1/protocols/[id]/screening/route");
    const res = await POST(
      makePostRequest(`/api/v1/protocols/${PROTOCOL_ID}/screening`, {
        evidence_id: EVIDENCE_ID,
        stage: "screening",
        decision: "exclude",
        exclusion_reason: "Wrong population",
        notes: "Study targets children, not adults",
      }),
      { params: Promise.resolve({ id: PROTOCOL_ID }) },
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.exclusion_reason).toBe("Wrong population");
    expect(json.data.notes).toBe("Study targets children, not adults");
  });
});
