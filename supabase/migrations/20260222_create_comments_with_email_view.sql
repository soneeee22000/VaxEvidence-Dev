-- Create comments_with_user view to join user emails
-- Applied via Supabase MCP migration: 20260222160545
-- Updated via: 20260222163153 (removed security_invoker)

-- View runs as definer (postgres) to access auth.users
-- RLS on comments table still applies for direct access
CREATE OR REPLACE VIEW public.comments_with_user AS
SELECT c.*, u.email AS user_email
FROM public.comments c
LEFT JOIN auth.users u ON u.id = c.user_id;

GRANT SELECT ON public.comments_with_user TO authenticated;
GRANT SELECT ON public.comments_with_user TO anon;
