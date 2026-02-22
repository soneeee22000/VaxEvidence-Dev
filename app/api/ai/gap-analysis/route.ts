import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerUser, getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";
import { aiModel } from "@/lib/ai/ai-client";
import { gapAnalysisSchema } from "@/lib/ai/ai-validators";
import {
  buildGapAnalysisPrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
} from "@/lib/ai/prompt-builders";

/**
 * POST /api/ai/gap-analysis
 * Analyze evidence coverage against protocol PICO framework.
 * Returns structured gap analysis via generateObject().
 */

const requestSchema = z.object({
  protocol_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkIpRateLimit(request, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: getIpRateLimitHeaders(rl) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { protocol_id } = parsed.data;

  const { error: ownershipError } = await verifyProtocolOwnership(protocol_id);
  if (ownershipError) {
    return NextResponse.json(
      { error: ownershipError.message },
      { status: ownershipError.status },
    );
  }

  const admin = getSupabaseAdmin();

  // Fetch protocol
  const { data: protocol, error: protocolError } = await admin
    .from("protocols")
    .select(
      "title, study_question, population, intervention, comparator, outcomes, design",
    )
    .eq("id", protocol_id)
    .single();

  if (protocolError || !protocol) {
    return NextResponse.json({ error: "Protocol not found" }, { status: 404 });
  }

  // Fetch linked evidence
  const { data: links } = await admin
    .from("protocol_evidence_links")
    .select("*, evidence_items(*)")
    .eq("protocol_id", protocol_id);

  const evidence = (links ?? [])
    .map((l: any) => l.evidence_items)
    .filter(Boolean);

  try {
    const { object } = await generateObject({
      model: aiModel,
      system: VACCINE_RESEARCH_SYSTEM_PROMPT,
      prompt: buildGapAnalysisPrompt(protocol, evidence),
      schema: gapAnalysisSchema,
    });

    return NextResponse.json({ data: object });
  } catch (err) {
    console.error("Gap analysis error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 },
    );
  }
}
