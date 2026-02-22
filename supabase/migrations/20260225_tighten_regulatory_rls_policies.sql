-- ============================================================================
-- Tighten RLS on gcp_compliance and reporting_checklists
-- ============================================================================
-- Found by Supabase security advisor: all policies were (true).
-- Replace with protocol-ownership-scoped policies.
-- ============================================================================

-- gcp_compliance: replace all 4 permissive policies
DROP POLICY IF EXISTS "Authenticated users can select gcp compliance" ON gcp_compliance;
DROP POLICY IF EXISTS "Authenticated users can insert gcp compliance" ON gcp_compliance;
DROP POLICY IF EXISTS "Authenticated users can update gcp compliance" ON gcp_compliance;
DROP POLICY IF EXISTS "Authenticated users can delete gcp compliance" ON gcp_compliance;

CREATE POLICY "Users can view own gcp compliance"
  ON gcp_compliance FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = gcp_compliance.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert own gcp compliance"
  ON gcp_compliance FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = gcp_compliance.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update own gcp compliance"
  ON gcp_compliance FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = gcp_compliance.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own gcp compliance"
  ON gcp_compliance FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = gcp_compliance.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

-- reporting_checklists: replace all 4 permissive policies
DROP POLICY IF EXISTS "Authenticated users can select reporting checklists" ON reporting_checklists;
DROP POLICY IF EXISTS "Authenticated users can insert reporting checklists" ON reporting_checklists;
DROP POLICY IF EXISTS "Authenticated users can update reporting checklists" ON reporting_checklists;
DROP POLICY IF EXISTS "Authenticated users can delete reporting checklists" ON reporting_checklists;

CREATE POLICY "Users can view own reporting checklists"
  ON reporting_checklists FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = reporting_checklists.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert own reporting checklists"
  ON reporting_checklists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = reporting_checklists.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update own reporting checklists"
  ON reporting_checklists FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = reporting_checklists.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own reporting checklists"
  ON reporting_checklists FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM protocols
    WHERE protocols.id = reporting_checklists.protocol_id
      AND protocols.user_id = (SELECT auth.uid())
  ));
