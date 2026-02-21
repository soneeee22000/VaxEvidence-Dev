import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabase/server";

/** GET /api/meta-analysis?protocol_id=... */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("meta_analysis_entries")
      .select("*")
      .eq("protocol_id", protocolId)
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

/** POST /api/meta-analysis */
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

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("meta_analysis_entries")
      .insert({
        protocol_id: payload.protocol_id,
        evidence_id: payload.evidence_id ?? null,
        study_label: payload.study_label,
        effect_size: payload.effect_size,
        ci_lower: payload.ci_lower,
        ci_upper: payload.ci_upper,
        weight: payload.weight ?? null,
        subgroup: payload.subgroup ?? null,
      })
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
