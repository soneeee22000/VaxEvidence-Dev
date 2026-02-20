import { createClient } from "@/lib/supabase/browser";
import type { ProtocolFormValues } from "@/lib/validators/protocol";
import { buildSupabaseRange } from "@/lib/types/pagination";

type ProtocolStatus = "draft" | "in_review" | "final";

export type ProtocolRecord = ProtocolFormValues & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  template_id?: string | null;
  template_name?: string | null;
};

export type TemplateUsagePayload = {
  user_id: string;
  template_id: string;
  template_name: string;
  created_protocol_id?: string;
};

export type ProtocolCreatePayload = ProtocolFormValues & {
  user_id: string;
  template_id?: string | null;
  template_name?: string | null;
};

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export const fetchProtocols = async () => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client
    .from("protocols")
    .select("*")
    .order("updated_at", { ascending: false });
};

export const fetchProtocolById = async (id: string) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("protocols").select("*").eq("id", id).single();
};

export const createProtocol = async (payload: ProtocolCreatePayload) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }

  // First attempt with all fields
  const result = await client
    .from("protocols")
    .insert(payload)
    .select("*")
    .single();

  // If error mentions missing column (migration not applied), retry without template fields
  if (
    result.error?.message?.includes("column") ||
    result.error?.message?.includes("schema cache")
  ) {
    const { template_id, template_name, ...corePayload } = payload;
    return client.from("protocols").insert(corePayload).select("*").single();
  }

  return result;
};

export const createTemplateUsage = async (payload: TemplateUsagePayload) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("template_usage").insert(payload).select("*").single();
};

export const updateProtocol = async (
  id: string,
  payload: Partial<ProtocolFormValues>,
) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client
    .from("protocols")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
};

export const deleteProtocol = async (id: string) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("protocols").delete().eq("id", id);
};

// =============================================================================
// PAGINATED PROTOCOLS
// =============================================================================

/** Parameters for paginated protocol list queries. */
export interface ProtocolListParams {
  page: number;
  pageSize: number;
  search?: string;
  statuses?: ProtocolStatus[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * Fetch protocols with server-side pagination, search, and filtering.
 */
export const fetchProtocolsPaginated = async (
  params: ProtocolListParams,
): Promise<{
  data: { items: ProtocolRecord[]; totalCount: number } | null;
  error: { message: string } | null;
}> => {
  const client = getClient();
  if (!client)
    return { data: null, error: { message: "Supabase is not configured." } };

  try {
    const { from, to } = buildSupabaseRange(params.page, params.pageSize);
    const sortBy = params.sortBy ?? "updated_at";
    const ascending = (params.sortDirection ?? "desc") === "asc";

    let query = client.from("protocols").select("*", { count: "exact" });

    if (params.search) {
      query = query.textSearch("search_vector", params.search, {
        type: "websearch",
      });
    }

    if (params.statuses && params.statuses.length > 0) {
      query = query.in("status", params.statuses);
    }

    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: { message: error.message ?? String(error) } };
    }

    return {
      data: {
        items: (data as ProtocolRecord[]) ?? [],
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
