import { NextRequest, NextResponse } from 'next/server'
import { fetchProtocols } from '@/lib/supabase/protocols'
import { fetchEvidenceItems } from '@/lib/supabase/evidence'
import { fetchDatasets } from '@/lib/supabase/datasets'
import { getLinkedEvidence } from '@/lib/supabase/evidence'
import { getLinkedDatasets } from '@/lib/supabase/datasets'
import { fetchComments } from '@/lib/supabase/comments'
import { fetchReviews } from '@/lib/supabase/reviews'
import { generateWorkspaceArchive, generateJSONExport } from '@/lib/export/archive-generator'

/**
 * Export entire workspace as ZIP archive
 * POST /api/export/workspace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const format = body.format || 'zip' // 'zip' or 'json'

    // Fetch all user data
    const { data: protocols, error: protocolsError } = await fetchProtocols()
    if (protocolsError) {
      return NextResponse.json(
        { error: 'Failed to fetch protocols' },
        { status: 500 }
      )
    }

    const { data: evidence, error: evidenceError } = await fetchEvidenceItems()
    if (evidenceError) {
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      )
    }

    const { data: datasets, error: datasetsError } = await fetchDatasets()
    if (datasetsError) {
      return NextResponse.json(
        { error: 'Failed to fetch datasets' },
        { status: 500 }
      )
    }

    // Fetch linked data for all protocols
    const linkedEvidence: Record<string, any[]> = {}
    const linkedDatasets: Record<string, any[]> = {}
    const comments: Record<string, any[]> = {}
    const reviews: Record<string, any[]> = {}

    if (protocols && protocols.length > 0) {
      for (const protocol of protocols) {
        const { data: linkedEv } = await getLinkedEvidence(protocol.id)
        const { data: linkedDs } = await getLinkedDatasets(protocol.id)
        const { data: protocolComments } = await fetchComments(protocol.id, 'protocol')
        const { data: protocolReviews } = await fetchReviews(protocol.id)

        linkedEvidence[protocol.id] = linkedEv || []
        linkedDatasets[protocol.id] = linkedDs || []
        comments[protocol.id] = protocolComments || []
        reviews[protocol.id] = protocolReviews || []
      }
    }

    // Generate export based on format
    let archiveBuffer: Buffer
    let contentType: string
    let filename: string

    if (format === 'json') {
      archiveBuffer = await generateJSONExport(
        protocols || [],
        evidence || [],
        datasets || [],
        linkedEvidence,
        linkedDatasets
      )
      contentType = 'application/zip'
      filename = `vaxevidence-export-${new Date().toISOString().split('T')[0]}.zip`
    } else {
      archiveBuffer = await generateWorkspaceArchive(
        protocols || [],
        evidence || [],
        datasets || [],
        linkedEvidence,
        linkedDatasets,
        comments,
        reviews
      )
      contentType = 'application/zip'
      filename = `vaxevidence-workspace-${new Date().toISOString().split('T')[0]}.zip`
    }

    // Return ZIP as download
    return new Response(archiveBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error exporting workspace:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate workspace export',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
