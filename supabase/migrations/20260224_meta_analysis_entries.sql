-- Phase 8.5: Meta-analysis entries table for forest plots

CREATE TABLE IF NOT EXISTS meta_analysis_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL,
  study_label TEXT NOT NULL,
  effect_size DOUBLE PRECISION NOT NULL,
  ci_lower DOUBLE PRECISION NOT NULL,
  ci_upper DOUBLE PRECISION NOT NULL,
  weight DOUBLE PRECISION,
  subgroup TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_analysis_protocol ON meta_analysis_entries(protocol_id);

ALTER TABLE meta_analysis_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meta-analysis entries" ON meta_analysis_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert meta-analysis entries" ON meta_analysis_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update meta-analysis entries" ON meta_analysis_entries
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete meta-analysis entries" ON meta_analysis_entries
  FOR DELETE USING (true);
