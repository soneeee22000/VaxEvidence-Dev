import { NextRequest, NextResponse } from "next/server";
import {
  searchPubMed,
  fetchPubMedSummaries,
  fetchPubMedArticle,
} from "@/lib/api/pubmed";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const query = params.get("q");
  const pmid = params.get("pmid");
  const limitValue = Number(params.get("limit"));
  const maxResults =
    Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 20;

  try {
    if (pmid) {
      const article = await fetchPubMedArticle(pmid);
      return NextResponse.json({ article });
    }

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const ids = await searchPubMed(query, maxResults);
    const articles = await fetchPubMedSummaries(ids);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("PubMed search error:", error);
    return NextResponse.json(
      { error: "PubMed search failed" },
      { status: 500 },
    );
  }
}
