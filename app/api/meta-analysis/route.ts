import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import { metaAnalysisCreateSchema } from "@/lib/validators/meta-analysis";
import { calculateInverseVarianceWeight } from "@/lib/screening/meta-analysis-weights";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

/** GET /api/meta-analysis?protocol_id=... */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  const { error: authError } = await verifyProtocolOwnership(protocolId);
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
    const { data, error } = await admin
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = metaAnalysisCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const {
    protocol_id,
    evidence_id,
    study_label,
    effect_size,
    ci_lower,
    ci_upper,
    weight,
    subgroup,
  } = parsed.data;

  const { error: authError } = await verifyProtocolOwnership(protocol_id);
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

  // Auto-calculate weight from CI if not provided
  const computedWeight =
    (weight ?? calculateInverseVarianceWeight(ci_lower, ci_upper)) || null;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("meta_analysis_entries")
      .insert({
        protocol_id,
        evidence_id: evidence_id ?? null,
        study_label,
        effect_size,
        ci_lower,
        ci_upper,
        weight: computedWeight,
        subgroup: subgroup ?? null,
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
