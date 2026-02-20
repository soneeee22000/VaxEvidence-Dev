-- =============================================================================
-- Migration: Create Workspace Tables for Multi-Tenant Teams & RBAC
-- =============================================================================
-- Creates: workspaces, workspace_members, workspace_invitations
-- Enables RLS on all new tables with appropriate policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. WORKSPACES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Members can view workspaces they belong to
CREATE POLICY "Members can view their workspaces"
    ON workspaces FOR SELECT
    USING (
        id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Any authenticated user can create a workspace
CREATE POLICY "Authenticated users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Only admins can update workspace settings
CREATE POLICY "Admins can update workspaces"
    ON workspaces FOR UPDATE
    USING (
        id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete workspaces
CREATE POLICY "Admins can delete workspaces"
    ON workspaces FOR DELETE
    USING (
        id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 2. WORKSPACE MEMBERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'lead', 'reviewer', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their workspaces
CREATE POLICY "Members can view workspace members"
    ON workspace_members FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members wm
            WHERE wm.user_id = auth.uid()
        )
    );

-- Only admins can add members
CREATE POLICY "Admins can add members"
    ON workspace_members FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members wm
            WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
        )
        -- Or the user is creating their own membership (for workspace creation)
        OR (user_id = auth.uid() AND role = 'admin')
    );

-- Only admins can update member roles
CREATE POLICY "Admins can update member roles"
    ON workspace_members FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members wm
            WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
        )
    );

-- Admins can remove members; members can remove themselves
CREATE POLICY "Admins can remove members or self-remove"
    ON workspace_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR workspace_id IN (
            SELECT workspace_id FROM workspace_members wm
            WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 3. WORKSPACE INVITATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('lead', 'reviewer', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
    UNIQUE(workspace_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON workspace_invitations(status);

-- RLS
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations for their workspaces; invitees can see their own
CREATE POLICY "Admins and invitees can view invitations"
    ON workspace_invitations FOR SELECT
    USING (
        -- Workspace admins can see all invitations
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
        -- Invitees can see invitations sent to their email
        OR email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
    ON workspace_invitations FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Invitees can update their own invitations (accept/decline)
CREATE POLICY "Invitees can update their invitations"
    ON workspace_invitations FOR UPDATE
    USING (
        email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
    ON workspace_invitations FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
