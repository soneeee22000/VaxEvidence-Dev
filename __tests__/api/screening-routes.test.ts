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
  // All methods return the chain itself (like Supabase's query builder).
  // The chain is thenable so `await chain` resolves with the data.
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
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
// GET /api/screening
// ---------------------------------------------------------------------------

describe("GET /api/screening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Unauthorized", status: 401 },
    });

    const { GET } = await import("@/app/api/screening/route");
    const res = await GET(
      makeGetRequest(`/api/screening?protocol_id=${UUID_P}`),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when protocol_id is missing", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { GET } = await import("@/app/api/screening/route");
    const res = await GET(makeGetRequest("/api/screening"));
    expect(res.status).toBe(400);
  });

  it("returns screening decisions on success", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const decisions = [
      { id: "d-1", stage: "identification", decision: "pending" },
    ];
    const chain = createMockChain({ data: decisions, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { GET } = await import("@/app/api/screening/route");
    const res = await GET(
      makeGetRequest(`/api/screening?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(decisions);
  });

  it("filters by stage when provided", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const chain = createMockChain({ data: [], error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { GET } = await import("@/app/api/screening/route");
    const res = await GET(
      makeGetRequest(`/api/screening?protocol_id=${UUID_P}&stage=eligibility`),
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

    const { GET } = await import("@/app/api/screening/route");
    const res = await GET(
      makeGetRequest(`/api/screening?protocol_id=${UUID_P}`),
    );

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/screening (single upsert)
// ---------------------------------------------------------------------------

describe("POST /api/screening (single upsert)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Unauthorized", status: 401 },
    });

    const { POST } = await import("@/app/api/screening/route");
    const res = await POST(
      makePostRequest("/api/screening", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification",
        decision: "include",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("upserts a single screening decision on success", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const decision = { id: "d-1", decision: "include" };
    const chain = createMockChain({ data: decision, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/screening/route");
    const res = await POST(
      makePostRequest("/api/screening", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification",
        decision: "include",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(decision);
  });

  it("returns 500 on upsert database error", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const chain = createMockChain({
      data: null,
      error: { message: "Upsert failed" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/screening/route");
    const res = await POST(
      makePostRequest("/api/screening", {
        protocol_id: UUID_P,
        evidence_id: UUID_E,
        stage: "identification",
        decision: "include",
      }),
    );

    expect(res.status).toBe(500);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/screening/route");
    const req = new NextRequest("http://localhost/api/screening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/screening (batch init)
// ---------------------------------------------------------------------------

describe("POST /api/screening (batch init)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("batch-initializes decisions for multiple evidence IDs", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    const evidenceIds = [UUID_E, "770e8400-e29b-41d4-a716-446655440002"];
    const batchResult = [
      { id: "d-1", decision: "pending" },
      { id: "d-2", decision: "pending" },
    ];
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        evidence_items: [
          { data: evidenceIds.map((id) => ({ id })), error: null },
        ],
        screening_decisions: [{ data: batchResult, error: null }],
      }),
    );

    const { POST } = await import("@/app/api/screening/route");
    const res = await POST(
      makePostRequest("/api/screening", {
        protocol_id: UUID_P,
        evidence_ids: evidenceIds,
        stage: "identification",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(batchResult);
  });

  it("returns 500 on batch database error", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        evidence_items: [{ data: [{ id: UUID_E }], error: null }],
        screening_decisions: [
          { data: null, error: { message: "Batch failed" } },
        ],
      }),
    );

    const { POST } = await import("@/app/api/screening/route");
    const res = await POST(
      makePostRequest("/api/screening", {
        protocol_id: UUID_P,
        evidence_ids: [UUID_E],
      }),
    );

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/screening/[id]
// ---------------------------------------------------------------------------

describe("GET /api/screening/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns decision by ID on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const decision = {
      id: "d-1",
      stage: "identification",
      protocol_id: UUID_P,
    };
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        screening_decisions: [{ data: decision, error: null }],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(decision);
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

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/screening/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 500 on generic database error", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const chain = createMockChain({
      data: null,
      error: { message: "Connection refused" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.GET(makeGetRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
    });

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/screening/[id]
// ---------------------------------------------------------------------------

describe("PATCH /api/screening/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/screening/d-1", { decision: "exclude" }),
      { params: Promise.resolve({ id: "d-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("updates a decision on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    const updated = { id: "d-1", decision: "exclude" };
    // PATCH sequence: screening_decisions (existence) -> protocols (ownership)
    //                 -> screening_decisions (update)
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        screening_decisions: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: updated, error: null },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.PATCH(
      makePatchRequest("/api/screening/d-1", {
        decision: "exclude",
        exclusion_reason: "Wrong population",
      }),
      { params: Promise.resolve({ id: "d-1" }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(updated);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const mod = await import("@/app/api/screening/[id]/route");
    const req = new NextRequest("http://localhost/api/screening/d-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await mod.PATCH(req, {
      params: Promise.resolve({ id: "d-1" }),
    });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/screening/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/screening/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("deletes a decision on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    // DELETE sequence: screening_decisions (existence) -> protocols (ownership)
    //                  -> screening_decisions (delete)
    mockGetSupabaseAdmin.mockReturnValue(
      createMockAdmin({
        screening_decisions: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: null, error: null },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
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
        screening_decisions: [
          { data: { protocol_id: UUID_P }, error: null },
          { data: null, error: { message: "Delete failed" } },
        ],
        protocols: [{ data: { user_id: "u-1" }, error: null }],
      }),
    );

    const mod = await import("@/app/api/screening/[id]/route");
    const res = await mod.DELETE(makeDeleteRequest("/api/screening/d-1"), {
      params: Promise.resolve({ id: "d-1" }),
    });

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/screening/duplicates
// ---------------------------------------------------------------------------

describe("POST /api/screening/duplicates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Unauthorized", status: 401 },
    });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const res = await POST(
      makePostRequest("/api/screening/duplicates", { protocol_id: UUID_P }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when protocol_id is missing", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const res = await POST(makePostRequest("/api/screening/duplicates", {}));
    expect(res.status).toBe(400);
  });

  it("returns duplicate groups on success", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });

    const decisions = [
      {
        id: "d-1",
        evidence_items: {
          id: "e-1",
          title: "Study A",
          type: "academic",
          authors: null,
          doi: "10.1038/xyz",
          external_id: null,
          external_source: null,
          description: null,
          tags: null,
        },
      },
      {
        id: "d-2",
        evidence_items: {
          id: "e-2",
          title: "Study B",
          type: "academic",
          authors: null,
          doi: "10.1038/xyz",
          external_id: null,
          external_source: null,
          description: null,
          tags: null,
        },
      },
    ];
    const chain = createMockChain({ data: decisions, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const res = await POST(
      makePostRequest("/api/screening/duplicates", { protocol_id: UUID_P }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].matchType).toBe("doi");
  });

  it("returns empty groups when no duplicates found", async () => {
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });

    const decisions = [
      {
        id: "d-1",
        evidence_items: {
          id: "e-1",
          title: "Unique Study Alpha",
          type: "academic",
          authors: null,
          doi: null,
          external_id: null,
          external_source: null,
          description: null,
          tags: null,
        },
      },
    ];
    const chain = createMockChain({ data: decisions, error: null });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const res = await POST(
      makePostRequest("/api/screening/duplicates", { protocol_id: UUID_P }),
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
      error: { message: "Query failed" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const res = await POST(
      makePostRequest("/api/screening/duplicates", { protocol_id: UUID_P }),
    );

    expect(res.status).toBe(500);
  });

  it("returns 400 on invalid JSON body", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/screening/duplicates/route");
    const req = new NextRequest("http://localhost/api/screening/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
