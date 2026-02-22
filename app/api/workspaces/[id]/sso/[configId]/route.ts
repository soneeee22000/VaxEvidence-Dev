import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { ssoConfigUpdateSchema } from "@/lib/validators/sso";
import { deleteSSOProvider } from "@/lib/auth/sso-admin";

// =============================================================================
// SSO CONFIGURATION — SINGLE ITEM ROUTES
// =============================================================================
// GET: Fetch a single SSO configuration.
// PATCH: Update an SSO configuration (admin only).
// DELETE: Delete an SSO configuration (admin only).
// =============================================================================

/** Columns returned for SSO configuration responses. */
const SSO_SELECT_COLUMNS =
  "id, workspace_id, provider_type, display_name, domain, metadata_url, attribute_mapping, sso_provider_id, is_active, enforce_sso, auto_provision, default_role, created_at, updated_at";

/**
 * Helper to verify user is an admin of the workspace.
 * Returns the membership role or null if unauthorized.
 */
async function verifyAdmin(
  workspaceId: string,
  userId: string,
): Promise<{ authorized: boolean; response?: NextResponse }> {
  const supabase = getSupabaseAdmin();

  const { data: membership, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (memberError || !membership) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const adminRoles = ["admin", "owner"];
  if (!adminRoles.includes(membership.role as string)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Insufficient role — admin required" },
        { status: 403 },
      ),
    };
  }

  return { authorized: true };
}

/**
 * GET /api/workspaces/[id]/sso/[configId]
 *
 * Fetch a single SSO configuration. Requires admin membership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; configId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, configId } = await params;
  if (!id || !configId) {
    return NextResponse.json(
      { error: "Workspace ID and config ID are required" },
      { status: 400 },
    );
  }

  try {
    const { authorized, response } = await verifyAdmin(id, user.id);
    if (!authorized) return response!;

    const supabase = getSupabaseAdmin();

    const { data: config, error } = await supabase
      .from("sso_configurations")
      .select(SSO_SELECT_COLUMNS)
      .eq("id", configId)
      .eq("workspace_id", id)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { error: "SSO configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: config });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/workspaces/[id]/sso/[configId]
 *
 * Update an SSO configuration. Requires admin role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; configId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, configId } = await params;
  if (!id || !configId) {
    return NextResponse.json(
      { error: "Workspace ID and config ID are required" },
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
  const parsed = ssoConfigUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const { authorized, response } = await verifyAdmin(id, user.id);
    if (!authorized) return response!;

    const supabase = getSupabaseAdmin();

    /* Build the update payload — only include provided fields. */
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.display_name !== undefined) {
      updateFields.display_name = parsed.data.display_name;
    }
    if (parsed.data.domain !== undefined) {
      updateFields.domain = parsed.data.domain;
    }
    if (parsed.data.metadata_url !== undefined) {
      updateFields.metadata_url = parsed.data.metadata_url;
    }
    if (parsed.data.metadata_xml !== undefined) {
      updateFields.metadata_xml = parsed.data.metadata_xml;
    }
    if (parsed.data.attribute_mapping !== undefined) {
      updateFields.attribute_mapping = parsed.data.attribute_mapping;
    }
    if (parsed.data.auto_provision !== undefined) {
      updateFields.auto_provision = parsed.data.auto_provision;
    }
    if (parsed.data.default_role !== undefined) {
      updateFields.default_role = parsed.data.default_role;
    }
    if (parsed.data.enforce_sso !== undefined) {
      updateFields.enforce_sso = parsed.data.enforce_sso;
    }
    if (parsed.data.is_active !== undefined) {
      updateFields.is_active = parsed.data.is_active;
    }

    /* Update the SSO configuration — scoped to this workspace. */
    const { data: updated, error: updateError } = await supabase
      .from("sso_configurations")
      .update(updateFields)
      .eq("id", configId)
      .eq("workspace_id", id)
      .select(SSO_SELECT_COLUMNS)
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "SSO configuration not found" },
        { status: updateError ? 500 : 404 },
      );
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/sso/[configId]
 *
 * Permanently delete an SSO configuration. If it has a registered SSO provider
 * in Supabase Auth, also delete it there. Requires admin role.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; configId: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, configId } = await params;
  if (!id || !configId) {
    return NextResponse.json(
      { error: "Workspace ID and config ID are required" },
      { status: 400 },
    );
  }

  try {
    const { authorized, response } = await verifyAdmin(id, user.id);
    if (!authorized) return response!;

    const supabase = getSupabaseAdmin();

    /* Fetch the config to check if it has a registered SSO provider. */
    const { data: config, error: fetchError } = await supabase
      .from("sso_configurations")
      .select("sso_provider_id")
      .eq("id", configId)
      .eq("workspace_id", id)
      .single();

    if (fetchError || !config) {
      return NextResponse.json(
        { error: "SSO configuration not found" },
        { status: 404 },
      );
    }

    /* If there's a registered SSO provider, delete it from Supabase Auth. */
    if (config.sso_provider_id) {
      const { error: ssoDeleteError } = await deleteSSOProvider(
        config.sso_provider_id as string,
      );

      if (ssoDeleteError) {
        /* Log but don't block — still delete the local config. */
        console.warn(
          `Failed to delete SSO provider from Supabase Auth: ${ssoDeleteError}`,
        );
      }
    }

    /* Delete the local SSO configuration record. */
    const { error: deleteError } = await supabase
      .from("sso_configurations")
      .delete()
      .eq("id", configId)
      .eq("workspace_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
