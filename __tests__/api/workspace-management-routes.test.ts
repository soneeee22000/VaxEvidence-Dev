import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before route imports
// ---------------------------------------------------------------------------

const mockGetServerUser = vi.fn();
const mockGetSupabaseAdmin = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: (...args: unknown[]) => mockGetServerUser(...args),
  getSupabaseAdmin: (...args: unknown[]) => mockGetSupabaseAdmin(...args),
}));

vi.mock("@/lib/api/api-key-utils", () => ({
  generateApiKey: () => "vxe_mock_generated_key_0123456789abcdef0123",
  hashApiKey: () => "mockhash_0123456789abcdef",
  getKeyPrefix: () => "mock_gen",
}));

vi.mock("@/lib/api/webhook-dispatcher", () => ({
  generateWebhookSecret: () => "whsec_mock_secret_0123456789abcdef",
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = "ws-001";
const USER_ID = "u-001";
const KEY_ID = "key-001";
const WEBHOOK_ID = "wh-001";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a chainable mock that mimics the Supabase query builder.
 * All chained method calls return the proxy; awaiting resolves to `resolvedValue`.
 */
function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.then = (resolve: (val: unknown) => void) => resolve(resolvedValue);
  return chain;
}

function makeGetRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "GET",
  });
}

function makePostRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "DELETE",
  });
}

/**
 * Build a mock Supabase client where `.from()` returns different chains
 * depending on the table name. Handles sequential calls for routes that
 * query multiple tables (e.g., membership check then data query).
 */
function buildMockSupabase(
  tableChains: Record<string, ReturnType<typeof createMockChain>>,
) {
  return {
    from: vi.fn(
      (table: string) =>
        tableChains[table] ?? createMockChain({ data: null, error: null }),
    ),
  };
}

// ===========================================================================
// API Keys — GET /api/workspaces/[id]/api-keys
// ===========================================================================

describe("GET /api/workspaces/[id]/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { GET } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not a workspace member", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: null,
      error: { message: "No rows" },
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns list of active API keys on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const keys = [
      {
        id: KEY_ID,
        workspace_id: WORKSPACE_ID,
        name: "CI Pipeline Key",
        key_prefix: "abcdefgh",
        scopes: ["read", "write"],
        is_revoked: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    // The route calls .from("workspace_members") then .from("api_keys") sequentially
    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const keysChain = createMockChain({ data: keys, error: null });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      api_keys: keysChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("CI Pipeline Key");
  });

  it("returns empty array when no active keys exist", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const keysChain = createMockChain({ data: [], error: null });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      api_keys: keysChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });
});

// ===========================================================================
// API Keys — POST /api/workspaces/[id]/api-keys
// ===========================================================================

