import { z } from "zod";

// =============================================================================
// SSO CONFIGURATION VALIDATORS
// =============================================================================
// Zod schemas and TypeScript types for SAML SSO configuration management.
// =============================================================================

/** Supported SSO provider types. */
export const ssoProviderTypes = ["saml"] as const;

export type SsoProviderType = (typeof ssoProviderTypes)[number];

/** Default workspace roles assignable to SSO-provisioned users. */
export const ssoDefaultRoles = ["admin", "lead", "reviewer", "viewer"] as const;

export type SsoDefaultRole = (typeof ssoDefaultRoles)[number];

/**
 * Domain validation regex.
 * Matches alphanumeric subdomains with dots (e.g., "example.com", "sub.domain.org").
 * Does not allow protocols, paths, or ports.
 */
const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

/** Schema for creating a new SSO configuration. */
export const ssoConfigCreateSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(DOMAIN_REGEX, "Invalid domain format (e.g., example.com)"),
  metadata_url: z.string().url("Must be a valid URL").optional(),
  metadata_xml: z.string().optional(),
  attribute_mapping: z.record(z.string(), z.string()).optional(),
  auto_provision: z.boolean().default(true),
  default_role: z.enum(ssoDefaultRoles).default("viewer"),
  enforce_sso: z.boolean().default(false),
});

export type SsoConfigCreateValues = z.input<typeof ssoConfigCreateSchema>;

/** Schema for updating an existing SSO configuration. All fields optional. */
export const ssoConfigUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer")
    .optional(),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(DOMAIN_REGEX, "Invalid domain format (e.g., example.com)")
    .optional(),
  metadata_url: z.string().url("Must be a valid URL").optional().nullable(),
  metadata_xml: z.string().optional().nullable(),
  attribute_mapping: z.record(z.string(), z.string()).optional().nullable(),
  auto_provision: z.boolean().optional(),
  default_role: z.enum(ssoDefaultRoles).optional(),
  enforce_sso: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export type SsoConfigUpdateValues = z.infer<typeof ssoConfigUpdateSchema>;

/** Full database record shape for the `sso_configurations` table. */
export interface SsoConfigRecord {
  id: string;
  workspace_id: string;
  provider_type: SsoProviderType;
  display_name: string;
  domain: string;
  metadata_url: string | null;
  metadata_xml: string | null;
  attribute_mapping: Record<string, string> | null;
  sso_provider_id: string | null;
  is_active: boolean;
  enforce_sso: boolean;
  auto_provision: boolean;
  default_role: SsoDefaultRole;
  created_at: string;
  updated_at: string;
}
