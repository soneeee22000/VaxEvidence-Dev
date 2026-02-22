import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetServerUser = vi.fn();
const mockGetSupabaseAdmin = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: () => mockGetServerUser(),
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

const mockGenerateObject = vi.fn();
const mockStreamText = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock("@/lib/ai/ai-client", () => ({
  aiModel: "gpt-4o-mock",
}));

const mockVerifyProtocolOwnership = vi.fn();
vi.mock("@/lib/api/verify-protocol-ownership", () => ({
  verifyProtocolOwnership: (...args: unknown[]) =>
    mockVerifyProtocolOwnership(...args),
}));

vi.mock("@/lib/api/pubmed", () => ({
  searchPubMed: vi.fn().mockResolvedValue(["11111111", "22222222"]),
  fetchPubMedSummaries: vi.fn().mockResolvedValue([
    {
      pmid: "11111111",
      title: "Test Study",
      authors: ["Author A"],
      journal: "Test Journal",
      pubDate: "2024",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/11111111/",
    },
  ]),
  fetchPubMedAbstract: vi.fn().mockResolvedValue("Test abstract text"),
}));

// ---------------------------------------------------------------------------
// Helper: create a mock Supabase chain
// ---------------------------------------------------------------------------

function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    update: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolveValue),
  };
  return chain;
}

function makeRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/ai/pico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ai/pico/route");
    const res = await POST(
      makeRequest("/api/ai/pico", {
        research_question: "What is COVID-19 VE in elderly?",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 422 when research_question is too short", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/ai/pico/route");
    const res = await POST(
      makeRequest("/api/ai/pico", { research_question: "short" }),
    );

    expect(res.status).toBe(422);
  });

  it("returns structured PICO on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const picoResult = {
      population: "Adults 65+",
      intervention: "BNT162b2",
      comparator: "Unvaccinated",
      outcomes: "COVID-19 infection",
      design: "Test-negative",
      study_question: "What is VE of BNT162b2?",
      rationale: "Appropriate for RWE",
    };

    mockGenerateObject.mockResolvedValue({ object: picoResult });

    const { POST } = await import("@/app/api/ai/pico/route");
    const res = await POST(
      makeRequest("/api/ai/pico", {
        research_question: "What is the effectiveness of COVID-19 vaccines?",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(picoResult);
  });

  it("returns 500 when AI generation fails", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    mockGenerateObject.mockRejectedValue(new Error("OpenAI rate limit"));

    const { POST } = await import("@/app/api/ai/pico/route");
    const res = await POST(
      makeRequest("/api/ai/pico", {
        research_question: "What is the effectiveness of COVID-19 vaccines?",
      }),
    );

    expect(res.status).toBe(500);
  });
});

describe("POST /api/ai/gap-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ai/gap-analysis/route");
    const res = await POST(
      makeRequest("/api/ai/gap-analysis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 422 when protocol_id is not a UUID", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const { POST } = await import("@/app/api/ai/gap-analysis/route");
    const res = await POST(
      makeRequest("/api/ai/gap-analysis", { protocol_id: "not-a-uuid" }),
    );

    expect(res.status).toBe(422);
  });

  it("returns 404 when protocol not found", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Protocol not found", status: 404 },
    });

    const { POST } = await import("@/app/api/ai/gap-analysis/route");
    const res = await POST(
      makeRequest("/api/ai/gap-analysis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("returns gap analysis on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });

    const protocolChain = createMockChain({
      data: {
        title: "Test",
        study_question: "Test?",
        population: "Adults",
        intervention: "Vaccine",
        comparator: "Placebo",
        outcomes: "Infection",
        design: "RCT",
      },
      error: null,
    });
    const linksChain = createMockChain({ data: [], error: null });

    mockGetSupabaseAdmin.mockReturnValue({
      from: (table: string) => {
        if (table === "protocols") return protocolChain;
        return linksChain;
      },
    });

    const gapResult = {
      overall_assessment: "moderate",
      coverage_score: 60,
      strengths: [],
      gaps: [],
      recommendation_summary: "Needs more evidence",
    };

    mockGenerateObject.mockResolvedValue({ object: gapResult });

    const { POST } = await import("@/app/api/ai/gap-analysis/route");
    const res = await POST(
      makeRequest("/api/ai/gap-analysis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.overall_assessment).toBe("moderate");
  });
});

describe("POST /api/ai/quality-score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ai/quality-score/route");
    const res = await POST(
      makeRequest("/api/ai/quality-score", {
        evidence_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when evidence not found", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const chain = createMockChain({
      data: null,
      error: { message: "Not found" },
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: () => chain });

    const { POST } = await import("@/app/api/ai/quality-score/route");
    const res = await POST(
      makeRequest("/api/ai/quality-score", {
        evidence_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("returns quality score and saves to DB on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });

    const evidenceData = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "academic",
      title: "Test Study",
      description: "Abstract text",
      authors: "Author A",
      journal: "Test Journal",
      tags: ["COVID-19"],
    };

    const selectChain = createMockChain({ data: evidenceData, error: null });
    const updateChain = createMockChain({ data: null, error: null });

    let callCount = 0;
    mockGetSupabaseAdmin.mockReturnValue({
      from: () => {
        callCount++;
        if (callCount === 1) return selectChain;
        return updateChain;
      },
    });

    const scoreResult = {
      score: 4,
      grade: "B",
      rationale: "Well-designed study",
      study_design_quality: "high",
      risk_of_bias: "low",
      strengths: ["Large sample"],
      limitations: ["Single center"],
    };

    mockGenerateObject.mockResolvedValue({ object: scoreResult });

    const { POST } = await import("@/app/api/ai/quality-score/route");
    const res = await POST(
      makeRequest("/api/ai/quality-score", {
        evidence_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.score).toBe(4);
    expect(json.data.grade).toBe("B");
  });
});

describe("POST /api/ai/synthesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerUser.mockResolvedValue(null);

    const { POST } = await import("@/app/api/ai/synthesis/route");
    const res = await POST(
      makeRequest("/api/ai/synthesis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when protocol not found", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: null,
      error: { message: "Protocol not found", status: 404 },
    });

    const { POST } = await import("@/app/api/ai/synthesis/route");
    const res = await POST(
      makeRequest("/api/ai/synthesis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("returns streaming response on success", async () => {
    mockGetServerUser.mockResolvedValue({ id: "u-1" });
    mockVerifyProtocolOwnership.mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    });

    const protocolChain = createMockChain({
      data: {
        title: "Test",
        study_question: "Test?",
        population: "Adults",
        intervention: "Vaccine",
        comparator: "Placebo",
        outcomes: "Infection",
        design: "RCT",
      },
      error: null,
    });
    const linksChain = createMockChain({ data: [], error: null });

    let callCount = 0;
    mockGetSupabaseAdmin.mockReturnValue({
      from: (table: string) => {
        callCount++;
        if (table === "protocols") return protocolChain;
        return linksChain;
      },
    });

    const mockResponse = new Response("streaming content");
    mockStreamText.mockReturnValue({
      toTextStreamResponse: () => mockResponse,
    });

    const { POST } = await import("@/app/api/ai/synthesis/route");
    const res = await POST(
      makeRequest("/api/ai/synthesis", {
        protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(res).toBe(mockResponse);
  });
});
