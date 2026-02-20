import { z } from "zod";

/**
 * Workspace roles and invitation roles.
 */
export const WORKSPACE_ROLES = ["admin", "lead", "reviewer", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Roles that can be assigned via invitation (admin is not invitable). */
export const INVITATION_ROLES = ["lead", "reviewer", "viewer"] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

/**
 * Workspace slug validation — alphanumeric + hyphens, 1-50 chars.
 */
export const workspaceSlugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(50, "Slug must be 50 characters or less")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens only",
  );

/**
 * Create workspace schema.
 */
export const workspaceCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100, "Name must be 100 characters or less"),
  slug: workspaceSlugSchema.optional(),
});

export type WorkspaceCreateValues = z.infer<typeof workspaceCreateSchema>;

/**
 * Update workspace schema (partial).
 */
export const workspaceUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100)
    .optional(),
  settings: z.record(z.unknown()).optional(),
});

export type WorkspaceUpdateValues = z.infer<typeof workspaceUpdateSchema>;

/**
 * Invitation creation schema.
 * Admin cannot be invited — only lead, reviewer, viewer.
 */
export const invitationCreateSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  role: z.enum(INVITATION_ROLES, {
    errorMap: () => ({ message: "Role must be lead, reviewer, or viewer" }),
  }),
});

export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>;

/**
 * Member role update schema.
 */
export const memberRoleUpdateSchema = z.object({
  role: z.enum(WORKSPACE_ROLES, {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export type MemberRoleUpdateValues = z.infer<typeof memberRoleUpdateSchema>;

/**
 * Full workspace type (as returned from database).
 */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace member type (as returned from database).
 */
export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  user_email?: string;
}

/**
 * Workspace invitation type (as returned from database).
 */
export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: InvitationRole;
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  expires_at: string;
  workspace_name?: string;
}

/**
 * Generates a URL-safe slug from a workspace name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}
