import { z } from "zod"

// =============================================================================
// COMMENT VALIDATORS
// =============================================================================
// Zod schemas for comment creation and update
// Supports threaded comments and user mentions
// =============================================================================

export const commentResourceTypes = ["protocol", "evidence_item", "dataset"] as const
export type CommentResourceType = (typeof commentResourceTypes)[number]

/**
 * Comment creation schema
 */
export const commentCreateSchema = z.object({
  resource_type: z.enum(commentResourceTypes),
  resource_id: z.string().uuid(),
  content: z.string().min(1, "Comment cannot be empty").max(10000, "Comment is too long"),
  parent_id: z.string().uuid().nullable().optional(),
  mentions: z.array(z.string().uuid()).default([]),
})

export type CommentCreateValues = z.infer<typeof commentCreateSchema>

/**
 * Comment update schema (for editing)
 */
export const commentUpdateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000, "Comment is too long"),
})

export type CommentUpdateValues = z.infer<typeof commentUpdateSchema>

/**
 * Full comment type as returned from database
 */
export interface Comment {
  id: string
  user_id: string
  resource_type: CommentResourceType
  resource_id: string
  parent_id: string | null
  content: string
  mentions: string[]
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

/**
 * Comment with user details (joined query)
 */
export interface CommentWithUser extends Comment {
  user: {
    id: string
    email: string
  }
}

/**
 * Nested comment structure for threading
 */
export interface CommentThread extends CommentWithUser {
  replies: CommentThread[]
}

/**
 * Helper function to build comment threads from flat list
 */
export function buildCommentThreads(comments: CommentWithUser[]): CommentThread[] {
  const commentMap = new Map<string, CommentThread>()
  const rootComments: CommentThread[] = []

  // First pass: create map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree structure
  comments.forEach((comment) => {
    const threadComment = commentMap.get(comment.id)
    if (!threadComment) return

    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies.push(threadComment)
      }
    } else {
      rootComments.push(threadComment)
    }
  })

  return rootComments
}

/**
 * Helper to extract user mentions from comment text
 * Looks for @[uuid] patterns
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([a-f0-9-]{36})\]/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return Array.from(new Set(mentions)) // Deduplicate
}

/**
 * Format relative time for comments (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)} years ago`
}
