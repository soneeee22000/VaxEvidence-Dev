import { supabase } from "@/lib/supabase/client"
import type {
  ActivityLogValues,
  ActivityLog,
  ActivityLogWithUser,
  ActivityFilters,
  ActivityActionType,
  ActivityResourceType,
} from "@/lib/validators/activity"

// =============================================================================
// ACTIVITY LOG SUPABASE QUERIES
// =============================================================================
// Query functions for activity tracking and logging
// =============================================================================

/**
 * Fetch activity log with optional filters
 */
export const fetchActivityLog = async (filters?: ActivityFilters) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  let query = supabase
    .from("activity_log")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)

  // Apply filters
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id)
  }

  if (filters?.action_type && filters.action_type.length > 0) {
    query = query.in("action_type", filters.action_type)
  }

  if (filters?.resource_type && filters.resource_type.length > 0) {
    query = query.in("resource_type", filters.resource_type)
  }

  if (filters?.from_date) {
    query = query.gte("created_at", filters.from_date)
  }

  if (filters?.to_date) {
    query = query.lte("created_at", filters.to_date)
  }

  // Apply sorting and pagination
  query = query.order("created_at", { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    )
  }

  return query
}

/**
 * Get activity for a specific resource
 */
export const getResourceActivity = async (
  resourceType: ActivityResourceType,
  resourceId: string,
  limit: number = 50
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("activity_log")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false })
    .limit(limit)
}

/**
 * Log a new activity manually
 */
export const logActivity = async (
  payload: ActivityLogValues & { user_id: string }
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("activity_log")
    .insert(payload)
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .single()
}

/**
 * Get activity count for a user
 */
export const getActivityCount = async (userId?: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  let query = supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { count, error } = await query

  return { data: count, error }
}

/**
 * Get recent activity for dashboard
 */
export const getRecentActivity = async (limit: number = 20) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("activity_log")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit)
}

/**
 * Get activity by action type
 */
export const getActivityByType = async (
  actionType: ActivityActionType,
  limit: number = 50
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("activity_log")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("action_type", actionType)
    .order("created_at", { ascending: false })
    .limit(limit)
}

/**
 * Get user mentions in activity
 */
export const getUserActivityMentions = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  // Get comments where user is mentioned
  return supabase
    .from("activity_log")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("action_type", "comment")
    .contains("metadata", { mentions: [userId] })
    .order("created_at", { ascending: false })
}

/**
 * Delete old activity logs (for cleanup)
 */
export const deleteOldActivityLogs = async (daysOld: number = 90) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  return supabase
    .from("activity_log")
    .delete()
    .lt("created_at", cutoffDate.toISOString())
}
