import { z } from "zod";

// =============================================================================
// PROTOCOL VERSION VALIDATORS & TYPES
// =============================================================================
// Schemas and types for immutable protocol version snapshots.
// Supports FDA 21 CFR Part 11 compliance with digital signatures.
// =============================================================================

/**
 * Fields captured in each version snapshot (PICO + metadata).
 */
export const VERSIONABLE_FIELDS = [
  "title",
  "study_question",
  "population",
  "intervention",
  "comparator",
  "outcomes",
  "design",
  "status",
] as const;

export type VersionableField = (typeof VERSIONABLE_FIELDS)[number];

/**
 * Human-readable labels for versionable fields.
 */
export const FIELD_LABELS: Record<VersionableField, string> = {
  title: "Title",
  study_question: "Study Question",
  population: "Population",
  intervention: "Intervention",
  comparator: "Comparator",
  outcomes: "Outcomes",
  design: "Study Design",
  status: "Status",
};

/**
 * Schema for creating a new version snapshot.
 */
export const protocolVersionCreateSchema = z.object({
  change_summary: z
    .string()
    .trim()
    .max(2000, "Change summary must be 2000 characters or fewer.")
    .optional()
    .default(""),
});

export type ProtocolVersionCreateValues = z.infer<
  typeof protocolVersionCreateSchema
>;

/**
 * Schema for signing a version (digital signature).
 */
export const protocolVersionSignSchema = z.object({
  signature_meaning: z
    .string()
    .trim()
    .min(3, "Signature meaning must be at least 3 characters.")
    .max(500, "Signature meaning must be 500 characters or fewer."),
});

export type ProtocolVersionSignValues = z.infer<
  typeof protocolVersionSignSchema
>;

/**
 * Full protocol version record as returned from the database.
 */
export interface ProtocolVersionRecord {
  id: string;
  protocol_id: string;
  version_number: number;
  title: string;
  study_question: string;
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  design: string;
  status: string;
  change_summary: string;
  content_hash: string;
  created_by: string;
  signed_by: string | null;
  signed_at: string | null;
  signature_meaning: string | null;
  created_at: string;
}

/**
 * A single field comparison between two versions.
 */
export interface ProtocolVersionField {
  field: VersionableField;
  label: string;
  oldValue: string;
  newValue: string;
  changed: boolean;
}

/**
 * Diff result comparing two protocol versions.
 */
export interface ProtocolVersionDiff {
  fields: ProtocolVersionField[];
  versionA: number;
  versionB: number;
}
