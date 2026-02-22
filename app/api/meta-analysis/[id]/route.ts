import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { metaAnalysisUpdateSchema } from "@/lib/validators/meta-analysis";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

/** GET /api/meta-analysis/[id] */
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
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
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
      .eq("id", id)
      .single();

    if (error) {
      const msg = error.message?.toLowerCase?.() ?? "";
      if (msg.includes("0 rows") || msg.includes("not found")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Verify ownership
    const { data: protocol } = await admin
      .from("protocols")
      .select("user_id")
      .eq("id", data.protocol_id)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/** PATCH /api/meta-analysis/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const rl = checkIpRateLimit(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getIpRateLimitHeaders(rl) },
    );
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

  const parsed = metaAnalysisUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await admin
      .from("meta_analysis_entries")
      .select("protocol_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: protocol } = await admin
      .from("protocols")
      .select("user_id")
      .eq("id", existing.protocol_id)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { study_label, effect_size, ci_lower, ci_upper, weight, subgroup } =
      parsed.data;
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (study_label !== undefined) updatePayload.study_label = study_label;
    if (effect_size !== undefined) updatePayload.effect_size = effect_size;
    if (ci_lower !== undefined) updatePayload.ci_lower = ci_lower;
    if (ci_upper !== undefined) updatePayload.ci_upper = ci_upper;
    if (weight !== undefined) updatePayload.weight = weight;
    if (subgroup !== undefined) updatePayload.subgroup = subgroup;

    const { data, error } = await admin
      .from("meta_analysis_entries")
      .update(updatePayload)
      .eq("id", id)
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

/** DELETE /api/meta-analysis/[id] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await admin
      .from("meta_analysis_entries")
      .select("protocol_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: protocol } = await admin
      .from("protocols")
      .select("user_id")
      .eq("id", existing.protocol_id)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await admin
      .from("meta_analysis_entries")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
