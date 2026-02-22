import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { reportingChecklistSchema } from "@/lib/validators/reporting-checklist";

/** GET /api/reporting-checklist?protocol_id=...&checklist_type=... */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");
  const checklistType = url.searchParams.get("checklist_type");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: protocol } = await supabase
      .from("protocols")
      .select("user_id")
      .eq("id", protocolId)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("reporting_checklists")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });

    if (checklistType) {
      query = query.eq("checklist_type", checklistType);
    }

    const { data, error } = await query;

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

/** POST /api/reporting-checklist — upsert a reporting checklist. */
export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const parsed = reportingChecklistSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: protocol } = await supabase
      .from("protocols")
      .select("user_id")
      .eq("id", parsed.data.protocol_id)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("reporting_checklists")
      .upsert(
        {
          protocol_id: parsed.data.protocol_id,
          checklist_type: parsed.data.checklist_type,
          strobe_study_type: parsed.data.strobe_study_type ?? null,
          items: parsed.data.items,
          completion_pct: parsed.data.completion_pct,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,checklist_type" },
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
