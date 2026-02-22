import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import {
  screeningBatchInitSchema,
  screeningCreateSchema,
} from "@/lib/validators/screening";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

/** GET /api/screening?protocol_id=...&stage=... */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  const { user, error: authError } = await verifyProtocolOwnership(protocolId);
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status },
    );
  }

  const rl = checkIpRateLimit(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getIpRateLimitHeaders(rl) },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const stage = url.searchParams.get("stage");

    let query = admin
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const protocolId = payload.protocol_id as string;

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  const { user, error: authError } = await verifyProtocolOwnership(protocolId);
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status },
    );
  }

  const rl = checkIpRateLimit(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getIpRateLimitHeaders(rl) },
    );
  }

  try {
    const admin = getSupabaseAdmin();

    // Batch init mode: { protocol_id, evidence_ids, stage }
    if (Array.isArray(payload.evidence_ids)) {
      const parsed = screeningBatchInitSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues.map((i) => i.message).join(", ") },
          { status: 400 },
        );
      }

      // Validate evidence IDs exist
      const { data: existingEvidence } = await admin
        .from("evidence_items")
        .select("id")
        .in("id", parsed.data.evidence_ids);

      const existingIds = new Set(
        (existingEvidence ?? []).map((e: { id: string }) => e.id),
      );
      const invalidIds = parsed.data.evidence_ids.filter(
        (id) => !existingIds.has(id),
      );
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid evidence IDs: ${invalidIds.join(", ")}` },
          { status: 400 },
        );
      }

      const rows = parsed.data.evidence_ids.map((evidenceId) => ({
        protocol_id: parsed.data.protocol_id,
        evidence_id: evidenceId,
        stage: parsed.data.stage,
        decision: "pending" as const,
      }));

      const { data, error } = await admin
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
    const parsed = screeningCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const {
      protocol_id,
      evidence_id,
      stage,
      decision,
      exclusion_reason,
      notes,
    } = parsed.data;

    const { data, error } = await admin
      .from("screening_decisions")
      .upsert(
        {
          protocol_id,
          evidence_id,
          stage,
          decision,
          exclusion_reason: exclusion_reason ?? null,
          notes: notes ?? null,
          decided_by: user.id,
          decided_at: decision !== "pending" ? new Date().toISOString() : null,
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
