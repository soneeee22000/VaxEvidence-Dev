-- ============================================================================
-- Tighten RLS policies: remove overly permissive policies
-- ============================================================================
-- Issue H6: Several tables had (true) RLS policies that allow any
-- authenticated user to read/write any row regardless of ownership.
--
-- Tables already have correct ownership-scoped policies on {public} role,
-- but the overly permissive {authenticated} policies override them.
-- ============================================================================

-- 1. activity_logs: SELECT was (true) — scope to own rows only
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 2. protocol_evidence_links: drop 3 overly permissive {authenticated} policies
--    (correct ownership-scoped {public} policies already exist)
DROP POLICY IF EXISTS "Authenticated users can view evidence links" ON protocol_evidence_links;
DROP POLICY IF EXISTS "Authenticated users can create evidence links" ON protocol_evidence_links;
DROP POLICY IF EXISTS "Authenticated users can delete evidence links" ON protocol_evidence_links;

-- 3. protocol_dataset_links: drop 3 overly permissive {authenticated} policies
--    (correct ownership-scoped {public} policies already exist)
DROP POLICY IF EXISTS "Authenticated users can view dataset links" ON protocol_dataset_links;
DROP POLICY IF EXISTS "Authenticated users can create dataset links" ON protocol_dataset_links;
DROP POLICY IF EXISTS "Authenticated users can delete dataset links" ON protocol_dataset_links;
