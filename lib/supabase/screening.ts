import { createClient } from "@/lib/supabase/browser";
import type {
  ScreeningDecisionRecord,
  ScreeningDecisionWithEvidence,
  ScreeningStageCounts,
  ScreeningStage,
} from "@/lib/validators/screening";

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

const notConfigured = <T>(): {
  data: T | null;
  error: { message: string };
} => ({
  data: null,
  error: { message: "Supabase is not configured." },
});

const safeCall = async <T>(
  fn: () => Promise<{ data: T | null; error: any }>,
): SupabaseResult<T> => {
  try {
    const { data, error } = await fn();
    return {
      data: (data ?? null) as T | null,
      error: error ? { message: error.message ?? String(error) } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

/** Fetch all screening decisions for a protocol at a specific stage, with evidence data. */
export const fetchScreeningDecisions = (
  protocolId: string,
  stage?: ScreeningStage,
): SupabaseResult<ScreeningDecisionWithEvidence[]> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<ScreeningDecisionWithEvidence[]>());

  return safeCall(async () => {
    let query = client
      .from("screening_decisions")
      .select(
        `*, evidence_items(id, title, type, authors, doi, external_id, external_source, description, tags)`,
      )
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });

    if (stage) {
      query = query.eq("stage", stage);
    }

    const { data, error } = await query;
    return { data: data as ScreeningDecisionWithEvidence[] | null, error };
  });
};

/** Upsert a single screening decision. */
export const upsertScreeningDecision = (payload: {
  protocol_id: string;
  evidence_id: string;
  stage: ScreeningStage;
  decision: string;
  exclusion_reason?: string | null;
  decided_by?: string | null;
  notes?: string | null;
}): SupabaseResult<ScreeningDecisionRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<ScreeningDecisionRecord>());

  return safeCall(() =>
    client
      .from("screening_decisions")
      .upsert(
        {
          ...payload,
          decided_at:
            payload.decision !== "pending" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,evidence_id,stage" },
      )
      .select("*")
      .single(),
  );
};

/** Batch-initialize pending decisions for multiple evidence items at a stage. */
export const batchInitScreeningDecisions = (
  protocolId: string,
  evidenceIds: string[],
  stage: ScreeningStage = "identification",
): SupabaseResult<ScreeningDecisionRecord[]> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<ScreeningDecisionRecord[]>());

  const rows = evidenceIds.map((evidenceId) => ({
    protocol_id: protocolId,
    evidence_id: evidenceId,
    stage,
    decision: "pending" as const,
  }));

  return safeCall(() =>
    client
      .from("screening_decisions")
      .upsert(rows, {
        onConflict: "protocol_id,evidence_id,stage",
        ignoreDuplicates: true,
      })
      .select("*"),
  );
};

/** Get counts per stage and decision for a protocol. */
export const getScreeningCounts = async (
  protocolId: string,
): SupabaseResult<ScreeningStageCounts> => {
  const client = getClient();
  if (!client) return notConfigured<ScreeningStageCounts>();

  try {
    const { data, error } = await client
      .from("screening_decisions")
      .select("stage, decision")
      .eq("protocol_id", protocolId);

    if (error) return { data: null, error: { message: error.message } };

    const emptyCounts = () => ({
      total: 0,
      pending: 0,
      include: 0,
      exclude: 0,
      duplicate: 0,
    });

    const counts: ScreeningStageCounts = {
      identification: emptyCounts(),
      screening: emptyCounts(),
      eligibility: emptyCounts(),
      included: emptyCounts(),
    };

    for (const row of data ?? []) {
      const stage = row.stage as ScreeningStage;
      const decision = row.decision as string;
      if (counts[stage]) {
        counts[stage].total++;
        if (decision in counts[stage]) {
          (counts[stage] as Record<string, number>)[decision]++;
        }
      }
    }

    return { data: counts, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

/** Delete a screening decision by ID. */
export const deleteScreeningDecision = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("screening_decisions").delete().eq("id", id),
  );
};
