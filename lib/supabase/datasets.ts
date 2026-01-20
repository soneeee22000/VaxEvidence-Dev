import { supabase } from "@/lib/supabase/client"
import type {
  Dataset,
  DatasetCreateValues,
  DatasetUpdateValues,
  DatasetLinkValues,
  DatasetType,
  DatasetStatus,
  FileType,
} from "@/lib/validators/dataset"

// =============================================================================
// DATASET SUPABASE QUERIES
// =============================================================================

/**
 * Filters for dataset queries
 */
export interface DatasetFilters {
  search?: string
  dataset_type?: DatasetType[]
  file_type?: FileType[]
  status?: DatasetStatus[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
}

/**
 * Sort options for datasets
 */
export interface DatasetSortOptions {
  field: "created_at" | "updated_at" | "name" | "file_size" | "row_count"
  direction: "asc" | "desc"
}

/**
 * Fetch all datasets with optional filters and sorting
 */
export const fetchDatasets = async (
  filters?: DatasetFilters,
  sort?: DatasetSortOptions
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  let query = supabase.from("datasets").select("*")

  // Apply filters
  if (filters?.dataset_type && filters.dataset_type.length > 0) {
    query = query.in("dataset_type", filters.dataset_type)
  }

  if (filters?.file_type && filters.file_type.length > 0) {
    query = query.in("file_type", filters.file_type)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags)
  }

  if (filters?.dateFrom) {
    query = query.gte("date_range_start", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("date_range_end", filters.dateTo)
  }

  if (filters?.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`
    query = query.or(
      `name.ilike.${searchTerm},description.ilike.${searchTerm},file_name.ilike.${searchTerm}`
    )
  }

  // Apply sorting
  const sortField = sort?.field || "created_at"
  const sortDirection = sort?.direction || "desc"
  query = query.order(sortField, { ascending: sortDirection === "asc" })

  return query
}

/**
 * Fetch a single dataset by ID
 */
export const fetchDatasetById = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("datasets").select("*").eq("id", id).single()
}

/**
 * Create a new dataset metadata record
 */
export const createDataset = async (
  payload: DatasetCreateValues & { user_id: string }
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("datasets").insert(payload).select("*").single()
}

/**
 * Update dataset metadata
 */
export const updateDataset = async (id: string, payload: DatasetUpdateValues) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("datasets")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
}

/**
 * Delete a dataset (metadata only, file deletion handled separately)
 */
export const deleteDataset = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("datasets").delete().eq("id", id)
}

// =============================================================================
// FILE STORAGE OPERATIONS
// =============================================================================

/**
 * Upload a dataset file to Supabase Storage
 * Files are stored in user-specific folders: {user_id}/{file_name}
 */
export const uploadDatasetFile = async (file: File, userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${userId}/${timestamp}_${sanitizedFileName}`

  const { data, error } = await supabase.storage
    .from("dataset-files")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    return { data: null, error }
  }

  return { data: { path: data.path, fullPath: storagePath }, error: null }
}

/**
 * Get a signed URL for downloading a dataset file
 * URL expires after 1 hour
 */
export const getDatasetFileUrl = async (path: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const { data, error } = await supabase.storage
    .from("dataset-files")
    .createSignedUrl(path, 3600) // 1 hour expiration

  return { data, error }
}

/**
 * Delete a dataset file from storage
 */
export const deleteDatasetFile = async (path: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.storage.from("dataset-files").remove([path])
}

/**
 * Extract file metadata (row/column counts) from parsed data
 * This is a client-side helper that works with already parsed data
 */
export function extractFileMetadata(parsedData: unknown[]): {
  row_count: number
  column_count: number
} {
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return { row_count: 0, column_count: 0 }
  }

  const firstRow = parsedData[0]
  const columnCount =
    typeof firstRow === "object" && firstRow !== null
      ? Object.keys(firstRow).length
      : 0

  return {
    row_count: parsedData.length,
    column_count: columnCount,
  }
}

// =============================================================================
// DATASET-PROTOCOL LINKING OPERATIONS
// =============================================================================

/**
 * Link a dataset to a protocol
 */
export const linkDatasetToProtocol = async (
  protocolId: string,
  datasetId: string,
  note?: string
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const payload: DatasetLinkValues & { linked_at: string } = {
    protocol_id: protocolId,
    dataset_id: datasetId,
    note: note || null,
    linked_at: new Date().toISOString(),
  }

  return supabase
    .from("protocol_dataset_links")
    .insert(payload)
    .select("*")
    .single()
}

/**
 * Unlink a dataset from a protocol
 */
export const unlinkDataset = async (linkId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("protocol_dataset_links").delete().eq("id", linkId)
}

/**
 * Get all datasets linked to a specific protocol
 * Returns dataset details along with link information
 */
export const getLinkedDatasets = async (protocolId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("protocol_dataset_links")
    .select(
      `
      id,
      note,
      linked_at,
      datasets (*)
    `
    )
    .eq("protocol_id", protocolId)
    .order("linked_at", { ascending: false })
}

/**
 * Get all protocols linked to a specific dataset
 */
export const getLinkedProtocols = async (datasetId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("protocol_dataset_links")
    .select(
      `
      id,
      note,
      linked_at,
      protocols (*)
    `
    )
    .eq("dataset_id", datasetId)
    .order("linked_at", { ascending: false })
}

/**
 * Get unique tags from all datasets (for filter suggestions)
 */
export const getUniqueTags = async () => {
  if (!supabase) {
    return { data: [], error: { message: "Supabase not configured" } }
  }

  const { data, error } = await supabase.from("datasets").select("tags")

  if (error || !data) {
    return { data: [], error }
  }

  // Flatten and deduplicate tags
  const allTags = data.flatMap((item) => item.tags || [])
  const uniqueTags = Array.from(new Set(allTags)).sort()

  return { data: uniqueTags, error: null }
}

/**
 * Get total storage used by user (in bytes)
 */
export const getTotalStorageUsed = async () => {
  if (!supabase) {
    return { data: 0, error: { message: "Supabase not configured" } }
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("file_size")

  if (error || !data) {
    return { data: 0, error }
  }

  const totalBytes = data.reduce((sum, item) => sum + (item.file_size || 0), 0)
  return { data: totalBytes, error: null }
}
