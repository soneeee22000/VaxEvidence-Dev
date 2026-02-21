import { z } from "zod";

/** PRISMA screening stages in pipeline order. */
export const screeningStages = [
  "identification",
  "screening",
  "eligibility",
  "included",
] as const;

export type ScreeningStage = (typeof screeningStages)[number];

/** Decision options for each screening stage. */
export const screeningDecisions = [
  "pending",
  "include",
  "exclude",
  "duplicate",
] as const;

export type ScreeningDecision = (typeof screeningDecisions)[number];

/** Common exclusion reason categories. */
export const exclusionReasonCategories = [
  "Wrong population",
  "Wrong intervention",
  "Wrong comparator",
  "Wrong outcome",
  "Wrong study design",
  "Duplicate",
  "Not in English",
  "Retracted",
  "Other",
] as const;

export type ExclusionReasonCategory =
  (typeof exclusionReasonCategories)[number];

/** Schema for creating/updating a screening decision. */
export const screeningDecisionSchema = z.object({
  protocol_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  stage: z.enum(screeningStages),
  decision: z.enum(screeningDecisions),
  exclusion_reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ScreeningDecisionFormValues = z.infer<
  typeof screeningDecisionSchema
>;

/** Schema for batch-initializing screening decisions. */
export const screeningBatchInitSchema = z.object({
  protocol_id: z.string().uuid(),
  evidence_ids: z.array(z.string().uuid()).min(1),
  stage: z.enum(screeningStages).default("identification"),
});

export type ScreeningBatchInitValues = z.infer<typeof screeningBatchInitSchema>;

/** Database record shape. */
export interface ScreeningDecisionRecord {
  id: string;
  protocol_id: string;
  evidence_id: string;
  stage: ScreeningStage;
  decision: ScreeningDecision;
  exclusion_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Screening decision joined with evidence data for display. */
export interface ScreeningDecisionWithEvidence extends ScreeningDecisionRecord {
  evidence_items: {
    id: string;
    title: string;
    type: string;
    authors: string | null;
    doi: string | null;
    external_id: string | null;
    external_source: string | null;
    description: string | null;
    tags: string[] | null;
  };
}

/** Stage counts for the stats bar and PRISMA diagram. */
export interface ScreeningStageCounts {
  identification: {
    total: number;
    pending: number;
    include: number;
    exclude: number;
    duplicate: number;
  };
  screening: {
    total: number;
    pending: number;
    include: number;
    exclude: number;
    duplicate: number;
  };
  eligibility: {
    total: number;
    pending: number;
    include: number;
    exclude: number;
    duplicate: number;
  };
  included: {
    total: number;
    pending: number;
    include: number;
    exclude: number;
    duplicate: number;
  };
}
