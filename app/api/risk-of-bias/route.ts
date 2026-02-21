import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabase/server";

/** GET /api/risk-of-bias?protocol_id=...&tool=... */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");
  const tool = url.searchParams.get("tool");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("risk_of_bias_assessments")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });

    if (tool) {
      query = query.eq("tool", tool);
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

/** POST /api/risk-of-bias — upsert a RoB assessment. */
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
      .from("risk_of_bias_assessments")
      .upsert(
        {
          protocol_id: payload.protocol_id,
          evidence_id: payload.evidence_id,
          tool: payload.tool,
          domains: payload.domains,
          overall_judgment: payload.overall_judgment,
          assessed_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,evidence_id,tool" },
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
