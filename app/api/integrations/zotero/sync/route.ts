import { NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  fetchZoteroItems,
  createZoteroItem,
  mapZoteroToEvidence,
  mapEvidenceToZotero,
} from "@/lib/api/zotero";
import type { IntegrationRecord } from "@/lib/validators/integration";

// =============================================================================
// POST /api/integrations/zotero/sync
// =============================================================================
// Trigger two-way sync between VaxEvidence and Zotero:
// 1. Pull: fetch Zotero items since last sync version → upsert evidence_items
// 2. Push: find local evidence without external_id → create in Zotero → update
// 3. Update sync_state.version and last_synced_at on the integration record
// =============================================================================

export async function POST() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const lastVersion = (record.sync_state?.version as number) ?? 0;

    // -------------------------------------------------------------------------
    // 1. PULL: Zotero → VaxEvidence
    // -------------------------------------------------------------------------
    const { items: remoteItems, version: newVersion } = await fetchZoteroItems(
      apiKey,
      userId,
      { since: lastVersion },
    );

    let pulled = 0;
    for (const item of remoteItems) {
      const mapped = mapZoteroToEvidence(item);

      /* Check if evidence with this external_id already exists. */
      const { data: existing } = await supabase
        .from("evidence_items")
        .select("id")
        .eq("external_id", item.key)
        .eq("external_source", "zotero")
        .maybeSingle();

      if (existing) {
        /* Update existing evidence. */
        await supabase
          .from("evidence_items")
          .update({
            ...mapped,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        /* Insert new evidence. */
        await supabase.from("evidence_items").insert({
          ...mapped,
          user_id: user.id,
          imported_at: new Date().toISOString(),
        });
      }
      pulled++;
    }

    // -------------------------------------------------------------------------
    // 2. PUSH: VaxEvidence → Zotero
    // -------------------------------------------------------------------------
    const { data: localItems } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("user_id", user.id)
      .is("external_id", null)
      .eq("type", "academic");

    let pushed = 0;
    for (const item of localItems ?? []) {
      const zoteroData = mapEvidenceToZotero(item);
      const created = await createZoteroItem(apiKey, userId, zoteroData);

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

    // -------------------------------------------------------------------------
    // 3. Update sync state
    // -------------------------------------------------------------------------
    await supabase
      .from("integrations")
      .update({
        sync_state: { version: newVersion },
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    return NextResponse.json({ data: { pulled, pushed } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
