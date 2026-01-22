-- Add template tracking to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Track template usage
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  created_protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_usage_user ON template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON template_usage(template_id);

ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own template usage"
  ON template_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own template usage"
  ON template_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());
