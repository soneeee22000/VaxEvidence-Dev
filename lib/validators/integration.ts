import { z } from "zod";

// =============================================================================
// INTEGRATION VALIDATORS
// =============================================================================
// Zod schemas for research tool integration CRUD operations.
// Supports Zotero, Mendeley, and REDCap providers.
// =============================================================================

/** Supported integration providers. */
export const integrationProviders = ["zotero", "mendeley", "redcap"] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];

/** Schema for creating a new integration. */
export const integrationCreateSchema = z.object({
  provider: z.enum(integrationProviders),
  display_name: z.string().min(1, "Display name is required").max(255),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  credentials: z
    .object({
      api_key: z.string().optional(),
      api_token: z.string().optional(),
      access_token: z.string().optional(),
      user_id: z.string().optional(),
      api_url: z.string().url().optional(),
    })
    .optional()
    .default({}),
});

export type IntegrationCreateValues = z.input<typeof integrationCreateSchema>;

/** Schema for updating an existing integration. */
export const integrationUpdateSchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  credentials: z
    .object({
      api_key: z.string().optional(),
      api_token: z.string().optional(),
      access_token: z.string().optional(),
      user_id: z.string().optional(),
      api_url: z.string().url().optional(),
    })
    .optional(),
  is_active: z.boolean().optional(),
  sync_state: z.record(z.string(), z.unknown()).optional(),
  last_synced_at: z.string().datetime().nullable().optional(),
});

export type IntegrationUpdateValues = z.infer<typeof integrationUpdateSchema>;

/** Full integration record as returned from the database. */
export interface IntegrationRecord {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  display_name: string;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  sync_state: Record<string, unknown>;
  last_synced_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
