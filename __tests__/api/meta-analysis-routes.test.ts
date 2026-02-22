import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetServerUser = vi.fn();
const mockGetSupabaseAdmin = vi.fn();
const mockVerifyProtocolOwnership = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: () => mockGetServerUser(),
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

vi.mock("@/lib/api/verify-protocol-ownership", () => ({
  verifyProtocolOwnership: (...args: unknown[]) =>
    mockVerifyProtocolOwnership(...args),
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

/**
 * Creates a mock Supabase admin client that routes `.from(table)` calls to
 * different chain responses per table. Supports multiple sequential calls to
 * the same table — each call consumes the next entry in the array.
 */
function createMockAdmin(
  tableChains: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const callCounts: Record<string, number> = {};
  return {
    from: (table: string) => {
      callCounts[table] = (callCounts[table] ?? 0) + 1;
      const chains = tableChains[table] ?? [{ data: null, error: null }];
      const idx = Math.min(callCounts[table] - 1, chains.length - 1);
      return createMockChain(chains[idx]);
    },
  };
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
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Unauthorized", status: 401 },
    });

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
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const entries = [{ id: "m-1", study_label: "Smith 2024" }];
    const chain = createMockChain({ data: entries, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(entries);
  });

  it("returns empty array when no entries exist", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const chain = createMockChain({ data: [], error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { GET } = await import("@/app/api/meta-analysis/route");
    const res = await GET(
      makeGetRequest(`/api/meta-analysis?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const chain = createMockChain({
      data: null,
      error: { message: "DB error" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

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
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Unauthorized", status: 401 },
    });

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
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const entry = { id: "m-1", study_label: "Smith 2024", effect_size: 0.85 };
    const chain = createMockChain({ data: entry, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

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
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const chain = createMockChain({
      data: null,
      error: { message: "Insert failed" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

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
    const entry = { id: "m-1", study_label: "Smith 2024", protocol_id: UUID_P };
    // GET sequence: meta_analysis_entries (select) -> protocols (ownership)
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        meta_analysis_entries: [{ data: entry, error: null }],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

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
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

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
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

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
    // PATCH sequence: meta_analysis_entries (existence) -> protocols (ownership)
    //                 -> meta_analysis_entries (update)
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        meta_analysis_entries: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: updated, error: null },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

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
    // PATCH sequence: existence check passes, ownership passes, update fails
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        meta_analysis_entries: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: null, error: { message: "Update failed" } },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

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
    // DELETE sequence: meta_analysis_entries (existence) -> protocols (ownership)
    //                  -> meta_analysis_entries (delete)
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        meta_analysis_entries: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: null, error: null },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

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
    // DELETE sequence: existence check passes, ownership passes, delete fails
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        meta_analysis_entries: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: null, error: { message: "FK violation" } },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

    const mod = await import("@/app/api/meta-analysis/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/meta-analysis/m-1"), {
      params: Promise.resolve({ id: "m-1" }),
    });

    expect(res.status).toBe(500);
  });
});
