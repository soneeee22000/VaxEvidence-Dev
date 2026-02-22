-- =============================================================================
-- USER FEEDBACK & CUSTOM EVENTS
-- =============================================================================
-- Supports: in-app feedback collection + lightweight custom analytics events.
-- =============================================================================

-- User feedback table
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug','feature_request','general','praise')),
  message text NOT NULL,
  email text,
  page_url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.user_feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT USING (user_id = auth.uid());

-- Custom analytics events table
CREATE TABLE public.custom_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  page_url text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_events_name
  ON public.custom_events(event_name, created_at DESC);

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON public.custom_events FOR INSERT WITH CHECK (true);
