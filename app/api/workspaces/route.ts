import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { workspaceCreateSchema } from "@/lib/validators/workspace";
import { generateSlug } from "@/lib/validators/workspace";

/**
 * GET /api/workspaces — List all workspaces the current user belongs to.
 */
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get workspace IDs the user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    const workspaceIds = (memberships ?? []).map((m) => m.workspace_id);

    if (workspaceIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces — Create a new workspace. Creator becomes admin.
 */
export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = workspaceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { name, slug: providedSlug } = parsed.data;
  const slug = providedSlug || generateSlug(name);

  try {
    const supabase = getSupabaseAdmin();

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A workspace with this slug already exists" },
        { status: 409 },
      );
    }

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name, slug, owner_id: user.id })
      .select("*")
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: wsError?.message ?? "Failed to create workspace" },
        { status: 500 },
      );
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      // Rollback workspace creation on member insert failure
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
