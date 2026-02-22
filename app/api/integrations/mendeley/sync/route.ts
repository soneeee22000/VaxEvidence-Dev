import { NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  fetchMendeleyDocuments,
  createMendeleyDocument,
  mapMendeleyToEvidence,
  mapEvidenceToMendeley,
} from "@/lib/api/mendeley";
import type { IntegrationRecord } from "@/lib/validators/integration";

// =============================================================================
// POST /api/integrations/mendeley/sync
// =============================================================================
// Trigger two-way sync between VaxEvidence and Mendeley:
// 1. Pull: fetch Mendeley docs modified since last sync → upsert evidence
// 2. Push: find local evidence without external_id → create in Mendeley
// 3. Update last_synced_at on the integration record
// =============================================================================

export async function POST() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const lastSynced = record.last_synced_at ?? undefined;

    // -------------------------------------------------------------------------
    // 1. PULL: Mendeley → VaxEvidence
    // -------------------------------------------------------------------------
    const remoteDocs = await fetchMendeleyDocuments(accessToken, {
      modifiedSince: lastSynced,
    });

    let pulled = 0;
    for (const doc of remoteDocs) {
      const mapped = mapMendeleyToEvidence(doc);

      /* Check if evidence with this external_id already exists. */
      const { data: existing } = await supabase
        .from("evidence_items")
        .select("id")
        .eq("external_id", doc.id)
        .eq("external_source", "mendeley")
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
    // 2. PUSH: VaxEvidence → Mendeley
    // -------------------------------------------------------------------------
    const { data: localItems } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("user_id", user.id)
      .is("external_id", null)
      .eq("type", "academic");

    let pushed = 0;
    for (const item of localItems ?? []) {
      const mendeleyData = mapEvidenceToMendeley(item);
      const created = await createMendeleyDocument(accessToken, mendeleyData);

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

    // -------------------------------------------------------------------------
    // 3. Update sync state
    // -------------------------------------------------------------------------
    await supabase
      .from("integrations")
      .update({
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