describe("POST /api/workspaces/[id]/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`, {
        name: "Test Key",
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(401);
  });

  it("creates an API key and returns the raw key exactly once", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const createdRecord = {
      id: KEY_ID,
      workspace_id: WORKSPACE_ID,
      user_id: USER_ID,
      name: "Deploy Key",
      key_prefix: "mock_gen",
      scopes: ["read"],
      rate_limit_tier: "free",
      is_revoked: false,
      created_at: "2026-02-22T00:00:00Z",
    };

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const insertChain = createMockChain({
      data: createdRecord,
      error: null,
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      api_keys: insertChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`, {
        name: "Deploy Key",
        scopes: ["read"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.name).toBe("Deploy Key");
    expect(json.data.raw_key).toBeDefined();
    expect(json.data.raw_key).toContain("vxe_");
  });

  it("returns 403 when user has insufficient role (member)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: { role: "member" },
      error: null,
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`, {
        name: "Unauthorized Key",
        scopes: ["read"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Insufficient role");
  });

  it("returns 422 on validation failure (missing name)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const { POST } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys`, {}),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 on invalid JSON body", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const { POST } = await import("@/app/api/workspaces/[id]/api-keys/route");
    const req = new NextRequest(
      new URL(
        `/api/workspaces/${WORKSPACE_ID}/api-keys`,
        "http://localhost:3000",
      ),
      {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: WORKSPACE_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON payload");
  });
});

// ===========================================================================
// API Keys — DELETE /api/workspaces/[id]/api-keys/[keyId]
// ===========================================================================

describe("DELETE /api/workspaces/[id]/api-keys/[keyId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { DELETE } =
      await import("@/app/api/workspaces/[id]/api-keys/[keyId]/route");
    const res = await DELETE(
      makeDeleteRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys/${KEY_ID}`),
      { params: Promise.resolve({ id: WORKSPACE_ID, keyId: KEY_ID }) },
    );

    expect(res.status).toBe(401);
  });

  it("revokes an API key on success (soft delete)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const revokeChain = createMockChain({ data: null, error: null });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      api_keys: revokeChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { DELETE } =
      await import("@/app/api/workspaces/[id]/api-keys/[keyId]/route");
    const res = await DELETE(
      makeDeleteRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys/${KEY_ID}`),
      { params: Promise.resolve({ id: WORKSPACE_ID, keyId: KEY_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.revoked).toBe(true);
  });

  it("returns 403 when user is not a workspace member", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: null,
      error: { message: "No rows" },
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { DELETE } =
      await import("@/app/api/workspaces/[id]/api-keys/[keyId]/route");
    const res = await DELETE(
      makeDeleteRequest(`/api/workspaces/${WORKSPACE_ID}/api-keys/${KEY_ID}`),
      { params: Promise.resolve({ id: WORKSPACE_ID, keyId: KEY_ID }) },
    );

    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// Webhooks — GET /api/workspaces/[id]/webhooks
// ===========================================================================

describe("GET /api/workspaces/[id]/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { GET } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not a workspace member", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: null,
      error: { message: "No rows" },
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns list of webhooks on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const webhooks = [
      {
        id: WEBHOOK_ID,
        workspace_id: WORKSPACE_ID,
        url: "https://example.com/webhook",
        events: ["protocol.created"],
        is_active: true,
        description: "CI notification",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const webhooksChain = createMockChain({ data: webhooks, error: null });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      webhooks: webhooksChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { GET } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await GET(
      makeGetRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].url).toBe("https://example.com/webhook");
  });
});

// ===========================================================================
// Webhooks — POST /api/workspaces/[id]/webhooks
// ===========================================================================

describe("POST /api/workspaces/[id]/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        url: "https://example.com/hook",
        events: ["protocol.created"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(401);
  });

  it("creates a webhook with auto-generated secret on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const createdRecord = {
      id: WEBHOOK_ID,
      workspace_id: WORKSPACE_ID,
      url: "https://example.com/hook",
      events: ["protocol.created", "evidence.created"],
      is_active: true,
      description: null,
      created_at: "2026-02-22T00:00:00Z",
      updated_at: "2026-02-22T00:00:00Z",
    };

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const insertChain = createMockChain({
      data: createdRecord,
      error: null,
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      webhooks: insertChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        url: "https://example.com/hook",
        events: ["protocol.created", "evidence.created"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.url).toBe("https://example.com/hook");
    expect(json.data.secret).toBeDefined();
    expect(json.data.secret).toContain("whsec_");
  });

  it("returns 403 when user has insufficient role (member)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: { role: "member" },
      error: null,
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        url: "https://example.com/hook",
        events: ["protocol.created"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Insufficient role");
  });

  it("returns 422 on validation failure (missing url)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        events: ["protocol.created"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 422 on validation failure (no events array)", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        url: "https://example.com/hook",
        events: [],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 on invalid JSON body", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const req = new NextRequest(
      new URL(
        `/api/workspaces/${WORKSPACE_ID}/webhooks`,
        "http://localhost:3000",
      ),
      {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: WORKSPACE_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON payload");
  });

  it("returns 500 on insert database error", async () => {
    mockGetServerUser.mockResolvedValue({ id: USER_ID });

    const membershipChain = createMockChain({
      data: { role: "admin" },
      error: null,
    });
    const insertChain = createMockChain({
      data: null,
      error: { message: "Insert failed" },
    });
    const supabase = buildMockSupabase({
      workspace_members: membershipChain,
      webhooks: insertChain,
    });
    mockGetSupabaseAdmin.mockReturnValue(supabase);

    const { POST } = await import("@/app/api/workspaces/[id]/webhooks/route");
    const res = await POST(
      makePostRequest(`/api/workspaces/${WORKSPACE_ID}/webhooks`, {
        url: "https://example.com/hook",
        events: ["protocol.created"],
      }),
      { params: Promise.resolve({ id: WORKSPACE_ID }) },
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Insert failed");
  });
});
