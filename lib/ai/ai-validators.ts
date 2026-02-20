import { z } from "zod";

// =============================================================================
// AI OUTPUT SCHEMAS
// =============================================================================
// Zod schemas for structured AI outputs via generateObject().
// Each schema defines the contract between the LLM and the application.
// =============================================================================

/**
 * PICO Auto-Generator output schema.
 * Used by POST /api/ai/pico to generate structured protocol fields.
 */
export const picoOutputSchema = z.object({
  population: z
    .string()
    .describe("Target patient population with inclusion/exclusion criteria"),
  intervention: z.string().describe("Vaccine or intervention being studied"),
  comparator: z.string().describe("Comparator group or control condition"),
  outcomes: z.string().describe("Primary and secondary outcomes to measure"),
  design: z.string().describe("Recommended study design with justification"),
  study_question: z.string().describe("Full PICO-formatted research question"),
  rationale: z.string().describe("Brief explanation of design choices"),
});

export type PicoOutput = z.infer<typeof picoOutputSchema>;

/**
 * Evidence Gap Analysis output schema.
 * Used by POST /api/ai/gap-analysis.
 */
export const gapAnalysisSchema = z.object({
  overall_assessment: z.enum(["strong", "moderate", "weak", "insufficient"]),
  coverage_score: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100 evidence coverage score"),
  strengths: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      supporting_evidence_count: z.number().int(),
    }),
  ),
  gaps: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      priority: z.enum(["critical", "important", "minor"]),
      suggested_action: z.string(),
    }),
  ),
  recommendation_summary: z.string(),
});

export type GapAnalysis = z.infer<typeof gapAnalysisSchema>;

/**
 * Smart Paper Recommendations output schema.
 * Used by POST /api/ai/recommendations for ranking PubMed results.
 */
export const searchQueriesSchema = z.object({
  queries: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Optimized PubMed search query strings"),
});

export type SearchQueries = z.infer<typeof searchQueriesSchema>;

export const paperRankingSchema = z.object({
  ranked_papers: z.array(
    z.object({
      pmid: z.string(),
      relevance_score: z.number().min(0).max(100),
      relevance_rationale: z.string(),
      pico_alignment: z.object({
        population: z.boolean(),
        intervention: z.boolean(),
        comparator: z.boolean(),
        outcomes: z.boolean(),
      }),
    }),
  ),
});

export type PaperRanking = z.infer<typeof paperRankingSchema>;

/**
 * Evidence Quality Scoring output schema.
 * Uses Oxford Centre for Evidence-Based Medicine (CEBM) framework.
 */
export const qualityScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
  grade: z.enum(["A", "B", "C", "D", "F"]).describe("CEBM evidence grade"),
  rationale: z.string().describe("Explanation of quality assessment"),
  study_design_quality: z.enum(["high", "moderate", "low"]),
  risk_of_bias: z.enum(["low", "unclear", "high"]),
  strengths: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type QualityScore = z.infer<typeof qualityScoreSchema>;
