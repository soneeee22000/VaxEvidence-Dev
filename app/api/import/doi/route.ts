import { NextRequest, NextResponse } from "next/server";
import { fetchCrossrefWork } from "@/lib/api/crossref";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import { autoTagEvidence } from "@/lib/ml/categorize";
import { insertEvidenceWithFallback } from "@/lib/api/evidence-import";

const DOI_REGEX = /^10\.\d{4,}\/\S+$/i;

const buildDescription = (work: { abstract?: string; doi: string }) => {
  if (work.abstract && work.abstract.length >= 10) return work.abstract;
  return `Imported from Crossref (DOI: ${work.doi}).`;
};

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doi = request.nextUrl.searchParams.get("doi");
  if (!doi || !DOI_REGEX.test(doi)) {
    return NextResponse.json({ error: "Valid DOI required" }, { status: 400 });
  }

  try {
    const work = await fetchCrossrefWork(doi);
    return NextResponse.json({ work });
  } catch (error) {
    console.error("Crossref preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch DOI metadata" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { doi?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const doi = body?.doi?.trim();
  if (!doi || !DOI_REGEX.test(doi)) {
    return NextResponse.json({ error: "Valid DOI required" }, { status: 400 });
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
    const work = await fetchCrossrefWork(doi);
    const tags = autoTagEvidence([
      work.title,
      work.abstract ?? "",
      work.journal,
      work.authors.join(" "),
    ]);

    const { data: existing } = await supabaseAdmin
      .from("evidence_items")
      .select("*")
      .eq("doi", work.doi)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ evidence: existing[0], existing: true });
    }

    const payload = {
      user_id: user.id,
      type: "academic",
      title: work.title,
      description: buildDescription(work),
      status: "draft",
      authors: work.authors.join(", "),
      journal: work.journal || null,
      doi: work.doi,
      source_url: work.url,
      publication_date: work.publishedDate,
      tags,
      external_id: work.doi,
      external_source: "crossref",
      imported_at: new Date().toISOString(),
    };

    const { data, error } = await insertEvidenceWithFallback(
      supabaseAdmin,
      payload,
    );

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to import DOI" },
        { status: 500 },
      );
    }

    return NextResponse.json({ evidence: data, existing: false });
  } catch (error) {
    console.error("Crossref import error:", error);
    return NextResponse.json(
      { error: "Failed to import DOI" },
      { status: 500 },
    );
  }
}
