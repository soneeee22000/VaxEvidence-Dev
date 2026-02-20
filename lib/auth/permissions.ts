/**
 * Workspace role-based access control (RBAC) utilities.
 *
 * Role hierarchy (highest to lowest):
 *   admin > lead > reviewer > viewer
 */

export const WORKSPACE_ROLES = ["admin", "lead", "reviewer", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

const ROLE_LEVELS: Record<WorkspaceRole, number> = {
  admin: 40,
  lead: 30,
  reviewer: 20,
  viewer: 10,
};

/**
 * Returns the numeric level of a role (higher = more permissions).
 */
export function getRoleLevel(role: WorkspaceRole): number {
  return ROLE_LEVELS[role];
}

/**
 * Checks if `role` is at least as privileged as `minimumRole`.
 */
export function isRoleAtLeast(
  role: WorkspaceRole,
  minimumRole: WorkspaceRole,
): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS[minimumRole];
}

/**
 * Returns a human-readable label for a role.
 */
export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    admin: "Admin",
    lead: "Lead Researcher",
    reviewer: "Reviewer",
    viewer: "View Only",
  };
  return labels[role];
}

// ---------------------------------------------------------------------------
// Permission checks — one function per action from the PRD permission matrix
// ---------------------------------------------------------------------------

/** Admin, Lead can create protocols. */
export function canCreateProtocol(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "lead");
}

/** Admin, Lead can edit protocols. */
export function canEditProtocol(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "lead");
}

/** Admin can delete any; Lead can delete own only. */
export function canDeleteProtocol(
  role: WorkspaceRole,
  protocolOwnerId: string,
  currentUserId: string,
): boolean {
  if (role === "admin") return true;
  if (role === "lead") return protocolOwnerId === currentUserId;
  return false;
}

/** Admin, Lead can add/edit evidence. */
export function canCreateEvidence(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "lead");
}

/** Admin, Lead, Reviewer can create comments. */
export function canCreateComment(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "reviewer");
}

/** Admin, Lead, Reviewer can submit reviews. */
export function canSubmitReview(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "reviewer");
}

/** Only Admin can manage workspace members (invite, remove, change roles). */
export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "admin";
}

/** Only Admin can manage workspace settings. */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "admin";
}

/** All roles can export reports. */
export function canExport(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "viewer");
}

/** All roles can view data. */
export function canViewData(role: WorkspaceRole): boolean {
  return isRoleAtLeast(role, "viewer");
}
