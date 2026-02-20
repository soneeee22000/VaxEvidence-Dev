-- =============================================================================
-- COMPLETE RLS POLICIES FOR ALL REMAINING TABLES
-- =============================================================================
-- This migration adds RLS policies to tables that were missing them:
-- evidence_items, reviews, comments, protocol_evidence_links,
-- protocol_dataset_links, activity_logs, template_usage
-- Also adds intervention column to protocols table.
-- =============================================================================

-- =============================================================================
-- PROTOCOLS: Add intervention column (PICO field)
-- =============================================================================

ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "intervention" TEXT DEFAULT '';

-- =============================================================================
-- EVIDENCE_ITEMS TABLE RLS
-- =============================================================================

ALTER TABLE "evidence_items" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own evidence" ON "evidence_items";
CREATE POLICY "Users can view own evidence"
  ON "evidence_items" FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own evidence" ON "evidence_items";
CREATE POLICY "Users can create own evidence"
  ON "evidence_items" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own evidence" ON "evidence_items";
CREATE POLICY "Users can update own evidence"
  ON "evidence_items" FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own evidence" ON "evidence_items";
CREATE POLICY "Users can delete own evidence"
  ON "evidence_items" FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_evidence_items_user_id ON "evidence_items"(user_id);

-- =============================================================================
-- REVIEWS TABLE RLS
-- =============================================================================

ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reviews they requested or are assigned" ON "reviews";
CREATE POLICY "Users can view reviews they requested or are assigned"
  ON "reviews" FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = requester_id
    OR (SELECT auth.uid()) = reviewer_id
  );

DROP POLICY IF EXISTS "Users can create review requests" ON "reviews";
CREATE POLICY "Users can create review requests"
  ON "reviews" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = requester_id);

DROP POLICY IF EXISTS "Users can update reviews they are assigned or requested" ON "reviews";
CREATE POLICY "Users can update reviews they are assigned or requested"
  ON "reviews" FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = requester_id
    OR (SELECT auth.uid()) = reviewer_id
  );

DROP POLICY IF EXISTS "Users can delete reviews they requested" ON "reviews";
CREATE POLICY "Users can delete reviews they requested"
  ON "reviews" FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = requester_id);

CREATE INDEX IF NOT EXISTS idx_reviews_requester_id ON "reviews"(requester_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON "reviews"(reviewer_id);

-- =============================================================================
-- COMMENTS TABLE RLS
-- =============================================================================

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

-- Comments are viewable by all authenticated users (collaboration feature)
DROP POLICY IF EXISTS "Authenticated users can view comments" ON "comments";
CREATE POLICY "Authenticated users can view comments"
  ON "comments" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON "comments";
CREATE POLICY "Users can create comments"
  ON "comments" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON "comments";
CREATE POLICY "Users can update own comments"
  ON "comments" FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON "comments";
CREATE POLICY "Users can delete own comments"
  ON "comments" FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON "comments"(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON "comments"(resource_type, resource_id);

-- =============================================================================
-- PROTOCOL_EVIDENCE_LINKS TABLE RLS
-- =============================================================================

ALTER TABLE "protocol_evidence_links" ENABLE ROW LEVEL SECURITY;

-- Links are viewable by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view evidence links" ON "protocol_evidence_links";
CREATE POLICY "Authenticated users can view evidence links"
  ON "protocol_evidence_links" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create evidence links" ON "protocol_evidence_links";
CREATE POLICY "Authenticated users can create evidence links"
  ON "protocol_evidence_links" FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete evidence links" ON "protocol_evidence_links";
CREATE POLICY "Authenticated users can delete evidence links"
  ON "protocol_evidence_links" FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- PROTOCOL_DATASET_LINKS TABLE RLS
-- =============================================================================

ALTER TABLE "protocol_dataset_links" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view dataset links" ON "protocol_dataset_links";
CREATE POLICY "Authenticated users can view dataset links"
  ON "protocol_dataset_links" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create dataset links" ON "protocol_dataset_links";
CREATE POLICY "Authenticated users can create dataset links"
  ON "protocol_dataset_links" FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete dataset links" ON "protocol_dataset_links";
CREATE POLICY "Authenticated users can delete dataset links"
  ON "protocol_dataset_links" FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- ACTIVITY_LOGS TABLE — Create if not exists, then RLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS "activity_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON "activity_logs";
CREATE POLICY "Authenticated users can view activity logs"
  ON "activity_logs" FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create own activity logs" ON "activity_logs";
CREATE POLICY "Users can create own activity logs"
  ON "activity_logs" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON "activity_logs"(user_id);

-- =============================================================================
-- TEMPLATE_USAGE TABLE — Create if not exists, then RLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS "template_usage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  created_protocol_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "template_usage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own template usage" ON "template_usage";
CREATE POLICY "Users can view own template usage"
  ON "template_usage" FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own template usage" ON "template_usage";
CREATE POLICY "Users can create own template usage"
  ON "template_usage" FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_template_usage_user_id ON "template_usage"(user_id);
