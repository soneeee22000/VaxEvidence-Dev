import { createClient } from "@/lib/supabase/browser";
import type {
  Dataset,
  DatasetFormValues,
  DatasetCreateValues,
  DatasetType,
  DatasetStatus,
  FileType,
} from "@/lib/validators/dataset";
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

const DATASETS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET ?? "datasets";

export type DatasetSortOptions = {
  field: "created_at" | "updated_at" | "name" | "file_size" | "row_count";
  direction: "asc" | "desc";
};

// =============================================================================
// DATASETS (DB)
// =============================================================================

export const fetchDatasets = (): SupabaseResult<Dataset[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Dataset[]>());
  return safeCall(() =>
    client
      .from("datasets")
      .select("*")
      .order("updated_at", { ascending: false }),
  );
};

export const fetchDatasetById = (id: string): SupabaseResult<Dataset> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Dataset>());
  return safeCall(() =>
    client.from("datasets").select("*").eq("id", id).single(),
  );
};

export const createDataset = (
  payload: DatasetCreateValues & { user_id: string },
): SupabaseResult<Dataset> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Dataset>());
  return safeCall(() =>
    client.from("datasets").insert(payload).select("*").single(),
  );
};

export const updateDataset = (
  id: string,
  payload: Partial<DatasetFormValues>,
): SupabaseResult<Dataset> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<Dataset>());
  return safeCall(() =>
    client
      .from("datasets")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
};

export const deleteDataset = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() => client.from("datasets").delete().eq("id", id));
};

export const getUniqueTags = async (): SupabaseResult<string[]> => {
  const client = getClient();
  if (!client) return notConfigured<string[]>();

  const { data, error } = await safeCall(() =>
    client.from("datasets").select("tags"),
  );
  if (error || !data) return { data: null, error };

  const tags = (data as Array<{ tags?: string[] | null }>)
    .flatMap((row) => row.tags ?? [])
    .filter(Boolean);

  return { data: Array.from(new Set(tags)).sort(), error: null };
};

export const getTotalStorageUsed = async (): SupabaseResult<number> => {
  const client = getClient();
  if (!client) return notConfigured<number>();

  const { data, error } = await safeCall(() =>
    client.from("datasets").select("file_size"),
  );
  if (error || !data) return { data: null, error };

  const total = (data as Array<{ file_size?: number | null }>).reduce(
    (sum, row) => sum + (row.file_size ?? 0),
    0,
  );

  return { data: total, error: null };
};

// =============================================================================
// PAGINATED DATASETS
// =============================================================================

/** Parameters for paginated dataset list queries. */
export interface DatasetListParams {
  page: number;
  pageSize: number;
  search?: string;
  types?: DatasetType[];
  statuses?: DatasetStatus[];
  fileTypes?: FileType[];
  tags?: string[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * Fetch datasets with server-side pagination, search, and filtering.
 */
export const fetchDatasetsPaginated = async (
  params: DatasetListParams,
): Promise<{
  data: { items: Dataset[]; totalCount: number } | null;
  error: { message: string } | null;
}> => {
  const client = getClient();
  if (!client)
    return { data: null, error: { message: "Supabase is not configured." } };

  try {
    const { from, to } = buildSupabaseRange(params.page, params.pageSize);
    const sortBy = params.sortBy ?? "updated_at";
    const ascending = (params.sortDirection ?? "desc") === "asc";

    let query = client.from("datasets").select("*", { count: "exact" });

    if (params.search) {
      query = query.textSearch("search_vector", params.search, {
        type: "websearch",
      });
    }

    if (params.types && params.types.length > 0) {
      query = query.in("dataset_type", params.types);
    }

    if (params.statuses && params.statuses.length > 0) {
      query = query.in("status", params.statuses);
    }

    if (params.fileTypes && params.fileTypes.length > 0) {
      query = query.in("file_type", params.fileTypes);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains("tags", params.tags);
    }

    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: { message: error.message ?? String(error) } };
    }

    return {
      data: {
        items: (data as Dataset[]) ?? [],
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
// DATASETS (STORAGE)
// =============================================================================

export const uploadDatasetFile = async (
  file: File,
  userId: string,
): SupabaseResult<{ fullPath: string }> => {
  const client = getClient();
  if (!client) {
    console.error("[Dataset Upload] Supabase is not configured");
    return notConfigured<{ fullPath: string }>();
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${timestamp}-${safeName}`;

  console.log(
    `[Dataset Upload] Uploading to bucket "${DATASETS_BUCKET}" at path: ${path}`,
  );

  try {
    const { data, error } = await client.storage
      .from(DATASETS_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[Dataset Upload] Supabase storage error:", error);
      let errorMessage = error.message;
      if (error.message.includes("Bucket not found")) {
        errorMessage = `Storage bucket "${DATASETS_BUCKET}" does not exist. Please create it in Supabase Dashboard → Storage.`;
      } else if (
        error.message.includes("not authorized") ||
        error.message.includes("policy")
      ) {
        errorMessage = `Storage access denied. Please check RLS policies for bucket "${DATASETS_BUCKET}".`;
      }
      return { data: null, error: { message: errorMessage } };
    }

    const uploadedPath = (data as any)?.path ?? path;
    console.log("[Dataset Upload] Success:", uploadedPath);
    return { data: { fullPath: uploadedPath }, error: null };
  } catch (err) {
    console.error("[Dataset Upload] Unexpected error:", err);
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

export const getDatasetFileUrl = async (
  storagePath: string,
): SupabaseResult<{ signedUrl: string }> => {
  // Handle demo files served from public folder
  if (storagePath.startsWith("demo:")) {
    const publicPath = storagePath.replace("demo:", "");
    return { data: { signedUrl: publicPath }, error: null };
  }

  const client = getClient();
  if (!client) return notConfigured<{ signedUrl: string }>();

  return safeCall(async () => {
    const { data, error } = await client.storage
      .from(DATASETS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (error) return { data: null, error };
    return { data: { signedUrl: data?.signedUrl ?? "" }, error: null };
  });
};

export const deleteDatasetFile = async (
  storagePath: string,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return notConfigured<null>();
  return safeCall(async () => {
    const { error } = await client.storage
      .from(DATASETS_BUCKET)
      .remove([storagePath]);
    return { data: null, error };
  });
};

// =============================================================================
// PROTOCOL ↔ DATASET LINKING
// =============================================================================

export const getLinkedDatasets = (
  protocolId: string,
): SupabaseResult<any[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any[]>());
  return safeCall(() =>
    client
      .from("protocol_dataset_links")
      .select("*, datasets(*)")
      .eq("protocol_id", protocolId)
      .order("linked_at", { ascending: false }),
  );
};

export const linkDatasetToProtocol = (
  protocolId: string,
  datasetId: string,
  note?: string,
): SupabaseResult<any> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any>());
  return safeCall(() =>
    client
      .from("protocol_dataset_links")
      .insert({
        protocol_id: protocolId,
        dataset_id: datasetId,
        note: note ?? null,
      })
      .select("*")
      .single(),
  );
};

export const unlinkDataset = (linkId: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("protocol_dataset_links").delete().eq("id", linkId),
  );
};

export const getLinkedProtocols = (
  datasetId: string,
): SupabaseResult<any[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<any[]>());
  return safeCall(() =>
    client
      .from("protocol_dataset_links")
      .select("*, protocols(*)")
      .eq("dataset_id", datasetId)
      .order("linked_at", { ascending: false }),
  );
};
