import { NextRequest, NextResponse } from "next/server";
import { searchClinicalTrials } from "@/lib/api/clinicaltrials";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const query = params.get("q");
  const limitValue = Number(params.get("limit"));
  const maxResults =
    Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 20;

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const trials = await searchClinicalTrials(query, maxResults);
    return NextResponse.json({ trials });
  } catch (error) {
    console.error("ClinicalTrials search error:", error);
    return NextResponse.json(
      { error: "ClinicalTrials search failed" },
      { status: 500 },
    );
  }
}
