-- Phase 8.1: Screening decisions table for PRISMA systematic review workflow

CREATE TABLE IF NOT EXISTS screening_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('identification', 'screening', 'eligibility', 'included')),
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'include', 'exclude', 'duplicate')),
  exclusion_reason TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, evidence_id, stage)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_screening_decisions_protocol ON screening_decisions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_screening_decisions_protocol_stage ON screening_decisions(protocol_id, stage);
CREATE INDEX IF NOT EXISTS idx_screening_decisions_evidence ON screening_decisions(evidence_id);

-- RLS policies
ALTER TABLE screening_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view screening decisions" ON screening_decisions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert screening decisions" ON screening_decisions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update screening decisions" ON screening_decisions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete screening decisions" ON screening_decisions
  FOR DELETE USING (true);
