import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  fetchZoteroItems,
  fetchZoteroCollections,
  createZoteroItem,
  mapEvidenceToZotero,
} from "@/lib/api/zotero";
import type { IntegrationRecord } from "@/lib/validators/integration";

// =============================================================================
// GET /api/integrations/zotero
// =============================================================================
// Fetch Zotero library items using stored integration credentials.
// Query params: ?collections=true to fetch collections instead of items.
// =============================================================================

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    /* Look up the Zotero integration for the user's workspace. */
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "zotero")
      .eq("is_active", true)
      .eq("created_by", user.id)
      .single();

    if (intError || !integration) {
      return NextResponse.json(
        { error: "Zotero integration not found or inactive" },
        { status: 404 },
      );
    }

    const record = integration as IntegrationRecord;
    const apiKey = record.credentials.api_key as string;
    const userId = record.credentials.user_id as string;

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: "Zotero API key or User ID not configured" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const wantCollections = url.searchParams.get("collections") === "true";

    if (wantCollections) {
      const collections = await fetchZoteroCollections(apiKey, userId);
      return NextResponse.json({ data: collections });
    }

    const collectionKey = url.searchParams.get("collection_key") ?? undefined;
    const { items } = await fetchZoteroItems(apiKey, userId, {
      collectionKey,
    });
    return NextResponse.json({ data: items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST /api/integrations/zotero
// =============================================================================
// Push evidence items to Zotero.
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

    /* Look up the Zotero integration. */
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "zotero")
      .eq("is_active", true)
      .eq("created_by", user.id)
      .single();

    if (intError || !integration) {
      return NextResponse.json(
        { error: "Zotero integration not found or inactive" },
        { status: 404 },
      );
    }

    const record = integration as IntegrationRecord;
    const apiKey = record.credentials.api_key as string;
    const userId = record.credentials.user_id as string;

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
      const zoteroData = mapEvidenceToZotero(item);
      const created = await createZoteroItem(apiKey, userId, zoteroData);

      /* Update evidence with external_id and external_source. */
      await supabase
        .from("evidence_items")
        .update({
          external_id: created.key,
          external_source: "zotero",
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
