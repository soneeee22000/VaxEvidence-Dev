-- =============================================================================
-- Phase 10: Notifications table for @mentions and in-app notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'mention', 'comment', 'review_requested', 'review_completed', 'protocol_updated'
  )),
  title       TEXT NOT NULL,
  body        TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('protocol', 'comment', 'review')),
  resource_id UUID NOT NULL,
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fast per-user queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read, created_at DESC);

-- Index for real-time subscriptions filtered by user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Any authenticated user can insert notifications (for mentions etc.)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
