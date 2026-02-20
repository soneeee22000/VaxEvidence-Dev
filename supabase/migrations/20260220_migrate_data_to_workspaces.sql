-- =============================================================================
-- Migration: Populate workspace_id for Existing Data
-- =============================================================================
-- 1. Create a "Personal" workspace for each user who has data
-- 2. Add them as admin of their personal workspace
-- 3. Update all existing rows to point to their personal workspace
-- 4. Make workspace_id NOT NULL
-- 5. Update RLS policies to be workspace-scoped
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Create Personal workspaces for existing users
-- Gather all unique user_ids from data tables
-- -----------------------------------------------------------------------------
INSERT INTO workspaces (id, name, slug, owner_id)
SELECT
    gen_random_uuid(),
    'Personal',
    'personal-' || SUBSTRING(u.user_id::text, 1, 8),
    u.user_id
FROM (
    SELECT DISTINCT user_id FROM protocols
    UNION
    SELECT DISTINCT user_id FROM evidence_items
    UNION
    SELECT DISTINCT user_id FROM datasets
    UNION
    SELECT DISTINCT user_id FROM activity_logs WHERE user_id IS NOT NULL
) u
WHERE u.user_id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 2: Add each user as admin of their personal workspace
-- -----------------------------------------------------------------------------
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'admin'
FROM workspaces w
WHERE w.name = 'Personal'
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 3: Update all existing data rows with their owner's workspace_id
-- -----------------------------------------------------------------------------
UPDATE protocols p
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = p.user_id
  AND w.name = 'Personal'
  AND p.workspace_id IS NULL;

UPDATE evidence_items e
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = e.user_id
  AND w.name = 'Personal'
  AND e.workspace_id IS NULL;

UPDATE datasets d
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = d.user_id
  AND w.name = 'Personal'
  AND d.workspace_id IS NULL;

UPDATE comments c
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = c.user_id
  AND w.name = 'Personal'
  AND c.workspace_id IS NULL;

UPDATE reviews r
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = r.requester_id
  AND w.name = 'Personal'
  AND r.workspace_id IS NULL;

UPDATE activity_logs a
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = a.user_id
  AND w.name = 'Personal'
  AND a.workspace_id IS NULL;

UPDATE exports ex
SET workspace_id = w.id
FROM workspaces w
WHERE w.owner_id = ex.user_id
  AND w.name = 'Personal'
  AND ex.workspace_id IS NULL;

-- -----------------------------------------------------------------------------
-- Step 4: Make workspace_id NOT NULL (now that all data is migrated)
-- Only set NOT NULL if no nulls remain (safety check)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Only alter if no nulls exist
    IF NOT EXISTS (SELECT 1 FROM protocols WHERE workspace_id IS NULL LIMIT 1) THEN
        ALTER TABLE protocols ALTER COLUMN workspace_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM evidence_items WHERE workspace_id IS NULL LIMIT 1) THEN
        ALTER TABLE evidence_items ALTER COLUMN workspace_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM datasets WHERE workspace_id IS NULL LIMIT 1) THEN
        ALTER TABLE datasets ALTER COLUMN workspace_id SET NOT NULL;
    END IF;
END $$;

-- Comments, reviews, activity_logs, exports may have orphaned rows
-- Leave workspace_id nullable for those tables for now

-- -----------------------------------------------------------------------------
-- Step 5: Update RLS policies to be workspace-scoped
-- Drop old user-level policies and create workspace-scoped ones
-- -----------------------------------------------------------------------------

-- PROTOCOLS: workspace-scoped access
DROP POLICY IF EXISTS "Users can view own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can create own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can update own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can delete own protocols" ON protocols;

CREATE POLICY "Members can view workspace protocols"
    ON protocols FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and leads can create protocols"
    ON protocols FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins and leads can update protocols"
    ON protocols FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins can delete any protocol; leads can delete own"
    ON protocols FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        OR (
            user_id = auth.uid()
            AND workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid() AND role = 'lead'
            )
        )
    );

-- EVIDENCE_ITEMS: workspace-scoped access
DROP POLICY IF EXISTS "Users can view own evidence" ON evidence_items;
DROP POLICY IF EXISTS "Users can create own evidence" ON evidence_items;
DROP POLICY IF EXISTS "Users can update own evidence" ON evidence_items;
DROP POLICY IF EXISTS "Users can delete own evidence" ON evidence_items;

CREATE POLICY "Members can view workspace evidence"
    ON evidence_items FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and leads can create evidence"
    ON evidence_items FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins and leads can update evidence"
    ON evidence_items FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins and leads can delete evidence"
    ON evidence_items FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

-- DATASETS: workspace-scoped access
DROP POLICY IF EXISTS "Users can view own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete own datasets" ON datasets;

CREATE POLICY "Members can view workspace datasets"
    ON datasets FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and leads can create datasets"
    ON datasets FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins and leads can update datasets"
    ON datasets FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

CREATE POLICY "Admins and leads can delete datasets"
    ON datasets FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
        )
    );

-- COMMENTS: workspace-scoped (admins, leads, reviewers can create)
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Members can view workspace comments"
    ON comments FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins leads and reviewers can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'lead', 'reviewer')
        )
    );

CREATE POLICY "Users can update own comments in workspace"
    ON comments FOR UPDATE
    USING (
        user_id = auth.uid()
        AND workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own comments in workspace"
    ON comments FOR DELETE
    USING (
        user_id = auth.uid()
        AND workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );
