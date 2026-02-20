-- =============================================================================
-- PROTOCOL VERSIONS TABLE
-- =============================================================================
-- Immutable version snapshots for FDA 21 CFR Part 11 compliance.
-- Each version stores the complete protocol state at a point in time.
-- No UPDATE or DELETE allowed — versions are append-only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS protocol_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id   UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Full PICO snapshot
  title           TEXT NOT NULL,
  study_question  TEXT NOT NULL,
  population      TEXT NOT NULL,
  intervention    TEXT NOT NULL DEFAULT '',
  comparator      TEXT NOT NULL,
  outcomes        TEXT NOT NULL,
  design          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',

  -- Version metadata
  change_summary  TEXT NOT NULL DEFAULT '',
  content_hash    TEXT NOT NULL,

  -- Digital signature fields
  created_by      UUID NOT NULL,
  signed_by       UUID,
  signed_at       TIMESTAMPTZ,
  signature_meaning TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT protocol_versions_unique_number UNIQUE (protocol_id, version_number)
);

-- Index for fast lookups by protocol
CREATE INDEX IF NOT EXISTS idx_protocol_versions_protocol_id
  ON protocol_versions(protocol_id);

-- Index for ordering versions
CREATE INDEX IF NOT EXISTS idx_protocol_versions_protocol_number
  ON protocol_versions(protocol_id, version_number DESC);

-- =============================================================================
-- RLS POLICIES — Immutable (SELECT + INSERT only)
-- =============================================================================

ALTER TABLE protocol_versions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read versions
CREATE POLICY "protocol_versions_select"
  ON protocol_versions FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert versions
CREATE POLICY "protocol_versions_insert"
  ON protocol_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No UPDATE or DELETE policies — versions are immutable
