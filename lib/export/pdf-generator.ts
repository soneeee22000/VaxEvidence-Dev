import { jsPDF } from 'jspdf'
import type { ProtocolRecord } from '@/lib/supabase/protocols'
import type { ProtocolExportOptions } from './types'
import { format } from 'date-fns'

// =============================================================================
// PDF GENERATOR
// =============================================================================
// Generate professional PDF reports for protocols and activity logs
// =============================================================================

/**
 * Generate a professional PDF report for a protocol
 */
export async function generateProtocolPDF(
  protocol: ProtocolRecord,
  linkedEvidence: any[],
  linkedDatasets: any[],
  comments: any[],
  reviews: any[],
  options: ProtocolExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let yPosition = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text, contentWidth)
    
    for (const line of lines) {
      checkPageBreak()
      doc.text(line, marginLeft, yPosition)
      yPosition += fontSize * 0.5
    }
    yPosition += 2
  }

  // Add header based on template style
  if (options.templateStyle === 'professional') {
    doc.setFillColor(59, 130, 246) // Blue
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('VaxEvidence', marginLeft, 25)
    doc.setFontSize(12)
    doc.text('Research Protocol Report', marginLeft, 33)
    yPosition = 50
  } else if (options.templateStyle === 'academic') {
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Research Protocol', marginLeft, yPosition)
    yPosition += 10
  } else if (options.templateStyle === 'regulatory') {
    doc.setFillColor(220, 220, 220)
    doc.rect(0, 0, pageWidth, 30, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('REGULATORY SUBMISSION', marginLeft, 20)
    yPosition = 40
  }

  doc.setTextColor(0, 0, 0)

  // Protocol Title
  yPosition += 5
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(protocol.title, contentWidth)
  for (const line of titleLines) {
    checkPageBreak()
    doc.text(line, marginLeft, yPosition)
    yPosition += 7
  }
  yPosition += 5

  // Metadata box
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(250, 250, 250)
  const metadataHeight = 25
  checkPageBreak(metadataHeight)
  doc.rect(marginLeft, yPosition, contentWidth, metadataHeight, 'FD')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  yPosition += 6
  doc.text(`Status: ${protocol.status.toUpperCase()}`, marginLeft + 5, yPosition)
  yPosition += 5
  doc.text(`Created: ${format(new Date(protocol.created_at), 'MMMM d, yyyy')}`, marginLeft + 5, yPosition)
  yPosition += 5
  doc.text(`Last Updated: ${format(new Date(protocol.updated_at), 'MMMM d, yyyy')}`, marginLeft + 5, yPosition)
  yPosition += 5
  doc.text(`Protocol ID: ${protocol.id}`, marginLeft + 5, yPosition)
  yPosition += 10

  // Study Question
  addText('Study Question', 14, true)
  yPosition += 2
  addText(protocol.study_question || 'Not specified', 11, false)
  yPosition += 5

  // PICO Framework
  addText('PICO Framework', 14, true)
  yPosition += 2

  addText('Population', 12, true)
  addText(protocol.population || 'Not specified', 11, false)
  yPosition += 3

  addText('Intervention', 12, true)
  addText('Vaccine intervention details', 11, false)
  yPosition += 3

  addText('Comparator', 12, true)
  addText(protocol.comparator || 'Not specified', 11, false)
  yPosition += 3

  addText('Outcomes', 12, true)
  addText(protocol.outcomes || 'Not specified', 11, false)
  yPosition += 5

  // Study Design
  addText('Study Design', 14, true)
  yPosition += 2
  addText(protocol.design || 'Not specified', 11, false)
  yPosition += 5

  // Linked Evidence
  if (options.includeEvidence && linkedEvidence.length > 0) {
    checkPageBreak(30)
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 8

    addText(`Linked Evidence (${linkedEvidence.length})`, 14, true)
    yPosition += 2

    linkedEvidence.forEach((link, index) => {
      checkPageBreak(20)
      const evidence = link.evidence_items

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${evidence.title}`, marginLeft, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      if (evidence.type === 'academic') {
        if (evidence.authors) {
          doc.text(`   Authors: ${evidence.authors}`, marginLeft, yPosition)
          yPosition += 4
        }
        if (evidence.journal) {
          doc.text(`   Journal: ${evidence.journal}`, marginLeft, yPosition)
          yPosition += 4
        }
        if (evidence.doi) {
          doc.text(`   DOI: ${evidence.doi}`, marginLeft, yPosition)
          yPosition += 4
        }
      } else if (evidence.type === 'regulatory') {
        if (evidence.regulatory_body) {
          doc.text(`   Regulatory Body: ${evidence.regulatory_body}`, marginLeft, yPosition)
          yPosition += 4
        }
        if (evidence.document_type) {
          doc.text(`   Document Type: ${evidence.document_type}`, marginLeft, yPosition)
          yPosition += 4
        }
      }

      if (link.note) {
        doc.setFont('helvetica', 'italic')
        const noteLines = doc.splitTextToSize(`   Note: ${link.note}`, contentWidth - 5)
        for (const line of noteLines) {
          checkPageBreak()
          doc.text(line, marginLeft, yPosition)
          yPosition += 4
        }
        doc.setFont('helvetica', 'normal')
      }

      yPosition += 3
    })
    yPosition += 5
  }

  // Linked Datasets
  if (options.includeDatasets && linkedDatasets.length > 0) {
    checkPageBreak(30)
    doc.setDrawColor(59, 130, 246)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 8

    addText(`Linked Datasets (${linkedDatasets.length})`, 14, true)
    yPosition += 2

    linkedDatasets.forEach((link, index) => {
      checkPageBreak(20)
      const dataset = link.datasets

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${dataset.name}`, marginLeft, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const descLines = doc.splitTextToSize(`   ${dataset.description}`, contentWidth - 5)
      for (const line of descLines) {
        checkPageBreak()
        doc.text(line, marginLeft, yPosition)
        yPosition += 4
      }

      doc.text(`   Type: ${dataset.dataset_type}`, marginLeft, yPosition)
      yPosition += 4
      doc.text(`   Size: ${(dataset.file_size / 1024).toFixed(2)} KB`, marginLeft, yPosition)
      yPosition += 4

      if (dataset.row_count) {
        doc.text(`   Rows: ${dataset.row_count.toLocaleString()} × ${dataset.column_count} columns`, marginLeft, yPosition)
        yPosition += 4
      }

      if (link.note) {
        doc.setFont('helvetica', 'italic')
        const noteLines = doc.splitTextToSize(`   Note: ${link.note}`, contentWidth - 5)
        for (const line of noteLines) {
          checkPageBreak()
          doc.text(line, marginLeft, yPosition)
          yPosition += 4
        }
        doc.setFont('helvetica', 'normal')
      }

      yPosition += 3
    })
    yPosition += 5
  }

  // Comments
  if (options.includeComments && comments.length > 0) {
    checkPageBreak(30)
    doc.setDrawColor(59, 130, 246)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 8

    addText(`Comments (${comments.length})`, 14, true)
    yPosition += 2

    comments.forEach((comment, index) => {
      checkPageBreak(15)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${comment.user?.email || 'Unknown User'} - ${format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}`, marginLeft, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      const contentLines = doc.splitTextToSize(comment.content, contentWidth - 5)
      for (const line of contentLines) {
        checkPageBreak()
        doc.text(line, marginLeft + 3, yPosition)
        yPosition += 4
      }
      yPosition += 3
    })
  }

  // Reviews
  if (options.includeReviews && reviews.length > 0) {
    checkPageBreak(30)
    doc.setDrawColor(59, 130, 246)
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition)
    yPosition += 8

    addText(`Review History (${reviews.length})`, 14, true)
    yPosition += 2

    reviews.forEach((review) => {
      checkPageBreak(15)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const reviewerEmail = review.reviewer?.email || 'Unknown Reviewer'
      doc.text(`${reviewerEmail} - ${review.status.toUpperCase()}`, marginLeft, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      doc.text(`Requested: ${format(new Date(review.requested_at), 'MMM d, yyyy')}`, marginLeft + 3, yPosition)
      yPosition += 4

      if (review.reviewed_at) {
        doc.text(`Reviewed: ${format(new Date(review.reviewed_at), 'MMM d, yyyy')}`, marginLeft + 3, yPosition)
        yPosition += 4
      }

      if (review.feedback) {
        const feedbackLines = doc.splitTextToSize(`Feedback: ${review.feedback}`, contentWidth - 5)
        for (const line of feedbackLines) {
          checkPageBreak()
          doc.text(line, marginLeft + 3, yPosition)
          yPosition += 4
        }
      }
      yPosition += 3
    })
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generated by VaxEvidence on ${format(new Date(), 'MMMM d, yyyy')}`,
      marginLeft,
      pageHeight - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginRight - 20,
      pageHeight - 10
    )
  }

  return doc.output('blob')
}

/**
 * Generate PDF report for activity audit log
 */
export async function generateAuditLogPDF(
  activityLogs: any[],
  fromDate?: string,
  toDate?: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginLeft = 20
  const marginRight = 20
  let yPosition = 20

  // Header
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Activity Audit Log', marginLeft, 25)
  doc.setFontSize(11)
  doc.text('VaxEvidence Platform', marginLeft, 33)
  
  yPosition = 50
  doc.setTextColor(0, 0, 0)

  // Date range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateRangeText = fromDate && toDate 
    ? `Period: ${format(new Date(fromDate), 'MMM d, yyyy')} - ${format(new Date(toDate), 'MMM d, yyyy')}`
    : `Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`
  doc.text(dateRangeText, marginLeft, yPosition)
  yPosition += 10

  // Activity entries
  activityLogs.forEach((log, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}`, marginLeft, yPosition)
    yPosition += 5

    doc.setFont('helvetica', 'normal')
    doc.text(`User: ${log.user?.email || 'Unknown'}`, marginLeft + 5, yPosition)
    yPosition += 4
    doc.text(`Action: ${log.action_type} - ${log.resource_type}`, marginLeft + 5, yPosition)
    yPosition += 4
    
    if (log.description) {
      const descLines = doc.splitTextToSize(`Description: ${log.description}`, pageWidth - marginLeft - marginRight - 5)
      for (const line of descLines) {
        if (yPosition > pageHeight - 25) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, marginLeft + 5, yPosition)
        yPosition += 4
      }
    }
    
    yPosition += 3
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `VaxEvidence Audit Log - Confidential`,
      marginLeft,
      pageHeight - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginRight - 20,
      pageHeight - 10
    )
  }

  return doc.output('blob')
}
