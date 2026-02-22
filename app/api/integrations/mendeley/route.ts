import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  fetchMendeleyDocuments,
  fetchMendeleyFolders,
  createMendeleyDocument,
  mapEvidenceToMendeley,
} from "@/lib/api/mendeley";
import type { IntegrationRecord } from "@/lib/validators/integration";

// =============================================================================
// GET /api/integrations/mendeley
// =============================================================================
// Fetch Mendeley library documents using stored integration credentials.
// Query params: ?folders=true to fetch folders instead of documents.
// =============================================================================

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Look up the Mendeley integration for the user. */
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "mendeley")
      .eq("is_active", true)
      .eq("created_by", user.id)
      .single();

    if (intError || !integration) {
      return NextResponse.json(
        { error: "Mendeley integration not found or inactive" },
        { status: 404 },
      );
    }

    const record = integration as IntegrationRecord;
    const accessToken = record.credentials.access_token as string;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Mendeley access token not configured" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const wantFolders = url.searchParams.get("folders") === "true";

    if (wantFolders) {
      const folders = await fetchMendeleyFolders(accessToken);
      return NextResponse.json({ data: folders });
    }

    const folderId = url.searchParams.get("folder_id") ?? undefined;
    const documents = await fetchMendeleyDocuments(accessToken, {
      folderId,
    });
    return NextResponse.json({ data: documents });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST /api/integrations/mendeley
// =============================================================================
// Push evidence items to Mendeley.
// Body: { evidence_ids: string[] }
// =============================================================================

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { evidence_ids: string[] };
  try {
    payload = (await request.json()) as { evidence_ids: string[] };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(payload.evidence_ids) ||
    payload.evidence_ids.length === 0
  ) {
    return NextResponse.json(
      { error: "evidence_ids array is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Look up the Mendeley integration. */
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "mendeley")
      .eq("is_active", true)
      .eq("created_by", user.id)
      .single();

    if (intError || !integration) {
      return NextResponse.json(
        { error: "Mendeley integration not found or inactive" },
        { status: 404 },
      );
    }

    const record = integration as IntegrationRecord;
    const accessToken = record.credentials.access_token as string;

    /* Fetch evidence items to push. */
    const { data: evidenceItems, error: evError } = await supabase
      .from("evidence_items")
      .select("*")
      .in("id", payload.evidence_ids);

    if (evError) {
      return NextResponse.json({ error: evError.message }, { status: 500 });
    }

    let pushed = 0;
    for (const item of evidenceItems ?? []) {
      const mendeleyData = mapEvidenceToMendeley(item);
      const created = await createMendeleyDocument(accessToken, mendeleyData);

      /* Update evidence with external_id and external_source. */
      await supabase
        .from("evidence_items")
        .update({
          external_id: created.id,
          external_source: "mendeley",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      pushed++;
    }

    return NextResponse.json({ data: { pushed } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
