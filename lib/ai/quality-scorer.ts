import { generateObject } from "ai";
import { aiModel } from "./ai-client";
import { qualityScoreSchema, type QualityScore } from "./ai-validators";
import {
  buildQualityScorePrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
} from "./prompt-builders";
import type { EvidenceItem } from "@/lib/validators/evidence";

/**
 * Score the methodological quality of an evidence item using AI.
 * Uses the Oxford CEBM framework via generateObject() with structured output.
 *
 * Shared by:
 * - POST /api/ai/quality-score (standalone scoring)
 * - POST /api/import/pmid (auto-scoring on import)
 */
export async function scoreEvidenceQuality(
  evidence: EvidenceItem,
): Promise<QualityScore> {
  const { object } = await generateObject({
    model: aiModel,
    system: VACCINE_RESEARCH_SYSTEM_PROMPT,
    prompt: buildQualityScorePrompt(evidence),
    schema: qualityScoreSchema,
  });

  return object;
}
