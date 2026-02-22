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
let checklistChain: ReturnType<typeof createMockChain>;

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: () => mockGetServerUser(),
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

describe("reporting-checklist API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    protocolChain = createMockChain({
      data: { user_id: VALID_UUID },
      error: null,
    });
    checklistChain = createMockChain({ data: [], error: null });

    mockGetServerUser.mockReset().mockResolvedValue({ id: VALID_UUID });
    mockGetSupabaseAdmin.mockReset().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "protocols") return protocolChain;
        if (table === "reporting_checklists") return checklistChain;
        return createMockChain({ data: null, error: null });
      }),
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/reporting-checklist
  // -----------------------------------------------------------------------
  describe("GET", () => {
    const importRoute = () =>
      import("@/app/api/reporting-checklist/route") as Promise<{
        GET: (req: NextRequest) => Promise<Response>;
      }>;

    it("returns 401 when not authenticated", async () => {
      mockGetServerUser.mockResolvedValue(null);
      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/reporting-checklist?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 when protocol_id is missing", async () => {
      const { GET } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist");

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
          return checklistChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/reporting-checklist?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("returns 403 when protocol not found", async () => {
      protocolChain = createMockChain({ data: null, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return checklistChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/reporting-checklist?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("returns checklists on success", async () => {
      const checklists = [
        { id: "cl-1", checklist_type: "consort" },
        { id: "cl-2", checklist_type: "strobe" },
      ];
      checklistChain = createMockChain({ data: checklists, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return checklistChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/reporting-checklist?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual(checklists);
    });

    it("returns 500 on query error", async () => {
      checklistChain = createMockChain({
        data: null,
        error: { message: "DB error" },
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return checklistChain;
        }),
      });

      const { GET } = await importRoute();
      const req = new NextRequest(
        `http://localhost/api/reporting-checklist?protocol_id=${VALID_UUID}`,
      );

      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/reporting-checklist
  // -----------------------------------------------------------------------
  describe("POST", () => {
    const importRoute = () =>
      import("@/app/api/reporting-checklist/route") as Promise<{
        POST: (req: NextRequest) => Promise<Response>;
      }>;

    const validPayload = {
      protocol_id: VALID_UUID,
      checklist_type: "consort",
      items: [{ item_id: "1a", status: "complete" }],
      completion_pct: 100,
    };

    it("returns 401 when not authenticated", async () => {
      mockGetServerUser.mockResolvedValue(null);
      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid JSON", async () => {
      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
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
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
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
          return checklistChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it("returns upserted data on success", async () => {
      const upserted = { id: "cl-1", ...validPayload };
      checklistChain = createMockChain({ data: upserted, error: null });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return checklistChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
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
      checklistChain = createMockChain({
        data: null,
        error: { message: "Insert failed" },
      });
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "protocols") return protocolChain;
          return checklistChain;
        }),
      });

      const { POST } = await importRoute();
      const req = new NextRequest("http://localhost/api/reporting-checklist", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });
});
