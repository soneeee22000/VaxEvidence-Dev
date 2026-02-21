import { z } from "zod";

/** Schema for creating/updating a meta-analysis entry. */
export const metaAnalysisEntrySchema = z.object({
  protocol_id: z.string().uuid(),
  evidence_id: z.string().uuid().nullable().optional(),
  study_label: z.string().min(1, "Study label is required"),
  effect_size: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  weight: z.number().nullable().optional(),
  subgroup: z.string().nullable().optional(),
});

export type MetaAnalysisEntryFormValues = z.infer<
  typeof metaAnalysisEntrySchema
>;

/** Database record shape. */
export interface MetaAnalysisEntryRecord {
  id: string;
  protocol_id: string;
  evidence_id: string | null;
  study_label: string;
  effect_size: number;
  ci_lower: number;
  ci_upper: number;
  weight: number | null;
  subgroup: string | null;
  created_at: string;
  updated_at: string;
}
