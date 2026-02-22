import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

// =============================================================================
// SSO LOGIN — INITIATE SAML SSO FLOW
// =============================================================================
// POST: Initiate SAML SSO login by redirecting the user through the IdP.
// No auth required — used on the login page before authentication.
// =============================================================================

/**
 * POST /api/auth/sso/login
 *
 * Given an email address, finds the matching SSO configuration and initiates
 * the SAML SSO sign-in flow via Supabase Auth. Returns the redirect URL that
 * the client should navigate to.
 */
export async function POST(request: NextRequest) {
  const rl = checkIpRateLimit(request, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: getIpRateLimitHeaders(rl) },
    );
  }

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
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Verify there is an active SSO configuration with a provider ID. */
    const { data: ssoConfig } = await supabase
      .from("sso_configurations")
      .select("sso_provider_id, display_name")
      .eq("domain", domain)
      .eq("is_active", true)
      .single();

    if (!ssoConfig || !ssoConfig.sso_provider_id) {
      return NextResponse.json(
        { error: "No active SSO provider found for this email domain" },
        { status: 404 },
      );
    }

    /* Initiate SAML SSO sign-in via Supabase Auth. */
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
    });

    if (error) {
      return NextResponse.json(
        { error: `SSO sign-in failed: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        url: data.url,
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
