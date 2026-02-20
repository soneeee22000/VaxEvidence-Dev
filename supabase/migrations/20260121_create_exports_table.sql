-- =============================================================================
-- EXPORTS TABLE MIGRATION
-- =============================================================================
-- Track export history and allow users to re-download recent exports
-- Auto-delete exports after 7 days
-- =============================================================================

-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL, -- 'protocol_pdf', 'protocol_word', 'bibliography', 'activity_log', 'bulk'
  resource_id UUID, -- Protocol/Evidence/Dataset ID (nullable for bulk exports)
  file_path TEXT, -- Supabase Storage path (nullable if direct download)
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed'
  metadata JSONB, -- Export options (include_comments, template_style, etc.)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days') NOT NULL,
  
  -- Constraints
  CONSTRAINT exports_status_check CHECK (status IN ('pending', 'completed', 'failed')),
  CONSTRAINT exports_type_check CHECK (export_type IN ('protocol_pdf', 'protocol_word', 'bibliography', 'activity_log', 'bulk'))
);

-- Create indexes for better query performance
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);
CREATE INDEX idx_exports_expires_at ON exports(expires_at);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_type ON exports(export_type);

-- Enable Row Level Security
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own exports
CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own exports
CREATE POLICY "Users can create own exports"
  ON exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exports (for status changes)
CREATE POLICY "Users can update own exports"
  ON exports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exports
CREATE POLICY "Users can delete own exports"
  ON exports FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE exports IS 'Track export history for users';
COMMENT ON COLUMN exports.export_type IS 'Type of export: protocol_pdf, protocol_word, bibliography, activity_log, bulk';
COMMENT ON COLUMN exports.resource_id IS 'ID of the exported resource (protocol, evidence, etc.)';
COMMENT ON COLUMN exports.file_path IS 'Path to the file in Supabase Storage if stored';
COMMENT ON COLUMN exports.status IS 'Export status: pending, completed, failed';
COMMENT ON COLUMN exports.metadata IS 'JSON object with export options and settings';
COMMENT ON COLUMN exports.expires_at IS 'Exports auto-delete after 7 days';
