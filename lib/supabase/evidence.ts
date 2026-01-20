import { supabase } from "@/lib/supabase/client"
import type {
  EvidenceFormValues,
  EvidenceUpdateValues,
  EvidenceItem,
  EvidenceLink,
  EvidenceLinkValues,
  EvidenceType,
  EvidenceStatus,
} from "@/lib/validators/evidence"

// =============================================================================
// EVIDENCE SUPABASE QUERIES
// =============================================================================
// Query functions for evidence items and protocol-evidence links
// =============================================================================

export interface EvidenceFilters {
  search?: string
  type?: EvidenceType[]
  tags?: string[]
  status?: EvidenceStatus[]
  dateFrom?: string
  dateTo?: string
}

export interface EvidenceSortOptions {
  field: "created_at" | "updated_at" | "title" | "publication_date"
  direction: "asc" | "desc"
}

/**
 * Fetch all evidence items with optional filters and sorting
 */
export const fetchEvidenceItems = async (
  filters?: EvidenceFilters,
  sort?: EvidenceSortOptions
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  let query = supabase.from("evidence_items").select("*")

  // Apply filters
  if (filters?.type && filters.type.length > 0) {
    query = query.in("type", filters.type)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags)
  }

  if (filters?.dateFrom) {
    query = query.gte("publication_date", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("publication_date", filters.dateTo)
  }

  // Apply text search (search across title, description, and authors)
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,authors.ilike.%${filters.search}%`
    )
  }

  // Apply sorting
  const sortField = sort?.field || "updated_at"
  const sortDirection = sort?.direction || "desc"
  query = query.order(sortField, { ascending: sortDirection === "asc" })

  return query
}

/**
 * Fetch a single evidence item by ID
 */
export const fetchEvidenceById = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("evidence_items").select("*").eq("id", id).single()
}

/**
 * Create a new evidence item
 */
export const createEvidence = async (
  payload: EvidenceFormValues & { user_id: string }
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  // Clean up empty string values to null for optional fields
  const cleanedPayload = {
    ...payload,
    authors: payload.authors || null,
    journal: payload.journal || null,
    doi: payload.doi || null,
    regulatory_body: payload.regulatory_body || null,
    document_type: payload.document_type || null,
    source_url: payload.source_url || null,
    publication_date: payload.publication_date || null,
  }

  return supabase.from("evidence_items").insert(cleanedPayload).select("*").single()
}

/**
 * Update an existing evidence item
 */
export const updateEvidence = async (
  id: string,
  payload: EvidenceUpdateValues
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  // Clean up empty string values to null
  const cleanedPayload = Object.entries(payload).reduce(
    (acc, [key, value]) => {
      acc[key] = value === "" ? null : value
      return acc
    },
    {} as Record<string, any>
  )

  return supabase
    .from("evidence_items")
    .update({ ...cleanedPayload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
}

/**
 * Delete an evidence item
 */
export const deleteEvidence = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("evidence_items").delete().eq("id", id)
}

/**
 * Link evidence to a protocol
 */
export const linkEvidenceToProtocol = async (
  protocolId: string,
  evidenceId: string,
  note?: string
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const payload: Partial<EvidenceLink> = {
    protocol_id: protocolId,
    evidence_id: evidenceId,
    note: note || null,
  }

  return supabase
    .from("protocol_evidence_links")
    .insert(payload)
    .select("*")
    .single()
}

/**
 * Unlink evidence from a protocol
 */
export const unlinkEvidence = async (linkId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("protocol_evidence_links").delete().eq("id", linkId)
}

/**
 * Get all evidence linked to a specific protocol
 */
export const getLinkedEvidence = async (protocolId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("protocol_evidence_links")
    .select(
      `
      *,
      evidence_items (*)
    `
    )
    .eq("protocol_id", protocolId)
    .order("linked_at", { ascending: false })
}

/**
 * Get all protocols linked to a specific evidence item
 */
export const getLinkedProtocols = async (evidenceId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("protocol_evidence_links")
    .select(
      `
      *,
      protocols (*)
    `
    )
    .eq("evidence_id", evidenceId)
    .order("linked_at", { ascending: false })
}

/**
 * Update a link note
 */
export const updateLinkNote = async (linkId: string, note: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("protocol_evidence_links")
    .update({ note })
    .eq("id", linkId)
    .select("*")
    .single()
}

/**
 * Get unique tags from all evidence items (for filter suggestions)
 */
export const getUniqueTags = async () => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const { data, error } = await supabase
    .from("evidence_items")
    .select("tags")

  if (error) return { data: null, error }

  // Flatten and deduplicate tags
  const allTags = data?.flatMap((item) => item.tags || []) || []
  const uniqueTags = Array.from(new Set(allTags)).sort()

  return { data: uniqueTags, error: null }
}
