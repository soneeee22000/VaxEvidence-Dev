-- =============================================================================
-- Migration: Add workspace_id to All Data Tables
-- =============================================================================
-- Adds workspace_id (nullable initially) to all existing data tables.
-- The data migration (next file) will populate these and make them NOT NULL.
-- =============================================================================

-- Add workspace_id column to each data table
ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE evidence_items
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE exports
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Indexes for workspace-scoped queries
CREATE INDEX IF NOT EXISTS idx_protocols_workspace_id ON protocols(workspace_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_workspace_id ON evidence_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_datasets_workspace_id ON datasets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reviews_workspace_id ON reviews(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_exports_workspace_id ON exports(workspace_id);
