import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetServerUser = vi.fn();
const mockCreateServerSupabaseClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: () => mockGetServerUser(),
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.then = (resolve: (val: unknown) => void) => resolve(resolveValue);
  return chain;
}

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`, { method: "GET" });
}

function makePostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`, { method: "DELETE" });
}

const UUID_P = "550e8400-e29b-41d4-a716-446655440000";
const UUID_E = "660e8400-e29b-41d4-a716-446655440001";

// ---------------------------------------------------------------------------
// GET /api/risk-of-bias
// ---------------------------------------------------------------------------

describe("GET /api/risk-of-bias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { GET } = await import("@/app/api/risk-of-bias/route");
    const res = await GET(
      makeGetRequest(`/api/risk-of-bias?protocol_id=${UUID_P}`),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when protocol_id is missing", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { GET } = await import("@/app/api/risk-of-bias/route");
    const res = await GET(makeGetRequest("/api/risk-of-bias"));
    expect(res.status).toBe(400);
  });

  it("returns assessments on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const assessments = [{ id: "rob-1", tool: "rob2" }];
    const chain = createMockChain({ data: assessments, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/risk-of-bias/route");
    const res = await GET(
      makeGetRequest(`/api/risk-of-bias?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(assessments);
  });

  it("filters by tool when provided", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({ data: [], error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/risk-of-bias/route");
    const res = await GET(
      makeGetRequest(`/api/risk-of-bias?protocol_id=${UUID_P}&tool=robins_i`),
    );

    expect(res.status).toBe(200);
  });

  it("returns 500 on database error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "DB error" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/risk-of-bias/route");
    const res = await GET(
      makeGetRequest(`/api/risk-of-bias?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/risk-of-bias
// ---------------------------------------------------------------------------

describe("POST /api/risk-of-bias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/risk-of-bias/route");
    const res = await POST(
      makePostRequest("/api/risk-of-bias", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        tool: "rob2",
        domains: {},
        overall_judgment: "low",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("upserts a RoB assessment on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const assessment = { id: "rob-1", tool: "rob2", overall_judgment: "low" };
    const chain = createMockChain({ data: assessment, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { POST } = await import("@/app/api/risk-of-bias/route");
    const res = await POST(
      makePostRequest("/api/risk-of-bias", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        tool: "rob2",
        domains: { "Randomization process": { judgment: "low" } },
        overall_judgment: "low",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(assessment);
  });

  it("returns 500 on upsert error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Constraint error" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { POST } = await import("@/app/api/risk-of-bias/route");
    const res = await POST(
      makePostRequest("/api/risk-of-bias", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        tool: "rob2",
        domains: {},
        overall_judgment: "low",
      }),
    );

    expect(res.status).toBe(500);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/risk-of-bias/route");
    const req = new NextRequest("http://localhost/api/risk-of-bias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/risk-of-bias/[id]
// ---------------------------------------------------------------------------

describe("GET /api/risk-of-bias/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/risk-of-bias/rob-1"), {
      params: Promise.resolve({ id: "rob-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns assessment by ID on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const assessment = { id: "rob-1", tool: "rob2" };
    const chain = createMockChain({ data: assessment, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/risk-of-bias/rob-1"), {
      params: Promise.resolve({ id: "rob-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(assessment);
  });

  it("returns 404 when not found", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: {
        message:
          "JSON object requested, multiple (or no) rows returned: 0 rows",
      },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/risk-of-bias/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/risk-of-bias/[id]
// ---------------------------------------------------------------------------

describe("PATCH /api/risk-of-bias/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/risk-of-bias/rob-1", { overall_judgment: "high" }),
      { params: Promise.resolve({ id: "rob-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("updates assessment on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const updated = { id: "rob-1", overall_judgment: "high" };
    const chain = createMockChain({ data: updated, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/risk-of-bias/rob-1", { overall_judgment: "high" }),
      { params: Promise.resolve({ id: "rob-1" }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(updated);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const req = new NextRequest("http://localhost/api/risk-of-bias/rob-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await mod.PATCH(req, {
      params: Promise.resolve({ id: "rob-1" }),
    });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/risk-of-bias/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/risk-of-bias/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/risk-of-bias/rob-1"), {
      params: Promise.resolve({ id: "rob-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("deletes assessment on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({ data: null, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/risk-of-bias/rob-1"), {
      params: Promise.resolve({ id: "rob-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeNull();
  });

  it("returns 500 on delete error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Delete failed" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/risk-of-bias/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/risk-of-bias/rob-1"), {
      params: Promise.resolve({ id: "rob-1" }),
    });

    expect(res.status).toBe(500);
  });
});
