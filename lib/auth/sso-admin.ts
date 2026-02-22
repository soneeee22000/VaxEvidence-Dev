import "server-only";

// =============================================================================
// SSO ADMIN — SUPABASE AUTH SSO PROVIDER MANAGEMENT
// =============================================================================
// Server-only module wrapping Supabase Auth SSO admin API for creating and
// deleting SAML SSO providers. Gracefully handles the case where SSO is not
// available (non-Enterprise Supabase plan).
// =============================================================================

/**
 * Create a SAML SSO provider using Supabase Auth admin API.
 * Returns the provider ID on success, null with error message on failure.
 * Gracefully handles the case where SSO is not available (non-Enterprise plan).
 */
export async function createSSOProvider(params: {
  domain: string;
  metadataUrl?: string;
  metadataXml?: string;
  attributeMapping?: Record<string, string>;
}): Promise<{ providerId: string | null; error: string | null }> {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        providerId: null,
        error: "Missing Supabase environment variables",
      };
    }

    /* Build the provider config object for the Auth SSO admin endpoint. */
    const providerConfig: Record<string, unknown> = {
      type: "saml",
      domains: [params.domain],
    };

    if (params.metadataUrl) {
      providerConfig.metadata_url = params.metadataUrl;
    } else if (params.metadataXml) {
      providerConfig.metadata_xml = params.metadataXml;
    }

    if (params.attributeMapping) {
      providerConfig.attribute_mapping = {
        keys: params.attributeMapping,
      };
    }

    /* Call the Supabase Auth admin SSO providers endpoint.
     * Note: This requires Supabase Enterprise plan. */
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/sso/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify(providerConfig),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      /* Common error: SSO not available on current plan. */
      if (response.status === 404 || response.status === 422) {
        return {
          providerId: null,
          error:
            "SSO is not available on your current Supabase plan. Supabase Enterprise is required for SAML SSO.",
        };
      }

      return {
        providerId: null,
        error: `Failed to create SSO provider: ${errorBody}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { providerId: data.id ?? null, error: null };
  } catch (err) {
    return {
      providerId: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Delete a SAML SSO provider from Supabase Auth.
 * Returns null error on success, error message string on failure.
 */
export async function deleteSSOProvider(
  providerId: string,
): Promise<{ error: string | null }> {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { error: "Missing Supabase environment variables" };
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/sso/providers/${providerId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return { error: `Failed to delete SSO provider: ${errorBody}` };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
