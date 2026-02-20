import type { ProtocolRecord } from "@/lib/supabase/protocols";
import type { EvidenceItem } from "@/lib/validators/evidence";
import type { PubMedArticle } from "@/lib/api/pubmed";

// =============================================================================
// AI PROMPT BUILDERS
// =============================================================================
// Pure functions that construct prompts for AI features.
// Fully testable with no side effects.
// =============================================================================

/** Maximum number of evidence items included in synthesis prompts. */
export const MAX_EVIDENCE_IN_PROMPT = 20;

/** Maximum abstract length per evidence item in prompts. */
export const MAX_ABSTRACT_LENGTH = 500;

/** Maximum abstract length per article in ranking prompts. */
export const MAX_ARTICLE_ABSTRACT_LENGTH = 400;

/**
 * System prompt shared across all AI features.
 * Establishes the AI as a vaccine research specialist.
 */
export const VACCINE_RESEARCH_SYSTEM_PROMPT = `You are an expert vaccine research scientist and epidemiologist specializing in Real-World Evidence (RWE) studies. You assist researchers in designing FDA/EMA-compliant study protocols following the PICO methodology (Population, Intervention, Comparator, Outcomes).

Your outputs must be:
- Scientifically rigorous and epidemiologically sound
- Consistent with ICH E9, STROBE, and CONSORT guidelines where applicable
- Specific and actionable, not generic
- Formatted for regulatory review readiness

Domain context: You work with vaccine effectiveness studies, safety surveillance, immunogenicity assessments, and post-marketing observational studies.`;

type ProtocolFields = Pick<
  ProtocolRecord,
  | "title"
  | "study_question"
  | "population"
  | "intervention"
  | "comparator"
  | "outcomes"
  | "design"
>;

/**
 * Build prompt for PICO Auto-Generator.
 * Input: free-text research question.
 * Output: structured PICO fields via generateObject().
 */
export function buildPicoPrompt(researchQuestion: string): string {
  return `Generate a complete PICO framework for the following vaccine research question.

Research Question: ${researchQuestion}

Requirements:
- Population: Define the target population with specific inclusion criteria (age, health status, geography)
- Intervention: Specify the vaccine product, dosing schedule, and administration route
- Comparator: Define the control group (unvaccinated, alternative vaccine, placebo)
- Outcomes: List primary and secondary endpoints with measurement methods
- Design: Recommend an appropriate study design (e.g., retrospective cohort, test-negative case-control)
- Study Question: Rewrite as a formal PICO-structured research question

Be specific to vaccine research. Avoid generic placeholders.`;
}

/**
 * Build prompt for Evidence Synthesis (streaming literature review).
 * Caps evidence at MAX_EVIDENCE_IN_PROMPT items to control token usage.
 */
export function buildSynthesisPrompt(
  protocol: ProtocolFields,
  evidence: EvidenceItem[],
): string {
  const capped = evidence.slice(0, MAX_EVIDENCE_IN_PROMPT);
  const evidenceSummaries = capped
    .map(
      (e, i) =>
        `[${i + 1}] ${e.type.toUpperCase()}: "${e.title}"
Authors: ${e.authors ?? "N/A"} | Journal: ${e.journal ?? "N/A"}
Abstract: ${e.description.slice(0, MAX_ABSTRACT_LENGTH)}`,
    )
    .join("\n\n");

  return `Generate a structured literature review for the following vaccine research protocol.

## Protocol
Title: ${protocol.title}
Research Question: ${protocol.study_question}
Population: ${protocol.population}
Intervention: ${protocol.intervention || "Not specified"}
Comparator: ${protocol.comparator}
Outcomes: ${protocol.outcomes}
Study Design: ${protocol.design}

## Linked Evidence (${evidence.length} item${evidence.length !== 1 ? "s" : ""})
${evidenceSummaries}

Write a structured literature review in markdown with sections:
1. **Background** — Context for the research question
2. **Current Evidence** — Summary of linked evidence, citing by number [1], [2], etc.
3. **Evidence Synthesis** — Patterns, agreements, and contradictions across studies
4. **Research Gaps** — What the current evidence does not address

Be concise but scientifically precise. Use formal academic tone.`;
}

/**
 * Build prompt for Evidence Gap Analysis.
 */
