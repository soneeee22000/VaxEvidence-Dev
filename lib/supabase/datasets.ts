import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { Dataset, DatasetFormValues, DatasetCreateValues } from "@/lib/validators/dataset"

type SupabaseResult<T> = Promise<{ data: T | null; error: { message: string } | null }>

const notConfigured = <T>(message = "Supabase is not configured."): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } }
}

const safeCall = async <T>(fn: () => Promise<{ data: T | null; error: any }>): SupabaseResult<T> => {
  try {
    const { data, error } = await fn()
    return { data: (data ?? null) as T | null, error: error ? { message: error.message ?? String(error) } : null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}

const DATASETS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET ?? "datasets"

export type DatasetSortOptions = {
  field: "created_at" | "updated_at" | "name" | "file_size" | "row_count"
  direction: "asc" | "desc"
}

// =============================================================================
// DATASETS (DB)
// =============================================================================

export const fetchDatasets = (): SupabaseResult<Dataset[]> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<Dataset[]>())
  return safeCall(() =>
    supabase
      .from("datasets")
      .select("*")
      .order("updated_at", { ascending: false })
  )
}

export const fetchDatasetById = (id: string): SupabaseResult<Dataset> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<Dataset>())
  return safeCall(() => supabase.from("datasets").select("*").eq("id", id).single())
}

export const createDataset = (payload: DatasetCreateValues & { user_id: string }): SupabaseResult<Dataset> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<Dataset>())
  return safeCall(() => supabase.from("datasets").insert(payload).select("*").single())
}

export const updateDataset = (id: string, payload: Partial<DatasetFormValues>): SupabaseResult<Dataset> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<Dataset>())
  return safeCall(() =>
    supabase
      .from("datasets")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()
  )
}

export const deleteDataset = (id: string): SupabaseResult<null> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<null>())
  return safeCall(() => supabase.from("datasets").delete().eq("id", id))
}

export const getUniqueTags = async (): SupabaseResult<string[]> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<string[]>()

  const { data, error } = await safeCall(() => supabase.from("datasets").select("tags"))
  if (error || !data) return { data: null, error }

  const tags = (data as Array<{ tags?: string[] | null }>)
    .flatMap((row) => row.tags ?? [])
    .filter(Boolean)

  return { data: Array.from(new Set(tags)).sort(), error: null }
}

export const getTotalStorageUsed = async (): SupabaseResult<number> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<number>()

  const { data, error } = await safeCall(() => supabase.from("datasets").select("file_size"))
  if (error || !data) return { data: null, error }

  const total = (data as Array<{ file_size?: number | null }>)
    .reduce((sum, row) => sum + (row.file_size ?? 0), 0)

  return { data: total, error: null }
}

// =============================================================================
// DATASETS (STORAGE)
// =============================================================================

export const uploadDatasetFile = async (file: File, userId: string): SupabaseResult<{ fullPath: string }> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<{ fullPath: string }>()

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `${userId}/${timestamp}-${safeName}`

  return safeCall(async () => {
    const { data, error } = await supabase.storage.from(DATASETS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })
    if (error) return { data: null, error }
    const uploadedPath = (data as any)?.path ?? path
    return { data: { fullPath: uploadedPath }, error: null }
  })
}

export const getDatasetFileUrl = async (storagePath: string): SupabaseResult<{ signedUrl: string }> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<{ signedUrl: string }>()

  return safeCall(async () => {
    const { data, error } = await supabase.storage.from(DATASETS_BUCKET).createSignedUrl(storagePath, 60 * 60)
    if (error) return { data: null, error }
    return { data: { signedUrl: data?.signedUrl ?? "" }, error: null }
  })
}

export const deleteDatasetFile = async (storagePath: string): SupabaseResult<null> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<null>()
  return safeCall(async () => {
    const { error } = await supabase.storage.from(DATASETS_BUCKET).remove([storagePath])
    return { data: null, error }
  })
}

// =============================================================================
// PROTOCOL ↔ DATASET LINKING
// =============================================================================
// These helpers assume conventional table names:
// - protocol_dataset_links(protocol_id, dataset_id, note, linked_at)

export const getLinkedDatasets = (protocolId: string): SupabaseResult<any[]> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<any[]>())
  return safeCall(() =>
    supabase
      .from("protocol_dataset_links")
      .select("*, datasets(*)")
      .eq("protocol_id", protocolId)
      .order("linked_at", { ascending: false })
  )
}

export const linkDatasetToProtocol = (
  protocolId: string,
  datasetId: string,
  note?: string
): SupabaseResult<any> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<any>())
  return safeCall(() =>
    supabase
      .from("protocol_dataset_links")
      .insert({ protocol_id: protocolId, dataset_id: datasetId, note: note ?? null })
      .select("*")
      .single()
  )
}

export const unlinkDataset = (linkId: string): SupabaseResult<null> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<null>())
  return safeCall(() => supabase.from("protocol_dataset_links").delete().eq("id", linkId))
}

export const getLinkedProtocols = (datasetId: string): SupabaseResult<any[]> => {
  if (!isSupabaseConfigured() || !supabase) return Promise.resolve(notConfigured<any[]>())
  return safeCall(() =>
    supabase
      .from("protocol_dataset_links")
      .select("*, protocols(*)")
      .eq("dataset_id", datasetId)
      .order("linked_at", { ascending: false })
  )
}

// =============================================================================
// MISC
// =============================================================================
// Imported in a couple places; keep lightweight until we formalize schema.

export const extractFileMetadata = async (_file: File): Promise<{ rowCount: number | null; columnCount: number | null }> => {
  return { rowCount: null, columnCount: null }
}
