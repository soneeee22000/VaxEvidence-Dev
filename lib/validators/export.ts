import { z } from "zod";
import { activityActionTypes, activityResourceTypes } from "./activity";

/**
 * Zod schema for protocol export options (PDF/Word)
 */
export const protocolExportOptionsSchema = z.object({
  includeEvidence: z.boolean().optional().default(true),
  includeDatasets: z.boolean().optional().default(true),
  includeComments: z.boolean().optional().default(false),
  includeReviews: z.boolean().optional().default(false),
  templateStyle: z
    .enum(["professional", "academic", "regulatory"])
    .optional()
    .default("professional"),
});

export type ProtocolExportOptionsInput = z.input<
  typeof protocolExportOptionsSchema
>;

/**
 * Zod schema for activity export filters (CSV/PDF)
 */
export const activityExportFiltersSchema = z.object({
  actionType: z.array(z.enum(activityActionTypes)).optional(),
  resourceType: z.array(z.enum(activityResourceTypes)).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().int().min(1).max(10000).optional(),
});

export type ActivityExportFiltersInput = z.input<
  typeof activityExportFiltersSchema
>;

/**
 * Zod schema for bibliography export params
 */
export const bibliographyExportSchema = z.object({
  protocolId: z.string().uuid(),
  format: z.enum(["bibtex", "apa", "mla", "chicago", "ris"]),
});

export type BibliographyExportInput = z.input<typeof bibliographyExportSchema>;

/**
 * Zod schema for workspace export params
 */
export const workspaceExportSchema = z.object({
  format: z.enum(["zip", "json"]).optional().default("zip"),
});

export type WorkspaceExportInput = z.input<typeof workspaceExportSchema>;
