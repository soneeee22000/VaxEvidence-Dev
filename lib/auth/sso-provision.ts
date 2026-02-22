import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// =============================================================================
// SSO JIT PROVISIONING
// =============================================================================
// Server-only module for Just-In-Time (JIT) provisioning of SSO-authenticated
// users. After a user authenticates via SAML, this module checks their email
// domain against active SSO configurations and, if auto_provision is enabled,
// adds them to the matching workspace with the configured default role.
// =============================================================================

/**
 * Provision a user into a workspace after SSO authentication.
 * Checks if the user's email domain matches an active SSO config.
 * If auto_provision is enabled, adds the user as a member with the default role.
 * Returns the workspace ID if provisioned, null otherwise.
 */
export async function provisionSSOUser(params: {
  userId: string;
  email: string;
}): Promise<{ workspaceId: string | null; error: string | null }> {
  const supabase = getSupabaseAdmin();
  const domain = params.email.split("@")[1];

  if (!domain) {
    return { workspaceId: null, error: "Invalid email format" };
  }

  /* Find active SSO config matching this email domain. */
  const { data: ssoConfig, error: configError } = await supabase
    .from("sso_configurations")
    .select("workspace_id, default_role, auto_provision")
    .eq("domain", domain)
    .eq("is_active", true)
    .single();

  if (configError || !ssoConfig) {
    /* No SSO config for this domain — not an error, just no provisioning. */
    return { workspaceId: null, error: null };
  }

  if (!ssoConfig.auto_provision) {
    /* Auto-provision disabled — return workspace ID but don't add member. */
    return { workspaceId: ssoConfig.workspace_id as string, error: null };
  }

  /* Check if user is already a member. */
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", ssoConfig.workspace_id as string)
    .eq("user_id", params.userId)
    .single();

  if (existingMember) {
    /* Already a member — no action needed. */
    return { workspaceId: ssoConfig.workspace_id as string, error: null };
  }

  /* Add user to workspace with the configured default role. */
  const { error: insertError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: ssoConfig.workspace_id,
      user_id: params.userId,
      role: (ssoConfig.default_role as string) || "viewer",
    });

  if (insertError) {
    return { workspaceId: null, error: insertError.message };
  }

  return { workspaceId: ssoConfig.workspace_id as string, error: null };
}
