import { format } from 'date-fns'

// =============================================================================
// CSV GENERATOR
// =============================================================================
// Generate CSV files for activity logs and data exports
// =============================================================================

/**
 * Generate CSV from activity log entries
 */
export function generateActivityCSV(activityLogs: any[]): string {
  const headers = ['Timestamp', 'User', 'Action Type', 'Resource Type', 'Resource ID', 'Description']

  const rows = activityLogs.map((log) => [
    format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
    log.user?.email || 'Unknown',
    log.action_type || '',
    log.resource_type || '',
    log.resource_id || '',
    (log.description || '').replace(/"/g, '""'), // Escape quotes
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate CSV from protocols list
 */
export function generateProtocolsCSV(protocols: any[]): string {
  const headers = [
    'ID',
    'Title',
    'Status',
    'Study Question',
    'Population',
    'Comparator',
    'Outcomes',
    'Design',
    'Created At',
    'Updated At',
  ]

  const rows = protocols.map((protocol) => [
    protocol.id,
    (protocol.title || '').replace(/"/g, '""'),
    protocol.status || '',
    (protocol.study_question || '').replace(/"/g, '""'),
    (protocol.population || '').replace(/"/g, '""'),
    (protocol.comparator || '').replace(/"/g, '""'),
    (protocol.outcomes || '').replace(/"/g, '""'),
    (protocol.design || '').replace(/"/g, '""'),
    format(new Date(protocol.created_at), 'yyyy-MM-dd HH:mm:ss'),
    format(new Date(protocol.updated_at), 'yyyy-MM-dd HH:mm:ss'),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate CSV from evidence items
 */
export function generateEvidenceCSV(evidenceItems: any[]): string {
  const headers = [
    'ID',
    'Type',
    'Title',
    'Description',
    'Authors',
    'Journal',
    'DOI',
    'Regulatory Body',
    'Document Type',
    'Source URL',
    'Publication Date',
    'Tags',
    'Status',
    'Created At',
  ]

  const rows = evidenceItems.map((item) => {
    const evidence = item.evidence_items || item
    return [
      evidence.id,
      evidence.type || '',
      (evidence.title || '').replace(/"/g, '""'),
      (evidence.description || '').replace(/"/g, '""'),
      (evidence.authors || '').replace(/"/g, '""'),
      (evidence.journal || '').replace(/"/g, '""'),
      evidence.doi || '',
      (evidence.regulatory_body || '').replace(/"/g, '""'),
      (evidence.document_type || '').replace(/"/g, '""'),
      evidence.source_url || '',
      evidence.publication_date || '',
      Array.isArray(evidence.tags) ? evidence.tags.join('; ') : '',
      evidence.status || '',
      format(new Date(evidence.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate CSV from datasets
 */
export function generateDatasetsCSV(datasets: any[]): string {
  const headers = [
    'ID',
    'Name',
    'Description',
    'Dataset Type',
    'File Name',
    'File Size (KB)',
    'Row Count',
    'Column Count',
    'Status',
    'Tags',
    'Created At',
  ]

  const rows = datasets.map((item) => {
    const dataset = item.datasets || item
    return [
      dataset.id,
      (dataset.name || '').replace(/"/g, '""'),
      (dataset.description || '').replace(/"/g, '""'),
      dataset.dataset_type || '',
      dataset.file_name || '',
      dataset.file_size ? (dataset.file_size / 1024).toFixed(2) : '',
      dataset.row_count || '',
      dataset.column_count || '',
      dataset.status || '',
      Array.isArray(dataset.tags) ? dataset.tags.join('; ') : '',
      format(new Date(dataset.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate CSV from comments
 */
export function generateCommentsCSV(comments: any[]): string {
  const headers = [
    'ID',
    'Resource Type',
    'Resource ID',
    'User Email',
    'Content',
    'Parent Comment ID',
    'Created At',
    'Updated At',
  ]

  const rows = comments.map((comment) => [
    comment.id,
    comment.resource_type || '',
    comment.resource_id || '',
    comment.user?.email || 'Unknown',
    (comment.content || '').replace(/"/g, '""'),
    comment.parent_id || '',
    format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm:ss'),
    comment.updated_at ? format(new Date(comment.updated_at), 'yyyy-MM-dd HH:mm:ss') : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate CSV from reviews
 */
export function generateReviewsCSV(reviews: any[]): string {
  const headers = [
    'ID',
    'Resource Type',
    'Resource ID',
    'Requester Email',
    'Reviewer Email',
    'Status',
    'Feedback',
    'Requested At',
    'Reviewed At',
  ]

  const rows = reviews.map((review) => [
    review.id,
    review.resource_type || '',
    review.resource_id || '',
    review.requester?.email || 'Unknown',
    review.reviewer?.email || 'Unknown',
    review.status || '',
    (review.feedback || '').replace(/"/g, '""'),
    format(new Date(review.requested_at), 'yyyy-MM-dd HH:mm:ss'),
    review.reviewed_at ? format(new Date(review.reviewed_at), 'yyyy-MM-dd HH:mm:ss') : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
