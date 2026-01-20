import { supabase } from "@/lib/supabase/client"
import type {
  ReviewRequestValues,
  ReviewDecisionValues,
  Review,
  ReviewWithDetails,
  ReviewStatus,
} from "@/lib/validators/review"

// =============================================================================
// REVIEW SUPABASE QUERIES
// =============================================================================
// Query functions for protocol review workflows
// =============================================================================

/**
 * Fetch all reviews for a protocol
 */
export const fetchReviews = async (protocolId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .eq("protocol_id", protocolId)
    .order("requested_at", { ascending: false })
}

/**
 * Fetch pending reviews assigned to a user
 */
export const fetchPendingReviews = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .eq("reviewer_id", userId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
}

/**
 * Fetch review count for a user
 */
export const fetchPendingReviewCount = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("reviewer_id", userId)
    .eq("status", "pending")

  return { data: count, error }
}

/**
 * Request a review from a user
 */
export const requestReview = async (
  payload: ReviewRequestValues & { requester_id: string }
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .insert({
      protocol_id: payload.protocol_id,
      reviewer_id: payload.reviewer_id,
      requester_id: payload.requester_id,
      status: "pending",
    })
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .single()
}

/**
 * Submit a review decision
 */
export const submitReviewDecision = async (
  reviewId: string,
  payload: ReviewDecisionValues
) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .update({
      status: payload.status,
      decision: payload.decision,
      decision_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .single()
}

/**
 * Cancel a review request
 */
export const cancelReview = async (reviewId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase.from("reviews").delete().eq("id", reviewId)
}

/**
 * Get review by ID
 */
export const fetchReviewById = async (reviewId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .eq("id", reviewId)
    .single()
}

/**
 * Check if user can review a protocol
 */
export const canUserReview = async (protocolId: string, userId: string) => {
  if (!supabase) {
    return { data: false, error: { message: "Supabase not configured" } }
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("protocol_id", protocolId)
    .eq("reviewer_id", userId)
    .single()

  return { data: !!data, error }
}

/**
 * Get all reviews requested by a user
 */
export const fetchRequestedReviews = async (userId: string) => {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  return supabase
    .from("reviews")
    .select(`
      *,
      reviewer:reviewer_id (
        id,
        email
      ),
      requester:requester_id (
        id,
        email
      ),
      protocol:protocol_id (
        id,
        title,
        status
      )
    `)
    .eq("requester_id", userId)
    .order("requested_at", { ascending: false })
}
