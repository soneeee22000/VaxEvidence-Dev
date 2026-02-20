import { describe, it, expect } from "vitest";
import {
  picoOutputSchema,
  gapAnalysisSchema,
  searchQueriesSchema,
  paperRankingSchema,
  qualityScoreSchema,
} from "@/lib/ai/ai-validators";

// ---------------------------------------------------------------------------
// PICO Output Schema
// ---------------------------------------------------------------------------

describe("picoOutputSchema", () => {
  const validPico = {
    population: "Adults aged 65+ in the United States",
    intervention: "BNT162b2 two-dose primary series",
    comparator: "Unvaccinated age-matched controls",
    outcomes: "Symptomatic COVID-19 infection, hospitalization",
    design: "Test-negative case-control study",
    study_question: "What is the VE of BNT162b2 in elderly adults?",
    rationale: "Test-negative design is appropriate for RWE studies",
  };

  it("accepts valid PICO output", () => {
    const result = picoOutputSchema.safeParse(validPico);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { population, ...partial } = validPico;
    const result = picoOutputSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it("rejects non-string values", () => {
    const invalid = { ...validPico, population: 123 };
    const result = picoOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Gap Analysis Schema
// ---------------------------------------------------------------------------

describe("gapAnalysisSchema", () => {
  const validGap = {
    overall_assessment: "moderate" as const,
    coverage_score: 65,
    strengths: [
      {
        area: "Efficacy data",
        description: "Strong RCT evidence for primary series",
        supporting_evidence_count: 5,
      },
    ],
    gaps: [
      {
        area: "Pediatric data",
        description: "No evidence for children under 12",
        priority: "critical" as const,
        suggested_action: "Search for pediatric vaccine trials",
      },
    ],
    recommendation_summary: "Evidence base is moderate but needs safety data.",
  };

  it("accepts valid gap analysis output", () => {
    const result = gapAnalysisSchema.safeParse(validGap);
    expect(result.success).toBe(true);
  });

  it("rejects invalid overall_assessment enum", () => {
    const invalid = { ...validGap, overall_assessment: "excellent" };
    const result = gapAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects coverage_score outside 0-100", () => {
    const tooHigh = { ...validGap, coverage_score: 150 };
    expect(gapAnalysisSchema.safeParse(tooHigh).success).toBe(false);

    const tooLow = { ...validGap, coverage_score: -10 };
    expect(gapAnalysisSchema.safeParse(tooLow).success).toBe(false);
  });

  it("rejects invalid gap priority", () => {
    const invalid = {
      ...validGap,
      gaps: [{ ...validGap.gaps[0], priority: "urgent" }],
    };
    const result = gapAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts empty strengths and gaps arrays", () => {
    const empty = {
      ...validGap,
      strengths: [],
      gaps: [],
    };
    const result = gapAnalysisSchema.safeParse(empty);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Search Queries Schema
// ---------------------------------------------------------------------------

describe("searchQueriesSchema", () => {
  it("accepts valid search queries", () => {
    const result = searchQueriesSchema.safeParse({
      queries: ["COVID-19 vaccine elderly", "BNT162b2 effectiveness"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty queries array", () => {
    const result = searchQueriesSchema.safeParse({ queries: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 queries", () => {
    const result = searchQueriesSchema.safeParse({
      queries: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Paper Ranking Schema
// ---------------------------------------------------------------------------

describe("paperRankingSchema", () => {
  const validRanking = {
    ranked_papers: [
      {
        pmid: "12345678",
        relevance_score: 85,
        relevance_rationale: "Directly addresses PICO population and outcomes",
        pico_alignment: {
          population: true,
          intervention: true,
          comparator: false,
          outcomes: true,
        },
      },
    ],
  };

  it("accepts valid paper ranking", () => {
    const result = paperRankingSchema.safeParse(validRanking);
    expect(result.success).toBe(true);
  });

  it("rejects relevance_score outside 0-100", () => {
    const invalid = {
      ranked_papers: [
        { ...validRanking.ranked_papers[0], relevance_score: 150 },
      ],
    };
    const result = paperRankingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts empty ranked_papers array", () => {
    const result = paperRankingSchema.safeParse({ ranked_papers: [] });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Quality Score Schema
// ---------------------------------------------------------------------------

describe("qualityScoreSchema", () => {
  const validScore = {
    score: 4,
    grade: "B" as const,
    rationale: "Well-designed cohort study with large sample size",
    study_design_quality: "high" as const,
    risk_of_bias: "low" as const,
    strengths: ["Large sample size", "Validated outcomes"],
    limitations: ["Single-center study"],
  };

  it("accepts valid quality score", () => {
    const result = qualityScoreSchema.safeParse(validScore);
    expect(result.success).toBe(true);
  });

  it("rejects score outside 1-5", () => {
    const tooHigh = { ...validScore, score: 6 };
    expect(qualityScoreSchema.safeParse(tooHigh).success).toBe(false);

    const tooLow = { ...validScore, score: 0 };
    expect(qualityScoreSchema.safeParse(tooLow).success).toBe(false);
  });

  it("rejects invalid grade", () => {
    const invalid = { ...validScore, grade: "G" };
    expect(qualityScoreSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects non-integer score", () => {
    const decimal = { ...validScore, score: 3.5 };
    expect(qualityScoreSchema.safeParse(decimal).success).toBe(false);
  });

  it("rejects invalid risk_of_bias enum", () => {
    const invalid = { ...validScore, risk_of_bias: "medium" };
    expect(qualityScoreSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts empty strengths and limitations", () => {
    const empty = { ...validScore, strengths: [], limitations: [] };
    expect(qualityScoreSchema.safeParse(empty).success).toBe(true);
  });
});
