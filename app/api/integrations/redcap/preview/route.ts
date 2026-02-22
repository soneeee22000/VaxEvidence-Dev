import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { fetchREDCapMetadata, fetchREDCapRecords } from "@/lib/api/redcap";
import { autoDetectMapping } from "@/lib/import/redcap-mapper";

// =============================================================================
// POST /api/integrations/redcap/preview
// =============================================================================
// Preview REDCap data before import.
// Fetches metadata + first 10 records and returns auto-detected field mapping.
// Body: { api_url: string, api_token: string }
// =============================================================================

/** Maximum number of sample records to return in preview. */
const PREVIEW_RECORD_LIMIT = 10;

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { api_url: string; api_token: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (!payload.api_url || !payload.api_token) {
    return NextResponse.json(
      { error: "api_url and api_token are required" },
      { status: 400 },
    );
  }

  try {
    /* Fetch metadata (data dictionary). */
    const metadata = await fetchREDCapMetadata(
      payload.api_url,
      payload.api_token,
    );

    /* Fetch a small sample of records for preview. */
    const allRecords = await fetchREDCapRecords(
      payload.api_url,
      payload.api_token,
    );
    const sampleRecords = allRecords.slice(0, PREVIEW_RECORD_LIMIT);

    /* Auto-detect field mapping. */
    const suggestedMapping = autoDetectMapping(metadata);

    return NextResponse.json({
      data: {
        metadata,
        sample_records: sampleRecords,
        total_records: allRecords.length,
        suggested_mapping: suggestedMapping,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
