import { z } from "zod";

/** Available API key permission scopes. */
export const apiKeyScopes = ["read", "write", "admin"] as const;

export type ApiKeyScope = (typeof apiKeyScopes)[number];

/** Rate limit tier levels for API keys. */
export const rateLimitTiers = ["free", "pro", "enterprise"] as const;

export type RateLimitTier = (typeof rateLimitTiers)[number];

/** Schema for creating an API key. */
export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(apiKeyScopes)).default(["read"]),
  rate_limit_tier: z.enum(rateLimitTiers).optional().default("free"),
  expires_at: z.string().datetime().optional(),
});

export type ApiKeyCreateValues = z.input<typeof apiKeyCreateSchema>;

/** Database record shape for api_keys table. */
export interface ApiKeyRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: ApiKeyScope[];
  rate_limit_tier: RateLimitTier;
  last_used_at: string | null;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

/** API key record with the raw key attached (only available at creation time). */
export type ApiKeyWithRawKey = ApiKeyRecord & { raw_key: string };
