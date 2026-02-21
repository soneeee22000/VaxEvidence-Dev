-- Phase 8.3: Risk of bias assessments table

CREATE TABLE IF NOT EXISTS risk_of_bias_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('rob2', 'robins_i')),
  domains JSONB NOT NULL DEFAULT '{}',
  overall_judgment TEXT CHECK (overall_judgment IN ('low', 'some_concerns', 'high', 'critical')),
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, evidence_id, tool)
);

CREATE INDEX IF NOT EXISTS idx_rob_assessments_protocol ON risk_of_bias_assessments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_rob_assessments_evidence ON risk_of_bias_assessments(evidence_id);

ALTER TABLE risk_of_bias_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view RoB assessments" ON risk_of_bias_assessments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert RoB assessments" ON risk_of_bias_assessments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update RoB assessments" ON risk_of_bias_assessments
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete RoB assessments" ON risk_of_bias_assessments
  FOR DELETE USING (true);
