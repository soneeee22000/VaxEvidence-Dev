import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerUser, getSupabaseAdmin } from "@/lib/supabase/server";
import { aiModel } from "@/lib/ai/ai-client";
import {
  searchQueriesSchema,
  paperRankingSchema,
} from "@/lib/ai/ai-validators";
import {
  buildSearchQueryPrompt,
  buildRankingPrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
} from "@/lib/ai/prompt-builders";
import {
  searchPubMed,
  fetchPubMedSummaries,
  fetchPubMedAbstract,
} from "@/lib/api/pubmed";

/**
 * POST /api/ai/recommendations
 * Generate smart paper recommendations using a two-step AI + PubMed pipeline.
 *
 * Step 1: AI generates optimized PubMed search queries from PICO
 * Step 2: Fetch papers from PubMed using existing API functions
 * Step 3: AI ranks papers by PICO relevance
 */

const requestSchema = z.object({
  protocol_id: z.string().uuid(),
  exclude_pmids: z.array(z.string()).optional().default([]),
});

/** Maximum results per PubMed query. */
const PUBMED_RESULTS_PER_QUERY = 10;

/** Maximum papers to send to the ranking LLM call. */
const MAX_PAPERS_TO_RANK = 15;

/** Maximum papers to fetch abstracts for (most expensive PubMed calls). */
const MAX_ABSTRACT_FETCHES = 10;

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
  const { protocol_id, exclude_pmids } = parsed.data;

  // Fetch protocol
  const { data: protocol, error: protocolError } = await admin
    .from("protocols")
    .select("population, intervention, comparator, outcomes")
    .eq("id", protocol_id)
    .single();

  if (protocolError || !protocol) {
    return NextResponse.json({ error: "Protocol not found" }, { status: 404 });
  }

  try {
    // Step 1: Generate optimized PubMed search queries
    const { object: queryResult } = await generateObject({
      model: aiModel,
      system: VACCINE_RESEARCH_SYSTEM_PROMPT,
      prompt: buildSearchQueryPrompt(protocol),
      schema: searchQueriesSchema,
    });

    // Step 2: Search PubMed with each query in parallel
    const pmidArrays = await Promise.all(
      queryResult.queries.map((q) =>
        searchPubMed(q, PUBMED_RESULTS_PER_QUERY).catch(() => [] as string[]),
      ),
    );

    // Deduplicate and exclude already-linked papers
    const excludeSet = new Set(exclude_pmids);
    const uniquePmids = [...new Set(pmidArrays.flat())].filter(
      (pmid) => !excludeSet.has(pmid),
    );

    if (uniquePmids.length === 0) {
      return NextResponse.json({
        data: {
          search_queries: queryResult.queries,
          ranked_papers: [],
          articles: [],
        },
      });
    }

    // Fetch summaries for all unique PMIDs
    const toRank = uniquePmids.slice(0, MAX_PAPERS_TO_RANK);
    const articles = await fetchPubMedSummaries(toRank);

    // Fetch abstracts for top papers (needed for ranking quality)
    const toFetchAbstracts = toRank.slice(0, MAX_ABSTRACT_FETCHES);
    const abstracts = await Promise.all(
      toFetchAbstracts.map((pmid) => fetchPubMedAbstract(pmid).catch(() => "")),
    );

    // Merge abstracts into articles
    const articlesWithAbstracts = articles.map((article) => {
      const idx = toFetchAbstracts.indexOf(article.pmid);
      return idx >= 0
        ? { ...article, abstract: abstracts[idx] || undefined }
        : article;
    });

    // Step 3: AI ranks papers by PICO relevance
    const { object: ranking } = await generateObject({
      model: aiModel,
      system: VACCINE_RESEARCH_SYSTEM_PROMPT,
      prompt: buildRankingPrompt(protocol, articlesWithAbstracts),
      schema: paperRankingSchema,
    });

    // Sort by relevance score descending
    const sortedPapers = ranking.ranked_papers.sort(
      (a, b) => b.relevance_score - a.relevance_score,
    );

    return NextResponse.json({
      data: {
        search_queries: queryResult.queries,
        ranked_papers: sortedPapers,
        articles: articlesWithAbstracts,
      },
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json(
      { error: "AI recommendation generation failed" },
      { status: 500 },
    );
  }
}
