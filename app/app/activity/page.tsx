"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ActivityFeed } from "@/components/collaboration/activity-feed"
import { ActivityExportMenu } from "@/components/export/activity-export-menu"
import { fetchActivityLog } from "@/lib/supabase/activity"
import type { ActivityLogWithUser } from "@/lib/validators/activity"

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await fetchActivityLog({ limit: 100 })
        if (!error && data) {
          setActivities(data as ActivityLogWithUser[])
        }
      } catch (error) {
        console.error("Error loading activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [])

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Recent activity across all protocols, evidence, and datasets
                </CardDescription>
              </div>
              <ActivityExportMenu />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Loading activities...
              </div>
            ) : (
              <ActivityFeed activities={activities} showFilters={true} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
