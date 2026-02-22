-- Fix self-referential RLS on workspace_members
-- Applied via Supabase MCP migration: 20260222164617
--
-- The old policy "Members can view workspace members" referenced workspace_members
-- in its own subquery, causing infinite recursion under RLS (empty results).
-- Fixed by simplifying to direct user_id check.

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;

CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid());
