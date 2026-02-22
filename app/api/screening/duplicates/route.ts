import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

const duplicateRequestSchema = z.object({
  protocol_id: z.string().uuid(),
});

/**
 * POST /api/screening/duplicates
 * Body: { protocol_id: string }
 * Returns duplicate groups detected among identification-stage pending items.
 */
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

  const parsed = duplicateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { protocol_id: protocolId } = parsed.data;

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
      .from("screening_decisions")
      .select(
        `*, evidence_items(id, title, type, authors, doi, external_id, external_source, description, tags)`,
      )
      .eq("protocol_id", protocolId)
      .eq("stage", "identification")
      .eq("decision", "pending");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { detectDuplicates } =
      await import("@/lib/screening/duplicate-detection");
    const groups = detectDuplicates(data ?? []);

    return NextResponse.json({ data: groups });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
