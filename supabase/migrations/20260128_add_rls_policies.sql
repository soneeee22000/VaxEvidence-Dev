-- =============================================================================
-- RLS POLICIES FOR PROTOCOLS AND DATASETS TABLES
-- =============================================================================
-- Improved syntax per Supabase recommendations:
-- - Wrap auth.uid() in (SELECT auth.uid()) for stable query plans
-- - Add TO authenticated to target only authenticated users
-- - Add indexes for performance
-- =============================================================================

-- =============================================================================
-- PROTOCOLS TABLE RLS
-- =============================================================================

ALTER TABLE "protocols" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocols"
  ON "protocols" FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own protocols"
  ON "protocols" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own protocols"
  ON "protocols" FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own protocols"
  ON "protocols" FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_protocols_user_id ON "protocols"(user_id);

-- =============================================================================
-- DATASETS TABLE RLS
-- =============================================================================

ALTER TABLE "datasets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own datasets"
  ON "datasets" FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own datasets"
  ON "datasets" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own datasets"
  ON "datasets" FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own datasets"
  ON "datasets" FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON "datasets"(user_id);
