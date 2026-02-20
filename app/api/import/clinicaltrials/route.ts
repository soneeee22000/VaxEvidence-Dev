import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import { autoTagEvidence } from "@/lib/ml/categorize";
import { insertEvidenceWithFallback } from "@/lib/api/evidence-import";

interface TrialPayload {
  nctId: string;
  title: string;
  status?: string;
  phase?: string;
  sponsor?: string;
  conditions?: string[];
  interventions?: string[];
  summary?: string;
  startDate?: string | null;
  completionDate?: string | null;
  sourceUrl?: string;
}

const buildDescription = (trial: TrialPayload) => {
  if (trial.summary && trial.summary.length >= 10) return trial.summary;
  return `Clinical trial record from ClinicalTrials.gov (NCT: ${trial.nctId}).`;
};

export async function POST(request: NextRequest) {
  let body: TrialPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (!body?.nctId || !body?.title) {
    return NextResponse.json(
      { error: "NCT ID and title required" },
      { status: 400 },
    );
  }

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Missing Supabase configuration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const tags = autoTagEvidence([
      body.title,
      body.summary ?? "",
      body.phase ?? "",
      body.status ?? "",
      ...(body.conditions ?? []),
      ...(body.interventions ?? []),
    ]);

    const { data: existing } = await supabaseAdmin
      .from("evidence_items")
      .select("*")
      .eq("source_url", body.sourceUrl ?? "")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ evidence: existing[0], existing: true });
    }

    const payload = {
      user_id: user.id,
      type: "regulatory",
      title: body.title,
      description: buildDescription(body),
      status: "draft",
      regulatory_body: body.sponsor || "ClinicalTrials.gov",
      document_type:
        [body.phase, body.status].filter(Boolean).join(" • ") || null,
      source_url: body.sourceUrl || null,
      publication_date: body.startDate || body.completionDate || null,
      tags,
      external_id: body.nctId,
      external_source: "clinicaltrials",
      imported_at: new Date().toISOString(),
    };

    const { data, error } = await insertEvidenceWithFallback(
      supabaseAdmin,
      payload,
    );

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to import trial" },
        { status: 500 },
      );
    }

    return NextResponse.json({ evidence: data, existing: false });
  } catch (error) {
    console.error("ClinicalTrials import error:", error);
    return NextResponse.json(
      { error: "Failed to import trial" },
      { status: 500 },
    );
  }
}
