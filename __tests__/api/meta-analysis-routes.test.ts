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
  chain.insert = vi.fn(() => chain);
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
// GET /api/meta-analysis
// ---------------------------------------------------------------------------

describe("GET /api/meta-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when protocol_id is missing", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(makeGetRequest("/api/meta-analysis"));
    expect(res.status).toBe(400);
  });

  it("returns entries on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const entries = [{ id: "m-1", study_label: "Smith 2024" }];
    const chain = createMockChain({ data: entries, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(entries);
  });

  it("returns empty array when no entries exist", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({ data: [], error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "DB error" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/meta-analysis
// ---------------------------------------------------------------------------

describe("POST /api/meta-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/meta-analysis/route");
    const res = await POST(
      makePostRequest("/api/meta-analysis", {
        protocol_id: UUID_P,
        study_label: "Test",
        effect_size: 1.0,
        ci_lower: 0.5,
        ci_upper: 1.5,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates an entry on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const entry = { id: "m-1", study_label: "Smith 2024", effect_size: 0.85 };
    const chain = createMockChain({ data: entry, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { POST } = await import("@/app/api/meta-analysis/route");
    const res = await POST(
      makePostRequest("/api/meta-analysis", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        study_label: "Smith 2024",
        effect_size: 0.85,
        ci_lower: 0.72,
        ci_upper: 0.95,
        weight: 12.5,
        subgroup: "Adults",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(entry);
  });

  it("returns 500 on insert error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Insert failed" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const { POST } = await import("@/app/api/meta-analysis/route");
    const res = await POST(
      makePostRequest("/api/meta-analysis", {
        protocol_id: UUID_P,
        study_label: "Test",
        effect_size: 1.0,
        ci_lower: 0.5,
        ci_upper: 1.5,
      }),
    );

    expect(res.status).toBe(500);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/meta-analysis/route");
    const req = new NextRequest("http://localhost/api/meta-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/meta-analysis/[id]
// ---------------------------------------------------------------------------

describe("GET /api/meta-analysis/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns entry by ID on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const entry = { id: "m-1", study_label: "Smith 2024" };
    const chain = createMockChain({ data: entry, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(entry);
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

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/meta-analysis/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 500 on generic error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Connection lost" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/meta-analysis/[id]
// ---------------------------------------------------------------------------

describe("PATCH /api/meta-analysis/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/meta-analysis/m-1", { effect_size: 1.0 }),
      { params: Promise.resolve({ id: "m-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("updates entry on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const updated = { id: "m-1", effect_size: 1.0 };
    const chain = createMockChain({ data: updated, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/meta-analysis/m-1", { effect_size: 1.0 }),
      { params: Promise.resolve({ id: "m-1" }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(updated);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const req = new NextRequest("http://localhost/api/meta-analysis/m-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await mod.PATCH(req, {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 500 on update error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Update failed" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/meta-analysis/m-1", { effect_size: 1.0 }),
      { params: Promise.resolve({ id: "m-1" }) },
    );

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/meta-analysis/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/meta-analysis/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("deletes entry on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({ data: null, error: null });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeNull();
  });

  it("returns 500 on delete error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "FK violation" },
    });
    mockCreateServerSupabaseClient.mockResolvedValue({ from: () => chain });

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(500);
  });
});
