import { createClient } from "@/lib/supabase/browser";
import type { EvidenceItem } from "@/lib/validators/evidence";

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

const notConfigured = <T>(
  message = "Supabase is not configured.",
): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } };
};

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

// =============================================================================
// EVIDENCE ITEMS
// =============================================================================

export const fetchEvidenceItems = (): SupabaseResult<EvidenceItem[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<EvidenceItem[]>());
  return safeCall(() =>
    client
      .from("evidence_items")
      .select("*")
      .order("updated_at", { ascending: false }),
  );
};

export const fetchEvidenceById = (id: string): SupabaseResult<EvidenceItem> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<EvidenceItem>());
  return safeCall(() =>
    client.from("evidence_items").select("*").eq("id", id).single(),
  );
};

export const createEvidence = (
  payload: Partial<EvidenceItem> & { user_id: string },
): SupabaseResult<EvidenceItem> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<EvidenceItem>());
  return safeCall(() =>
    client.from("evidence_items").insert(payload).select("*").single(),
  );
};

export const updateEvidence = (
  id: string,
  payload: Partial<EvidenceItem>,
): SupabaseResult<EvidenceItem> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<EvidenceItem>());
  return safeCall(() =>
    client
      .from("evidence_items")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
};

export const deleteEvidence = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() => client.from("evidence_items").delete().eq("id", id));
};

export const getUniqueTags = async (): SupabaseResult<string[]> => {
  const client = getClient();
  if (!client) return notConfigured<string[]>();

  const { data, error } = await safeCall(() =>
    client.from("evidence_items").select("tags"),
  );
  if (error || !data) return { data: null, error };

  const tags = (data as Array<{ tags?: string[] | null }>)
    .flatMap((row) => row.tags ?? [])
    .filter(Boolean);

  return { data: Array.from(new Set(tags)).sort(), error: null };
};

// =============================================================================
// PROTOCOL ↔ EVIDENCE LINKING
// =============================================================================

export const getLinkedEvidence = (
  protocolId: string,
): SupabaseResult<any[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any[]>());
  return safeCall(() =>
    client
      .from("protocol_evidence_links")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId)
      .order("linked_at", { ascending: false }),
  );
};

export const linkEvidenceToProtocol = (
  protocolId: string,
  evidenceId: string,
  note?: string,
): SupabaseResult<any> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any>());
  return safeCall(() =>
    client
      .from("protocol_evidence_links")
      .insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        note: note ?? null,
      })
      .select("*")
      .single(),
  );
};

export const unlinkEvidence = (linkId: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("protocol_evidence_links").delete().eq("id", linkId),
  );
};

export const getLinkedProtocols = (
  evidenceId: string,
): SupabaseResult<any[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any[]>());
  return safeCall(() =>
    client
      .from("protocol_evidence_links")
      .select("*, protocols(*)")
      .eq("evidence_id", evidenceId)
      .order("linked_at", { ascending: false }),
  );
};
