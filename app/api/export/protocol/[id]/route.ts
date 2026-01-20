import { NextRequest, NextResponse } from 'next/server'
import { fetchProtocolById } from '@/lib/supabase/protocols'
import { getLinkedEvidence } from '@/lib/supabase/evidence'
import { getLinkedDatasets } from '@/lib/supabase/datasets'
import { fetchComments } from '@/lib/supabase/comments'
import { fetchReviews } from '@/lib/supabase/reviews'
import { generateProtocolPDF } from '@/lib/export/pdf-generator'
import type { ProtocolExportOptions } from '@/lib/export/types'
import { DEV_USER } from '@/lib/auth/dev-auth'

/**
 * Export protocol as PDF
 * POST /api/export/protocol/[id]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: protocolId } = await params
    
    if (!protocolId) {
      return NextResponse.json(
        { error: 'Protocol ID is required' },
        { status: 400 }
      )
    }

    // Parse export options from request body
    const body = await request.json()
    const options: ProtocolExportOptions = {
      includeEvidence: body.includeEvidence ?? true,
      includeDatasets: body.includeDatasets ?? true,
      includeComments: body.includeComments ?? false,
      includeReviews: body.includeReviews ?? false,
      templateStyle: body.templateStyle ?? 'professional',
    }

    // Fetch protocol data
    const { data: protocol, error: protocolError } = await fetchProtocolById(protocolId)
    if (protocolError || !protocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }

    // Fetch linked data
    const { data: linkedEvidence } = await getLinkedEvidence(protocolId)
    const { data: linkedDatasets } = await getLinkedDatasets(protocolId)
    const { data: comments } = options.includeComments
      ? await fetchComments(protocolId, 'protocol')
      : { data: [] }
    const { data: reviews } = options.includeReviews
      ? await fetchReviews(protocolId)
      : { data: [] }

    // Generate PDF
    const pdfBlob = await generateProtocolPDF(
      protocol,
      linkedEvidence || [],
      linkedDatasets || [],
      comments || [],
      reviews || [],
      options
    )

    // Generate safe filename
    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50)

    // Return PDF as download
    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}-${protocolId.substring(0, 8)}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error exporting protocol as PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
