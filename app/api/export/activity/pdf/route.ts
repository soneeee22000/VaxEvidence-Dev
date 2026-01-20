import { NextRequest, NextResponse } from 'next/server'
import { fetchActivityLog } from '@/lib/supabase/activity'
import { generateAuditLogPDF } from '@/lib/export/pdf-generator'
import type { ActivityFilters } from '@/lib/validators/activity'

/**
 * Export activity log as PDF
 * POST /api/export/activity/pdf
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
      limit: body.limit || 500, // Limit to 500 for PDF to avoid huge files
    }

    // Fetch activity logs with filters
    const { data: activityLogs, error } = await fetchActivityLog(filters)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      )
    }

    if (!activityLogs || activityLogs.length === 0) {
      return NextResponse.json(
        { error: 'No activity logs found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdfBlob = await generateAuditLogPDF(
      activityLogs,
      filters.from_date,
      filters.to_date
    )

    // Generate filename with date range
    const fromDateStr = filters.from_date 
      ? new Date(filters.from_date).toISOString().split('T')[0]
      : 'all'
    const toDateStr = filters.to_date
      ? new Date(filters.to_date).toISOString().split('T')[0]
      : 'all'
    const filename = `activity-audit-log-${fromDateStr}-to-${toDateStr}.pdf`

    // Return PDF as download
    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error exporting activity log as PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
