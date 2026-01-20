import { supabase } from "@/lib/supabase/client"
import type { ExportRecord, ExportType, ExportStatus } from "@/lib/export/types"

// =============================================================================
// EXPORTS SUPABASE QUERIES
// =============================================================================
// Track export history and allow users to re-download recent exports
// =============================================================================

/**
 * Create a new export record
 */
export const createExport = async (
  userId: string,
  exportType: ExportType,
  resourceId: string | null = null,
  metadata: Record<string, any> | null = null
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const payload = {
    user_id: userId,
    export_type: exportType,
    resource_id: resourceId,
    status: 'pending' as ExportStatus,
    metadata,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  }

  return supabase
    .from("exports")
    .insert(payload)
    .select("*")
    .single()
}

/**
 * Update export status and file path
 */
export const updateExportStatus = async (
  exportId: string,
  status: ExportStatus,
  filePath: string | null = null
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const payload: any = { status }
  if (filePath) {
    payload.file_path = filePath
  }

  return supabase
    .from("exports")
    .update(payload)
    .eq("id", exportId)
    .select("*")
    .single()
}

/**
 * Get all exports for a user
 */
export const fetchUserExports = async (
  userId: string,
  limit: number = 50
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("exports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
}

/**
 * Get export by ID
 */
export const fetchExportById = async (exportId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("exports")
    .select("*")
    .eq("id", exportId)
    .single()
}

/**
 * Delete an export record
 */
export const deleteExport = async (exportId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("exports")
    .delete()
    .eq("id", exportId)
}

/**
 * Delete expired exports (cleanup function)
 */
export const deleteExpiredExports = async () => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("exports")
    .delete()
    .lt("expires_at", new Date().toISOString())
}

/**
 * Get export count by type for analytics
 */
export const getExportStats = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("exports")
    .select("export_type, status")
    .eq("user_id", userId)
}
