import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerUser, getSupabaseAdmin } from "@/lib/supabase/server";
import { scoreEvidenceQuality } from "@/lib/ai/quality-scorer";

/**
 * POST /api/ai/quality-score
 * Score the methodological quality of an evidence item using AI.
 * Saves the result to the evidence_items row.
 */

const requestSchema = z.object({
  evidence_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const admin = getSupabaseAdmin();

  // Fetch evidence item
  const { data: evidence, error: fetchError } = await admin
    .from("evidence_items")
    .select("*")
    .eq("id", parsed.data.evidence_id)
    .single();

  if (fetchError || !evidence) {
    return NextResponse.json(
      { error: "Evidence item not found" },
      { status: 404 },
    );
  }

  try {
    const qualityScore = await scoreEvidenceQuality(evidence);

    // Save score to database (non-blocking failure is acceptable)
    await admin
      .from("evidence_items")
      .update({
        ai_quality_score: qualityScore.score,
        ai_quality_grade: qualityScore.grade,
        ai_quality_rationale: qualityScore.rationale,
        ai_quality_scored_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.evidence_id);

    return NextResponse.json({ data: qualityScore });
  } catch (err) {
    console.error("Quality scoring error:", err);
    return NextResponse.json(
      { error: "AI quality scoring failed" },
      { status: 500 },
    );
  }
}
