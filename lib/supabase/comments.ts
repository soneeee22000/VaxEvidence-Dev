import { supabase } from "@/lib/supabase/client"
import type {
  CommentCreateValues,
  CommentUpdateValues,
  Comment,
  CommentWithUser,
  CommentResourceType,
} from "@/lib/validators/comment"

// =============================================================================
// COMMENT SUPABASE QUERIES
// =============================================================================
// Query functions for comments with threading support
// =============================================================================

/**
 * Fetch all comments for a resource (with user details)
 */
export const fetchComments = async (
  resourceType: CommentResourceType,
  resourceId: string
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
}

/**
 * Fetch a single comment by ID
 */
export const fetchCommentById = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("id", id)
    .single()
}

/**
 * Create a new comment
 */
export const createComment = async (
  payload: CommentCreateValues & { user_id: string }
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
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
 * Update a comment (edit)
 */
export const updateComment = async (
  id: string,
  payload: CommentUpdateValues
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
    .update({
      ...payload,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
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
 * Delete a comment (soft delete)
 */
export const deleteComment = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  // Soft delete: mark as deleted but keep in database
  return supabase
    .from("comments")
    .update({
      is_deleted: true,
      content: "[deleted]",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
}

/**
 * Hard delete a comment (permanently remove)
 */
export const hardDeleteComment = async (id: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("comments").delete().eq("id", id)
}

/**
 * Get comments where user is mentioned
 */
export const getUserMentions = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .contains("mentions", [userId])
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
}

/**
 * Get comment count for a resource
 */
export const getCommentCount = async (
  resourceType: CommentResourceType,
  resourceId: string
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .eq("is_deleted", false)

  return { data: count, error }
}

/**
 * Get recent comments across all resources (for activity feed)
 */
export const getRecentComments = async (limit: number = 50) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("comments")
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit)
}
