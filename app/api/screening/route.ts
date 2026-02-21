import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabase/server";

/** GET /api/screening?protocol_id=...&stage=... */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");
  const stage = url.searchParams.get("stage");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("screening_decisions")
      .select(
        `*, evidence_items(id, title, type, authors, doi, external_id, external_source, description, tags)`,
      )
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });

    if (stage) {
      query = query.eq("stage", stage);
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

/** POST /api/screening — upsert a screening decision or batch-init. */
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

    // Batch init mode: { protocol_id, evidence_ids, stage }
    if (Array.isArray(payload.evidence_ids)) {
      const rows = (payload.evidence_ids as string[]).map((evidenceId) => ({
        protocol_id: payload.protocol_id as string,
        evidence_id: evidenceId,
        stage: (payload.stage as string) || "identification",
        decision: "pending",
      }));

      const { data, error } = await supabase
        .from("screening_decisions")
        .upsert(rows, {
          onConflict: "protocol_id,evidence_id,stage",
          ignoreDuplicates: true,
        })
        .select("*");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: data ?? [] });
    }

    // Single upsert mode
    const { data, error } = await supabase
      .from("screening_decisions")
      .upsert(
        {
          protocol_id: payload.protocol_id,
          evidence_id: payload.evidence_id,
          stage: payload.stage,
          decision: payload.decision,
          exclusion_reason: payload.exclusion_reason ?? null,
          notes: payload.notes ?? null,
          decided_by: user.id,
          decided_at:
            payload.decision !== "pending" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,evidence_id,stage" },
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
