-- Create screening_decisions, risk_of_bias_assessments, meta_analysis_entries, notifications tables
-- Applied via Supabase MCP migration: 20260222160342

-- Screening decisions
CREATE TABLE IF NOT EXISTS public.screening_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('identification','screening','eligibility','included')),
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','include','exclude','duplicate')),
  exclusion_reason text,
  notes text,
  decided_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, evidence_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_screening_protocol ON public.screening_decisions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_screening_evidence ON public.screening_decisions(evidence_id);

ALTER TABLE public.screening_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view screening decisions for their protocols"
  ON public.screening_decisions FOR SELECT
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert screening decisions for their protocols"
  ON public.screening_decisions FOR INSERT
  WITH CHECK (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can update screening decisions for their protocols"
  ON public.screening_decisions FOR UPDATE
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete screening decisions for their protocols"
  ON public.screening_decisions FOR DELETE
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

-- Risk of bias assessments
CREATE TABLE IF NOT EXISTS public.risk_of_bias_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('RoB2','ROBINS-I')),
  overall_judgment text NOT NULL DEFAULT 'pending' CHECK (overall_judgment IN ('low','some_concerns','high','pending')),
  domains jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, evidence_id, tool)
);

CREATE INDEX IF NOT EXISTS idx_rob_protocol ON public.risk_of_bias_assessments(protocol_id);

ALTER TABLE public.risk_of_bias_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view RoB for their protocols"
  ON public.risk_of_bias_assessments FOR SELECT
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert RoB for their protocols"
  ON public.risk_of_bias_assessments FOR INSERT
  WITH CHECK (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can update RoB for their protocols"
  ON public.risk_of_bias_assessments FOR UPDATE
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete RoB for their protocols"
  ON public.risk_of_bias_assessments FOR DELETE
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

-- Meta-analysis entries
CREATE TABLE IF NOT EXISTS public.meta_analysis_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  study_label text NOT NULL,
  effect_size double precision NOT NULL,
  ci_lower double precision NOT NULL,
  ci_upper double precision NOT NULL,
  weight double precision DEFAULT 1.0,
  subgroup text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_protocol ON public.meta_analysis_entries(protocol_id);

ALTER TABLE public.meta_analysis_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage meta-analysis for their protocols"
  ON public.meta_analysis_entries FOR ALL
  USING (protocol_id IN (SELECT id FROM public.protocols WHERE user_id = auth.uid()));

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention','comment','review_requested','review_completed','protocol_updated')),
  title text NOT NULL,
  body text,
  resource_type text NOT NULL CHECK (resource_type IN ('protocol','comment','review')),
  resource_id uuid NOT NULL,
  protocol_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
