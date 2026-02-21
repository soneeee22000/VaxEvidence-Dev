import { z } from "zod";

/** Compliance status for a single GCP item. */
export const gcpComplianceStatuses = [
  "compliant",
  "partially_compliant",
  "non_compliant",
  "not_applicable",
  "not_assessed",
] as const;
export type GCPComplianceStatus = (typeof gcpComplianceStatuses)[number];

/** A single GCP principle compliance entry. */
export const gcpPrincipleEntrySchema = z.object({
  /** Principle number (1–13) */
  principle_number: z.number().int().min(1).max(13),
  /** Compliance status */
  status: z.enum(gcpComplianceStatuses).default("not_assessed"),
  /** Evidence or notes supporting the compliance status */
  notes: z.string().optional(),
});

export type GCPPrincipleEntry = z.infer<typeof gcpPrincipleEntrySchema>;

/** A single GCP protocol section compliance entry. */
export const gcpProtocolSectionEntrySchema = z.object({
  /** Section number (e.g., "6.1", "6.4.1") */
  section_number: z.string(),
  /** Compliance status */
  status: z.enum(gcpComplianceStatuses).default("not_assessed"),
  /** Notes */
  notes: z.string().optional(),
});

export type GCPProtocolSectionEntry = z.infer<
  typeof gcpProtocolSectionEntrySchema
>;

/** A single essential document tracking entry. */
export const gcpDocumentEntrySchema = z.object({
  /** Document ID (e.g., "8.2.1") */
  document_id: z.string(),
  /** Document status */
  status: z.enum(gcpComplianceStatuses).default("not_assessed"),
  /** Notes or file reference */
  notes: z.string().optional(),
});

export type GCPDocumentEntry = z.infer<typeof gcpDocumentEntrySchema>;

/** Schema for creating/updating GCP compliance data. */
export const gcpComplianceSchema = z.object({
  protocol_id: z.string().uuid(),
  /** Principle-level compliance (JSONB array of 13 entries) */
  principles: z.array(gcpPrincipleEntrySchema).default([]),
  /** Protocol section compliance (JSONB array of ~20 entries) */
  protocol_sections: z.array(gcpProtocolSectionEntrySchema).default([]),
  /** Essential documents tracking (JSONB array of ~35 entries) */
  essential_documents: z.array(gcpDocumentEntrySchema).default([]),
  /** Auto-calculated compliance score (0–100) */
  compliance_score: z.number().min(0).max(100).default(0),
});

export type GCPComplianceFormValues = z.input<typeof gcpComplianceSchema>;

/** Database record shape. */
export interface GCPComplianceRecord {
  id: string;
  protocol_id: string;
  principles: GCPPrincipleEntry[];
  protocol_sections: GCPProtocolSectionEntry[];
  essential_documents: GCPDocumentEntry[];
  compliance_score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Display labels for compliance statuses. */
export const complianceStatusLabels: Record<GCPComplianceStatus, string> = {
  compliant: "Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
  not_applicable: "N/A",
  not_assessed: "Not Assessed",
};

/** Display colors for compliance statuses. */
export const complianceStatusColors: Record<GCPComplianceStatus, string> = {
  compliant: "bg-green-500",
  partially_compliant: "bg-yellow-500",
  non_compliant: "bg-red-500",
  not_applicable: "bg-zinc-500",
  not_assessed: "bg-zinc-700",
};
