import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// =============================================================================
// SSO DOMAIN DETECTION
// =============================================================================
// POST: Detect if an email domain has active SAML SSO configured.
// No auth required — used on the login page before authentication.
// =============================================================================

/**
 * POST /api/auth/sso/detect
 *
 * Given an email address, checks whether its domain has an active SSO
 * configuration. Returns whether SSO is available and the provider display name.
 */
export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const domain = email.split("@")[1];
  if (!domain) {
    return NextResponse.json({ data: { has_sso: false } });
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Look for an active SSO configuration matching this domain. */
    const { data: ssoConfig } = await supabase
      .from("sso_configurations")
      .select("display_name, sso_provider_id")
      .eq("domain", domain)
      .eq("is_active", true)
      .single();

    if (!ssoConfig || !ssoConfig.sso_provider_id) {
      return NextResponse.json({ data: { has_sso: false } });
    }

    return NextResponse.json({
      data: {
        has_sso: true,
        display_name: ssoConfig.display_name as string,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
