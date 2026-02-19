import { NextRequest, NextResponse } from 'next/server'
import { fetchActivityLog } from '@/lib/supabase/activity'
import { generateActivityCSV } from '@/lib/export/csv-generator'
import type { ActivityFilters } from '@/lib/validators/activity'

/**
 * Export activity log as CSV
 * POST /api/export/activity/csv
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: ActivityFilters = {
      user_id: body.userId,
      action_type: body.actionType,
      resource_type: body.resourceType,
      from_date: body.fromDate,
      to_date: body.toDate,
      limit: body.limit || 1000, // Default to 1000 entries
    }

    // Fetch activity logs with filters
    const { data: activityLogs, error } = await fetchActivityLog(filters)

    if (error) {
      console.error('[Activity Export] Failed to fetch activity logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs', details: error.message },
        { status: 500 }
      )
    }

    // If no activity logs, return empty CSV with headers (not 404)
    if (!activityLogs || activityLogs.length === 0) {
      const emptyCSV = 'timestamp,user,action,resource_type,resource_id,description\n'
      const filename = 'activity-log-empty.csv'
      return new Response(emptyCSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Generate CSV
    const csv = generateActivityCSV(activityLogs)

    // Generate filename with date range
    const fromDateStr = filters.from_date 
      ? new Date(filters.from_date).toISOString().split('T')[0]
      : 'all'
    const toDateStr = filters.to_date
      ? new Date(filters.to_date).toISOString().split('T')[0]
      : 'all'
    const filename = `activity-log-${fromDateStr}-to-${toDateStr}.csv`

    // Return CSV as download
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error exporting activity log as CSV:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
