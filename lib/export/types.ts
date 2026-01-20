// =============================================================================
// EXPORT TYPES
// =============================================================================
// TypeScript interfaces for export functionality
// =============================================================================

export type ExportFormat = 'pdf' | 'word' | 'csv' | 'json'
export type BibliographyFormat = 'bibtex' | 'apa' | 'mla' | 'chicago' | 'ris'
export type TemplateStyle = 'professional' | 'academic' | 'regulatory'
export type ExportStatus = 'pending' | 'completed' | 'failed'
export type ExportType = 'protocol_pdf' | 'protocol_word' | 'bibliography' | 'activity_log' | 'bulk'

/**
 * Options for protocol PDF/Word export
 */
export interface ProtocolExportOptions {
  includeEvidence: boolean
  includeDatasets: boolean
  includeComments: boolean
  includeReviews: boolean
  templateStyle: TemplateStyle
}

/**
 * Export record in database
 */
export interface ExportRecord {
  id: string
  user_id: string
  export_type: ExportType
  resource_id: string | null
  file_path: string | null
  status: ExportStatus
  metadata: Record<string, any> | null
  created_at: string
  expires_at: string
}

/**
 * Bibliography export options
 */
export interface BibliographyExportOptions {
  format: BibliographyFormat
  protocolId?: string // If exporting for a specific protocol
}

/**
 * Activity log export options
 */
export interface ActivityExportOptions {
  format: 'csv' | 'pdf'
  fromDate?: string
  toDate?: string
  userId?: string
  resourceType?: string
  actionType?: string
}

/**
 * Workspace export options
 */
export interface WorkspaceExportOptions {
  includeProtocols: boolean
  includeEvidence: boolean
  includeDatasets: boolean
  includeComments: boolean
  format: 'zip' | 'json'
}
