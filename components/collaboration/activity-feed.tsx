"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageSquare,
  UserCheck,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  Activity,
} from "lucide-react"
import type { ActivityLogWithUser, ActivityActionType } from "@/lib/validators/activity"
import {
  formatActivityMessage,
  getActivityColor,
  groupActivitiesByDate,
} from "@/lib/validators/activity"
import { getRelativeTime } from "@/lib/validators/comment"

interface ActivityFeedProps {
  activities: ActivityLogWithUser[]
  showFilters?: boolean
  maxItems?: number
}

export function ActivityFeed({
  activities,
  showFilters = true,
  maxItems,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityActionType | "all">("all")

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.action_type === filter)

  const displayedActivities = maxItems
    ? filteredActivities.slice(0, maxItems)
    : filteredActivities

  const groupedActivities = groupActivitiesByDate(displayedActivities)

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activity Feed</h3>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as ActivityActionType | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="review_request">Review Requests</SelectItem>
              <SelectItem value="review_decision">Review Decisions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="link">Linked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {displayedActivities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No activity to show yet
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedActivities.map((group) => (
            <div key={group.date} className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
                {group.date}
              </h4>
              <div className="space-y-3">
                {group.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ActivityItemProps {
  activity: ActivityLogWithUser
}

function ActivityItem({ activity }: ActivityItemProps) {
  const icon = getActivityIcon(activity.action_type)
  const color = getActivityColor(activity.action_type)
  const message = formatActivityMessage(activity)
  const resourceLink = getResourceLink(activity.resource_type, activity.resource_id)

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {message}
          {activity.metadata.resource_title && (
            <span className="font-medium ml-1">
              "{activity.metadata.resource_title}"
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(activity.created_at)}
          </span>
          {resourceLink && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                href={resourceLink}
                className="text-xs text-primary hover:underline"
              >
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getActivityIcon(actionType: ActivityActionType) {
  switch (actionType) {
    case "comment":
      return <MessageSquare className="h-4 w-4" />
    case "review_request":
      return <UserCheck className="h-4 w-4" />
    case "review_decision":
      return <CheckCircle className="h-4 w-4" />
    case "create":
      return <Plus className="h-4 w-4" />
    case "update":
      return <Edit className="h-4 w-4" />
    case "delete":
      return <Trash2 className="h-4 w-4" />
    case "link":
    case "unlink":
      return <LinkIcon className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function getResourceLink(resourceType: string, resourceId: string): string | null {
  switch (resourceType) {
    case "protocol":
      return `/app/${resourceId}`
    case "evidence_item":
      return `/app/evidence/${resourceId}`
    case "dataset":
      return `/app/datasets/${resourceId}`
    default:
      return null
  }
}
