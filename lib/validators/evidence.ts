import { z } from "zod"

// =============================================================================
// EVIDENCE VALIDATORS
// =============================================================================
// Zod schemas for evidence creation and update forms
// Type-specific validation based on evidence type
// =============================================================================

export const evidenceTypes = ["academic", "regulatory", "dataset", "note"] as const
export const evidenceStatuses = ["draft", "published", "archived"] as const

export type EvidenceType = (typeof evidenceTypes)[number]
export type EvidenceStatus = (typeof evidenceStatuses)[number]

/**
 * Base evidence schema - fields common to all evidence types
 */
const baseEvidenceSchema = z.object({
  type: z.enum(evidenceTypes),
  title: z.string().min(3, "Title must be at least 3 characters").max(500),
  description: z.string().min(10, "Description must be at least 10 characters"),
  tags: z.array(z.string()).default([]),
  status: z.enum(evidenceStatuses).default("draft"),
  publication_date: z.string().nullable().optional(),
})

/**
 * Academic paper specific fields
 */
const academicFieldsSchema = z.object({
  type: z.literal("academic"),
  authors: z.string().min(1, "Authors are required for academic papers"),
  journal: z.string().nullable().optional(),
  doi: z
    .string()
    .regex(/^10\.\d{4,}\/\S+$/, "Invalid DOI format")
    .nullable()
    .optional()
    .or(z.literal("")),
  source_url: z.string().url().nullable().optional().or(z.literal("")),
})

/**
 * Regulatory document specific fields
 */
const regulatoryFieldsSchema = z.object({
  type: z.literal("regulatory"),
  regulatory_body: z
    .string()
    .min(1, "Regulatory body is required for regulatory documents"),
  document_type: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional().or(z.literal("")),
})

/**
 * Dataset specific fields
 */
const datasetFieldsSchema = z.object({
  type: z.literal("dataset"),
  source_url: z.string().url("Valid URL is required for datasets"),
})

/**
 * Note specific fields (minimal requirements)
 */
const noteFieldsSchema = z.object({
  type: z.literal("note"),
})

/**
 * Discriminated union for evidence creation
 * Validates based on evidence type
 */
export const evidenceFormSchema = z.discriminatedUnion("type", [
  baseEvidenceSchema.merge(academicFieldsSchema),
  baseEvidenceSchema.merge(regulatoryFieldsSchema),
  baseEvidenceSchema.merge(datasetFieldsSchema),
  baseEvidenceSchema.merge(noteFieldsSchema),
])

export type EvidenceFormValues = z.infer<typeof evidenceFormSchema>

/**
 * Schema for updating evidence (all fields optional except type)
 */
export const evidenceUpdateSchema = z.object({
  type: z.enum(evidenceTypes).optional(),
  title: z.string().min(3).max(500).optional(),
  description: z.string().min(10).optional(),
  authors: z.string().optional(),
  journal: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  regulatory_body: z.string().nullable().optional(),
  document_type: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional().or(z.literal("")),
  publication_date: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(evidenceStatuses).optional(),
})

export type EvidenceUpdateValues = z.infer<typeof evidenceUpdateSchema>

/**
 * Full evidence item type (as returned from database)
 */
export interface EvidenceItem {
  id: string
  user_id: string
  type: EvidenceType
  title: string
  description: string
  authors: string | null
  journal: string | null
  doi: string | null
  regulatory_body: string | null
  document_type: string | null
  source_url: string | null
  publication_date: string | null
  tags: string[]
  status: EvidenceStatus
  external_id?: string | null
  external_source?: string | null
  imported_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * Evidence link type
 */
export interface EvidenceLink {
  id: string
  protocol_id: string
  evidence_id: string
  note: string | null
  linked_at: string
}

/**
 * Evidence link creation schema
 */
export const evidenceLinkSchema = z.object({
  protocol_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  note: z.string().max(1000).nullable().optional(),
})

export type EvidenceLinkValues = z.infer<typeof evidenceLinkSchema>

/**
 * Common vaccine-related tags for suggestions
 */
export const suggestedTags = [
  // Vaccine types
  "COVID-19",
  "influenza",
  "mRNA vaccine",
  "viral vector",
  "inactivated vaccine",
  "live attenuated",
  
  // Study types
  "RCT",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "observational study",
  "case-control",
  "cohort study",
  "meta-analysis",
  "systematic review",
  
  // Outcomes
  "efficacy",
  "effectiveness",
  "vaccine effectiveness",
  "safety",
  "adverse events",
  "immunogenicity",
  "hospitalization",
  "mortality",
  
  // Safety signals
  "myocarditis",
  "anaphylaxis",
  "thrombosis",
  "Guillain-Barré syndrome",
  
  // Populations
  "adults",
  "children",
  "elderly",
  "pregnancy",
  "immunocompromised",
  
  // Organizations/Sources
  "CDC",
  "FDA",
  "WHO",
  "EMA",
  "ACIP",
  "VAERS",
  "VSD",
  
  // Other
  "breakthrough infections",
  "waning immunity",
  "booster dose",
  "variant",
  "real-world evidence",
  "surveillance",
  "regulatory approval",
  "guidance",
] as const

/**
 * Helper function to get type-specific required fields
 */
export function getRequiredFieldsForType(type: EvidenceType): string[] {
  switch (type) {
    case "academic":
      return ["title", "description", "authors"]
    case "regulatory":
      return ["title", "description", "regulatory_body"]
    case "dataset":
      return ["title", "description", "source_url"]
    case "note":
      return ["title", "description"]
    default:
      return ["title", "description"]
  }
}

/**
 * Helper function to get type-specific optional fields
 */
export function getOptionalFieldsForType(type: EvidenceType): string[] {
  switch (type) {
    case "academic":
      return ["journal", "doi", "source_url", "publication_date", "tags"]
    case "regulatory":
      return ["document_type", "source_url", "publication_date", "tags"]
    case "dataset":
      return ["publication_date", "tags"]
    case "note":
      return ["tags"]
    default:
      return ["tags"]
  }
}
