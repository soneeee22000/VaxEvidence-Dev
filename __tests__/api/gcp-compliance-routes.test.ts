import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Thenable mock chain (Supabase query builder is PromiseLike)
// ---------------------------------------------------------------------------
function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.then = (resolve: (val: unknown) => void) => resolve(resolveValue);
  return chain;
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockGetServerUser = vi.fn();
const mockGetSupabaseAdmin = vi.fn();
let protocolChain: ReturnType<typeof createMockChain>;
let gcpChain: ReturnType<typeof createMockChain>;

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: () => mockGetServerUser(),
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

describe("gcp-compliance API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    protocolChain = createMockChain({
      data: { user_id: VALID_UUID },
      error: null,
    });
    gcpChain = createMockChain({ data: null, error: null });

    mockGetServerUser.mockReset().mockResolvedValue({ id: VALID_UUID });
    mockGetSupabaseAdmin.mockReset().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "protocols") return protocolChain;
        if (table === "gcp_compliance") return gcpChain;
        return createMockChain({ data: null, error: null });
      }),
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/gcp-compliance
  // -----------------------------------------------------------------------
  describe("GET", () => {
    const importRoute = () =>
      import("@/app/api/gcp-compliance/route") as Promise<{
        GET: (req: NextRequest) => Promise<Response>;
      }>;

    it("returns 401 when not authenticated", async () => {
      mockGetServerUser.mockResolvedValue(null);
      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 when protocol_id is missing", async () => {
      const { GET } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance");

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("protocol_id");
    });

    it("returns 403 when user does not own protocol", async () => {
      protocolChain = createMockChain({
        data: { user_id: "other-user-id" },
        error: null,
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("returns 403 when protocol not found", async () => {
      protocolChain = createMockChain({ data: null, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("returns compliance data on success", async () => {
      const compliance = {
        id: "gcp-1",
        protocol_id: VALID_UUID,
        compliance_score: 85,
      };
      gcpChain = createMockChain({ data: compliance, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual(compliance);
    });

    it("returns null data when no compliance record exists (PGRST116)", async () => {
      gcpChain = createMockChain({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeNull();
    });

    it("returns 500 on non-PGRST116 error", async () => {
      gcpChain = createMockChain({
        data: null,
        error: { code: "OTHER", message: "DB error" },
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/gcp-compliance?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/gcp-compliance
  // -----------------------------------------------------------------------
  describe("POST", () => {
    const importRoute = () =>
      import("@/app/api/gcp-compliance/route") as Promise<{
        POST: (req: NextRequest) => Promise<Response>;
      }>;

    const validPayload = {
      protocol_id: VALID_UUID,
      principles: [{ principle_number: 1, status: "compliant" }],
      protocol_sections: [{ section_number: "6.1", status: "compliant" }],
      essential_documents: [{ document_id: "doc-1", status: "compliant" }],
      compliance_score: 90,
    };

    it("returns 401 when not authenticated", async () => {
      mockGetServerUser.mockResolvedValue(null);
      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid JSON", async () => {
      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Invalid JSON");
    });

    it("returns 400 on validation failure", async () => {
      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: JSON.stringify({ protocol_id: "bad" }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Validation failed");
    });

    it("returns 403 when user does not own protocol", async () => {
      protocolChain = createMockChain({
        data: { user_id: "other-user" },
        error: null,
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it("returns upserted data on success", async () => {
      const upserted = { id: "gcp-1", ...validPayload };
      gcpChain = createMockChain({ data: upserted, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual(upserted);
    });

    it("returns 500 on upsert error", async () => {
      gcpChain = createMockChain({
        data: null,
        error: { message: "Insert failed" },
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return gcpChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/gcp-compliance", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });
});
