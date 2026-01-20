import { z } from "zod"

// =============================================================================
// REVIEW VALIDATORS
// =============================================================================
// Zod schemas for protocol review workflows
// Supports requesting reviews and submitting decisions
// =============================================================================

export const reviewStatuses = ["pending", "approved", "rejected", "changes_requested"] as const
export type ReviewStatus = (typeof reviewStatuses)[number]

/**
 * Review request schema
 */
export const reviewRequestSchema = z.object({
  protocol_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  message: z.string().max(1000).optional(),
})

export type ReviewRequestValues = z.infer<typeof reviewRequestSchema>

/**
 * Review decision schema
 */
export const reviewDecisionSchema = z.object({
  status: z.enum(["approved", "rejected", "changes_requested"]),
  decision: z.string().min(10, "Please provide a detailed reason for your decision").max(5000),
})

export type ReviewDecisionValues = z.infer<typeof reviewDecisionSchema>

/**
 * Full review type as returned from database
 */
export interface Review {
  id: string
  protocol_id: string
  reviewer_id: string
  requester_id: string
  status: ReviewStatus
  decision: string | null
  decision_at: string | null
  requested_at: string
  updated_at: string
}

/**
 * Review with user and protocol details (joined query)
 */
export interface ReviewWithDetails extends Review {
  reviewer: {
    id: string
    email: string
  }
  requester: {
    id: string
    email: string
  }
  protocol: {
    id: string
    title: string
    status: string
  }
}

/**
 * Helper to get review status badge color
 */
export function getReviewStatusColor(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "rejected":
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    case "changes_requested":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    case "pending":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
  }
}

/**
 * Helper to get review status label
 */
export function getReviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "changes_requested":
      return "Changes Requested"
    case "pending":
      return "Pending Review"
    default:
      return status
  }
}

/**
 * Check if all reviews are approved for a protocol
 */
export function areAllReviewsApproved(reviews: Review[]): boolean {
  if (reviews.length === 0) return false
  return reviews.every((review) => review.status === "approved")
}

/**
 * Check if any review is rejected
 */
export function hasRejectedReview(reviews: Review[]): boolean {
  return reviews.some((review) => review.status === "rejected")
}

/**
 * Get pending reviewers
 */
export function getPendingReviewers(reviews: ReviewWithDetails[]): ReviewWithDetails[] {
  return reviews.filter((review) => review.status === "pending")
}
