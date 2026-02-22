import { NextRequest, NextResponse } from "next/server";
import { fetchPubMedArticle } from "@/lib/api/pubmed";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import { autoTagEvidence } from "@/lib/ml/categorize";
import { insertEvidenceWithFallback } from "@/lib/api/evidence-import";
import { scoreEvidenceQuality } from "@/lib/ai/quality-scorer";

const PMID_REGEX = /^\d{1,10}$/;

const buildDescription = (article: { abstract?: string; pmid: string }) => {
  if (article.abstract && article.abstract.length >= 10)
    return article.abstract;
  return `Imported from PubMed (PMID: ${article.pmid}).`;
};

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const normalizePubMedDate = (pubDate?: string) => {
  if (!pubDate) return null;
  const trimmed = pubDate.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;

  const monthMatch = trimmed.match(/^(\d{4})\s+([A-Za-z]+)(?:\s+(\d{1,2}))?$/);
  if (monthMatch) {
    const year = monthMatch[1];
    const monthKey = monthMatch[2]?.toLowerCase();
    const dayValue = monthMatch[3] ? Number(monthMatch[3]) : 1;
    const month = monthKey ? MONTH_LOOKUP[monthKey] : undefined;
    if (month) {
      const day = String(Math.min(Math.max(dayValue, 1), 31)).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${day}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
};

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pmid = request.nextUrl.searchParams.get("pmid");
  if (!pmid || !PMID_REGEX.test(pmid)) {
    return NextResponse.json({ error: "Valid PMID required" }, { status: 400 });
  }

  try {
    const article = await fetchPubMedArticle(pmid);
    return NextResponse.json({ article });
  } catch (error) {
    console.error("PubMed preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PubMed metadata" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { pmid?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const pmid = body?.pmid?.trim();
  if (!pmid || !PMID_REGEX.test(pmid)) {
    return NextResponse.json({ error: "Valid PMID required" }, { status: 400 });
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
    const article = await fetchPubMedArticle(pmid);
    const tags = autoTagEvidence([
      article.title,
      article.abstract ?? "",
      article.journal,
      article.authors.join(" "),
    ]);

    if (article.doi) {
      const { data: existing } = await supabaseAdmin
        .from("evidence_items")
        .select("*")
        .eq("doi", article.doi)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ evidence: existing[0], existing: true });
      }
    } else {
      const { data: existing } = await supabaseAdmin
        .from("evidence_items")
        .select("*")
        .eq("title", article.title)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ evidence: existing[0], existing: true });
      }
    }

    const payload = {
      user_id: user.id,
      type: "academic",
      title: article.title,
      description: buildDescription(article),
      status: "draft",
      authors: article.authors.join(", "),
      journal: article.journal || null,
      doi: article.doi ?? null,
      source_url: article.sourceUrl,
      publication_date: normalizePubMedDate(article.pubDate),
      tags,
      external_id: article.pmid,
      external_source: "pubmed",
      imported_at: new Date().toISOString(),
    };

    const { data, error } = await insertEvidenceWithFallback(
      supabaseAdmin,
      payload,
    );

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to import PMID" },
        { status: 500 },
      );
    }

    // Fire-and-forget AI quality scoring (non-blocking)
    if (
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENAI_API_KEY
    ) {
      scoreEvidenceQuality(data)
        .then(async (score) => {
          await supabaseAdmin
            .from("evidence_items")
            .update({
              ai_quality_score: score.score,
              ai_quality_grade: score.grade,
              ai_quality_rationale: score.rationale,
              ai_quality_scored_at: new Date().toISOString(),
            })
            .eq("id", data.id);
        })
        .catch((err) =>
          console.error("AI quality scoring failed (non-blocking):", err),
        );
    }

    return NextResponse.json({ evidence: data, existing: false });
  } catch (error) {
    console.error("PubMed import error:", error);
    return NextResponse.json(
      { error: "Failed to import PMID" },
      { status: 500 },
    );
  }
}
