import { createClient } from "@/lib/supabase/browser";
import type { EvidenceItem } from "@/lib/validators/evidence";
import type { EvidenceType, EvidenceStatus } from "@/lib/validators/evidence";
import { buildSupabaseRange } from "@/lib/types/pagination";

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
// PAGINATED EVIDENCE
// =============================================================================

/** Parameters for paginated evidence list queries. */
export interface EvidenceListParams {
  page: number;
  pageSize: number;
  search?: string;
  types?: EvidenceType[];
  statuses?: EvidenceStatus[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * Fetch evidence items with server-side pagination, search, and filtering.
 * Uses `.select("*", { count: "exact" })` to get total count for pagination.
 */
export const fetchEvidenceItemsPaginated = async (
  params: EvidenceListParams,
): Promise<{
  data: { items: EvidenceItem[]; totalCount: number } | null;
  error: { message: string } | null;
}> => {
  const client = getClient();
  if (!client)
    return { data: null, error: { message: "Supabase is not configured." } };

  try {
    const { from, to } = buildSupabaseRange(params.page, params.pageSize);
    const sortBy = params.sortBy ?? "updated_at";
    const ascending = (params.sortDirection ?? "desc") === "asc";

    let query = client.from("evidence_items").select("*", { count: "exact" });

    if (params.search) {
      query = query.textSearch("search_vector", params.search, {
        type: "websearch",
      });
    }

    if (params.types && params.types.length > 0) {
      query = query.in("type", params.types);
    }

    if (params.statuses && params.statuses.length > 0) {
      query = query.in("status", params.statuses);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains("tags", params.tags);
    }

    if (params.dateFrom) {
      query = query.gte("publication_date", params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte("publication_date", params.dateTo);
    }

    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: { message: error.message ?? String(error) } };
    }

    return {
      data: {
        items: (data as EvidenceItem[]) ?? [],
        totalCount: count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
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
