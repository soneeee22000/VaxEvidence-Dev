-- =============================================================================
-- FIX: comments_with_user view security issues
-- =============================================================================
-- Problem: View uses SECURITY DEFINER and directly joins auth.users,
-- exposing user data to anon role.
-- Fix: Use a minimal security-definer function (with locked search_path)
-- to look up emails, rebuild the view as SECURITY INVOKER, and
-- revoke anon access.
-- =============================================================================

-- 1. Create a minimal helper function (security definer with fixed search_path)
CREATE OR REPLACE FUNCTION public.get_user_email(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = uid;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.get_user_email(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_email(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;

-- 2. Recreate the view as SECURITY INVOKER (caller's permissions apply)
DROP VIEW IF EXISTS public.comments_with_user;

CREATE VIEW public.comments_with_user
WITH (security_invoker = on)
AS
SELECT
  c.id,
  c.user_id,
  c.resource_type,
  c.resource_id,
  c.parent_id,
  c.content,
  c.mentions,
  c.is_edited,
  c.is_deleted,
  c.created_at,
  c.updated_at,
  public.get_user_email(c.user_id) AS user_email
FROM public.comments c;

-- 3. Only authenticated users can read the view (no anon access)
REVOKE ALL ON public.comments_with_user FROM PUBLIC;
REVOKE ALL ON public.comments_with_user FROM anon;
GRANT SELECT ON public.comments_with_user TO authenticated;
