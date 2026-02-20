-- =============================================================================
-- FULL-TEXT SEARCH INDEXES & PERFORMANCE INDEXES
-- =============================================================================
-- Adds generated tsvector columns with GIN indexes for full-text search
-- and performance indexes on commonly filtered/sorted columns.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- evidence_items: search_vector (title A, authors B, description C, journal D)
-- ---------------------------------------------------------------------------
ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(authors, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(journal, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_evidence_items_search_vector
  ON evidence_items USING GIN (search_vector);

-- Performance indexes for evidence_items
CREATE INDEX IF NOT EXISTS idx_evidence_items_updated_at
  ON evidence_items (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_items_type
  ON evidence_items (type);

CREATE INDEX IF NOT EXISTS idx_evidence_items_status
  ON evidence_items (status);

-- ---------------------------------------------------------------------------
-- datasets: search_vector (name A, description B, file_name C)
-- ---------------------------------------------------------------------------
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(file_name, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_datasets_search_vector
  ON datasets USING GIN (search_vector);

-- Performance indexes for datasets
CREATE INDEX IF NOT EXISTS idx_datasets_updated_at
  ON datasets (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_datasets_dataset_type
  ON datasets (dataset_type);

CREATE INDEX IF NOT EXISTS idx_datasets_status
  ON datasets (status);

-- ---------------------------------------------------------------------------
-- protocols: search_vector (title A, study_question B)
-- ---------------------------------------------------------------------------
ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(study_question, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_protocols_search_vector
  ON protocols USING GIN (search_vector);

-- Performance indexes for protocols
CREATE INDEX IF NOT EXISTS idx_protocols_updated_at
  ON protocols (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_protocols_status
  ON protocols (status);
