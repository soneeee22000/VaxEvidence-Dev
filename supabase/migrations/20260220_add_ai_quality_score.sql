-- =============================================================================
-- AI Quality Score columns on evidence_items
-- =============================================================================
-- Adds nullable columns to store AI-generated quality assessments.
-- All columns are optional — existing evidence is unaffected.
-- =============================================================================

ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS ai_quality_score integer
    CHECK (ai_quality_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS ai_quality_grade text
    CHECK (ai_quality_grade IN ('A', 'B', 'C', 'D', 'F')),
  ADD COLUMN IF NOT EXISTS ai_quality_rationale text,
  ADD COLUMN IF NOT EXISTS ai_quality_scored_at timestamptz;

-- Index for filtering/sorting by quality score
CREATE INDEX IF NOT EXISTS idx_evidence_items_ai_quality_score
  ON evidence_items (ai_quality_score)
  WHERE ai_quality_score IS NOT NULL;