export function buildGapAnalysisPrompt(
  protocol: ProtocolFields,
  evidence: EvidenceItem[],
): string {
  const evidenceSummary = evidence
    .map(
      (e) =>
        `- [${e.type}] "${e.title}" | Tags: ${e.tags.join(", ") || "none"}`,
    )
    .join("\n");

  return `Analyze the evidence coverage for this vaccine research protocol.

## Protocol PICO
- Population: ${protocol.population}
- Intervention: ${protocol.intervention || "Not specified"}
- Comparator: ${protocol.comparator}
- Outcomes: ${protocol.outcomes}
- Design: ${protocol.design}

## Linked Evidence (${evidence.length} item${evidence.length !== 1 ? "s" : ""})
${evidenceSummary}

Evaluate:
1. Does the evidence adequately cover each PICO element?
2. Are there study design gaps (e.g., only observational, no RCTs)?
3. Are there population gaps (e.g., no pediatric data, no immunocompromised)?
4. Are there outcome gaps (e.g., efficacy but no safety data)?
5. What specific searches or studies would strengthen the evidence base?

Provide specific, actionable recommendations.`;
}

/**
 * Build prompt for generating optimized PubMed search queries from PICO.
 */
export function buildSearchQueryPrompt(
  protocol: Pick<
    ProtocolRecord,
    "population" | "intervention" | "comparator" | "outcomes"
  >,
): string {
  return `Generate 3 optimized PubMed search queries for this vaccine research protocol.

PICO:
- Population: ${protocol.population}
- Intervention: ${protocol.intervention || "Not specified"}
- Comparator: ${protocol.comparator}
- Outcomes: ${protocol.outcomes}

Requirements:
- Query 1: Broad search capturing the overall research area
- Query 2: Specific search targeting the exact PICO combination
- Query 3: Focused on safety/adverse event outcomes

Use PubMed syntax: MeSH terms where appropriate, Boolean operators (AND, OR), field tags ([tiab], [mesh]). Keep queries under 200 characters each.`;
}

/**
 * Build prompt for ranking PubMed articles by PICO relevance.
 */
export function buildRankingPrompt(
  protocol: Pick<
    ProtocolRecord,
    "population" | "intervention" | "comparator" | "outcomes"
  >,
  articles: PubMedArticle[],
): string {
  const articlesText = articles
    .map(
      (a) =>
        `PMID: ${a.pmid}
Title: ${a.title}
Authors: ${a.authors.join(", ")}
Journal: ${a.journal}
Abstract: ${a.abstract?.slice(0, MAX_ARTICLE_ABSTRACT_LENGTH) ?? "No abstract available"}`,
    )
    .join("\n\n");

  return `Rank these papers by relevance to the protocol PICO framework.

## Protocol PICO
- Population: ${protocol.population}
- Intervention: ${protocol.intervention || "Not specified"}
- Comparator: ${protocol.comparator}
- Outcomes: ${protocol.outcomes}

## Papers to Rank (${articles.length})
${articlesText}

For each paper, assess:
- Overall relevance score (0-100)
- Which PICO elements are addressed (population, intervention, comparator, outcomes)
- Brief rationale for the relevance score

Only include papers that actually appear in the list above.`;
}

/**
 * Build prompt for evidence quality scoring.
 * Uses Oxford Centre for Evidence-Based Medicine (CEBM) framework.
 */
export function buildQualityScorePrompt(evidence: EvidenceItem): string {
  return `Assess the methodological quality of this evidence item using the Oxford Centre for Evidence-Based Medicine (CEBM) framework.

Evidence Details:
- Type: ${evidence.type}
- Title: ${evidence.title}
- Authors: ${evidence.authors ?? "Unknown"}
- Journal: ${evidence.journal ?? "Unknown"}
- Description/Abstract: ${evidence.description}
- Tags: ${evidence.tags.join(", ") || "none"}

Evaluate:
1. Study design quality (high/moderate/low based on hierarchy of evidence)
2. Risk of bias (low/unclear/high)
3. Score from 1 (very low quality) to 5 (very high quality)
4. CEBM evidence grade (A through F)
5. Key strengths of this evidence
6. Key limitations

Base your assessment on the available metadata. If information is insufficient for a definitive assessment, note this in the rationale and score conservatively.`;
}
