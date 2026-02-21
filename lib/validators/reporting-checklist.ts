import { z } from "zod";

/** Supported checklist types. */
export const checklistTypes = ["consort", "strobe"] as const;
export type ChecklistType = (typeof checklistTypes)[number];

/** STROBE study type variants. */
export const strobeStudyTypes = [
  "cohort",
  "case-control",
  "cross-sectional",
] as const;
export type StrobeStudyType = (typeof strobeStudyTypes)[number];

/** Status of a single checklist item. */
export const checklistItemStatuses = [
  "not_started",
  "partial",
  "complete",
  "not_applicable",
] as const;
export type ChecklistItemStatus = (typeof checklistItemStatuses)[number];

/** A single checklist item's saved state. */
export const checklistItemSchema = z.object({
  /** Item ID (e.g., "1a" for CONSORT, "3" for STROBE) */
  item_id: z.string(),
  /** Completion status */
  status: z.enum(checklistItemStatuses).default("not_started"),
  /** User's notes or page reference */
  notes: z.string().optional(),
  /** Page number in the manuscript */
  page_reference: z.string().optional(),
});

export type ChecklistItemState = z.infer<typeof checklistItemSchema>;

/** Schema for creating/updating a reporting checklist. */
export const reportingChecklistSchema = z.object({
  protocol_id: z.string().uuid(),
  checklist_type: z.enum(checklistTypes),
  /** For STROBE, which study type variant */
  strobe_study_type: z.enum(strobeStudyTypes).optional(),
  /** Per-item state as JSONB */
  items: z.array(checklistItemSchema).default([]),
  /** Auto-calculated completion percentage (0–100) */
  completion_pct: z.number().min(0).max(100).default(0),
});

export type ReportingChecklistFormValues = z.input<
  typeof reportingChecklistSchema
>;

/** Database record shape. */
export interface ReportingChecklistRecord {
  id: string;
  protocol_id: string;
  checklist_type: ChecklistType;
  strobe_study_type?: StrobeStudyType;
  items: ChecklistItemState[];
  completion_pct: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
