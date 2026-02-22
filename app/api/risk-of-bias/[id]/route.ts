import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { robUpdateSchema } from "@/lib/validators/risk-of-bias";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

/** GET /api/risk-of-bias/[id] */
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
      .from("risk_of_bias_assessments")
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

/** PATCH /api/risk-of-bias/[id] */
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

  const parsed = robUpdateSchema.safeParse(body);
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
      .from("risk_of_bias_assessments")
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

    const { tool, domains, overall_judgment, notes } = parsed.data;
    const updatePayload: Record<string, unknown> = {
      assessed_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (tool !== undefined) updatePayload.tool = tool;
    if (domains !== undefined) updatePayload.domains = domains;
    if (overall_judgment !== undefined)
      updatePayload.overall_judgment = overall_judgment;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await admin
      .from("risk_of_bias_assessments")
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

/** DELETE /api/risk-of-bias/[id] */
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
      .from("risk_of_bias_assessments")
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
      .from("risk_of_bias_assessments")
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
