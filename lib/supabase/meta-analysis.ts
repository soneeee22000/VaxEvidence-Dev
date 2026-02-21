import { createClient } from "@/lib/supabase/browser";
import type { MetaAnalysisEntryRecord } from "@/lib/validators/meta-analysis";

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

/** Fetch all meta-analysis entries for a protocol. */
export const fetchMetaAnalysisEntries = (
  protocolId: string,
): SupabaseResult<MetaAnalysisEntryRecord[]> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<MetaAnalysisEntryRecord[]>());

  return safeCall(() =>
    client
      .from("meta_analysis_entries")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true }),
  );
};

/** Create a meta-analysis entry. */
export const createMetaAnalysisEntry = (
  payload: Omit<MetaAnalysisEntryRecord, "id" | "created_at" | "updated_at">,
): SupabaseResult<MetaAnalysisEntryRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<MetaAnalysisEntryRecord>());

  return safeCall(() =>
    client.from("meta_analysis_entries").insert(payload).select("*").single(),
  );
};

/** Update a meta-analysis entry. */
export const updateMetaAnalysisEntry = (
  id: string,
  payload: Partial<MetaAnalysisEntryRecord>,
): SupabaseResult<MetaAnalysisEntryRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<MetaAnalysisEntryRecord>());

  return safeCall(() =>
    client
      .from("meta_analysis_entries")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
};

/** Delete a meta-analysis entry. */
export const deleteMetaAnalysisEntry = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("meta_analysis_entries").delete().eq("id", id),
  );
};
