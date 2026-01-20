import { z } from "zod"

// =============================================================================
// ACTIVITY LOG VALIDATORS
// =============================================================================
// Types and helpers for activity tracking
// =============================================================================

export const activityActionTypes = [
  "comment",
  "review_request",
  "review_decision",
  "create",
  "update",
  "delete",
  "link",
  "unlink",
] as const

export type ActivityActionType = (typeof activityActionTypes)[number]

export const activityResourceTypes = [
  "protocol",
  "evidence_item",
  "dataset",
  "comment",
  "review",
] as const

export type ActivityResourceType = (typeof activityResourceTypes)[number]

/**
 * Activity log creation schema
 */
export const activityLogSchema = z.object({
  action_type: z.enum(activityActionTypes),
  resource_type: z.enum(activityResourceTypes),
  resource_id: z.string().uuid(),
  metadata: z.record(z.any()).default({}),
})

export type ActivityLogValues = z.infer<typeof activityLogSchema>

/**
 * Full activity log type as returned from database
 */
export interface ActivityLog {
  id: string
  user_id: string
  action_type: ActivityActionType
  resource_type: ActivityResourceType
  resource_id: string
  metadata: Record<string, any>
  created_at: string
}

/**
 * Activity log with user details (joined query)
 */
export interface ActivityLogWithUser extends ActivityLog {
  user: {
    id: string
    email: string
  }
}

/**
 * Activity filters for querying
 */
export interface ActivityFilters {
  user_id?: string
  action_type?: ActivityActionType[]
  resource_type?: ActivityResourceType[]
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

/**
 * Format activity message for display
 */
export function formatActivityMessage(activity: ActivityLogWithUser): string {
  const userName = activity.user.email.split("@")[0]

  switch (activity.action_type) {
    case "comment":
      return `${userName} commented on ${activity.resource_type.replace("_", " ")}`
    
    case "review_request":
      const reviewerEmail = activity.metadata.reviewer_email || "a reviewer"
      return `${userName} requested review from ${reviewerEmail}`
    
    case "review_decision":
      const status = activity.metadata.status
      if (status === "approved") {
        return `${userName} approved the protocol`
      } else if (status === "rejected") {
        return `${userName} rejected the protocol`
      } else if (status === "changes_requested") {
        return `${userName} requested changes to the protocol`
      }
      return `${userName} reviewed the protocol`
    
    case "create":
      return `${userName} created a ${activity.resource_type.replace("_", " ")}`
    
    case "update":
      return `${userName} updated a ${activity.resource_type.replace("_", " ")}`
    
    case "delete":
      return `${userName} deleted a ${activity.resource_type.replace("_", " ")}`
    
    case "link":
      const linkedType = activity.metadata.linked_type || "item"
      return `${userName} linked ${linkedType} to ${activity.resource_type.replace("_", " ")}`
    
    case "unlink":
      const unlinkedType = activity.metadata.unlinked_type || "item"
      return `${userName} unlinked ${unlinkedType} from ${activity.resource_type.replace("_", " ")}`
    
    default:
      return `${userName} performed an action on ${activity.resource_type.replace("_", " ")}`
  }
}

/**
 * Get activity icon based on action type
 */
export function getActivityIcon(actionType: ActivityActionType): string {
  switch (actionType) {
    case "comment":
      return "MessageSquare"
    case "review_request":
      return "UserCheck"
    case "review_decision":
      return "CheckCircle"
    case "create":
      return "Plus"
    case "update":
      return "Edit"
    case "delete":
      return "Trash2"
    case "link":
      return "Link"
    case "unlink":
      return "LinkOff"
    default:
      return "Activity"
  }
}

/**
 * Get activity color based on action type
 */
export function getActivityColor(actionType: ActivityActionType): string {
  switch (actionType) {
    case "comment":
      return "text-blue-600 dark:text-blue-400"
    case "review_request":
      return "text-purple-600 dark:text-purple-400"
    case "review_decision":
      return "text-green-600 dark:text-green-400"
    case "create":
      return "text-emerald-600 dark:text-emerald-400"
    case "update":
      return "text-amber-600 dark:text-amber-400"
    case "delete":
      return "text-red-600 dark:text-red-400"
    case "link":
      return "text-indigo-600 dark:text-indigo-400"
    case "unlink":
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-gray-600 dark:text-gray-400"
  }
}

/**
 * Group activities by date
 */
export interface GroupedActivities {
  date: string
  activities: ActivityLogWithUser[]
}

export function groupActivitiesByDate(activities: ActivityLogWithUser[]): GroupedActivities[] {
  const groups = new Map<string, ActivityLogWithUser[]>()

  activities.forEach((activity) => {
    const date = new Date(activity.created_at).toLocaleDateString()
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(activity)
  })

  return Array.from(groups.entries())
    .map(([date, activities]) => ({ date, activities }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
