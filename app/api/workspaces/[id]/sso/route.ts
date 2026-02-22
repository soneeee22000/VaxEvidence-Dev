import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { ssoConfigCreateSchema } from "@/lib/validators/sso";
import { createSSOProvider } from "@/lib/auth/sso-admin";

// =============================================================================
// SSO CONFIGURATIONS — LIST & CREATE
// =============================================================================
// GET: List all SSO configurations for a workspace.
// POST: Create a new SSO configuration (admin only).
// =============================================================================

/** Columns returned for SSO configuration list responses. */
const SSO_SELECT_COLUMNS =
  "id, workspace_id, provider_type, display_name, domain, metadata_url, attribute_mapping, sso_provider_id, is_active, enforce_sso, auto_provision, default_role, created_at, updated_at";

/**
 * GET /api/workspaces/[id]/sso
 *
 * List all SSO configurations for a workspace. Requires admin membership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Verify user is an admin of the workspace. */
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminRoles = ["admin", "owner"];
    if (!adminRoles.includes(membership.role as string)) {
      return NextResponse.json(
        { error: "Insufficient role — admin required" },
        { status: 403 },
      );
    }

    /* Fetch SSO configurations, ordered newest first. */
    const { data: configs, error } = await supabase
      .from("sso_configurations")
      .select(SSO_SELECT_COLUMNS)
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: configs ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/sso
 *
 * Create a new SSO configuration. Requires admin role.
 * Attempts to register the provider with Supabase Auth SSO API.
 * If SSO API is not available (non-Enterprise), saves config locally with
 * sso_provider_id = null and is_active = false.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 },
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

  /* Validate input. */
  const parsed = ssoConfigCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Verify user is an admin of the workspace. */
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminRoles = ["admin", "owner"];
    if (!adminRoles.includes(membership.role as string)) {
      return NextResponse.json(
        { error: "Insufficient role — admin required" },
        { status: 403 },
      );
    }

    /* Check for duplicate domain within workspace. */
    const { data: existing } = await supabase
      .from("sso_configurations")
      .select("id")
      .eq("workspace_id", id)
      .eq("domain", parsed.data.domain)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: `An SSO configuration for domain "${parsed.data.domain}" already exists in this workspace`,
        },
        { status: 409 },
      );
    }

    /* Attempt to register with Supabase Auth SSO API. */
    const { providerId, error: ssoError } = await createSSOProvider({
      domain: parsed.data.domain,
      metadataUrl: parsed.data.metadata_url,
      metadataXml: parsed.data.metadata_xml,
      attributeMapping: parsed.data.attribute_mapping,
    });

    /* Determine active state: only active if SSO provider was created. */
    const isActive = providerId !== null;

    /* Insert into sso_configurations. */
    const { data: record, error: insertError } = await supabase
      .from("sso_configurations")
      .insert({
        workspace_id: id,
        provider_type: "saml",
        display_name: parsed.data.display_name,
        domain: parsed.data.domain,
        metadata_url: parsed.data.metadata_url ?? null,
        metadata_xml: parsed.data.metadata_xml ?? null,
        attribute_mapping: parsed.data.attribute_mapping ?? null,
        sso_provider_id: providerId,
        is_active: isActive,
        enforce_sso: parsed.data.enforce_sso,
        auto_provision: parsed.data.auto_provision,
        default_role: parsed.data.default_role,
      })
      .select(SSO_SELECT_COLUMNS)
      .single();

    if (insertError || !record) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create SSO configuration" },
        { status: 500 },
      );
    }

    /* Include SSO API warning in response if provider creation failed. */
    const warning = ssoError ?? undefined;

    return NextResponse.json({ data: record, warning });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
