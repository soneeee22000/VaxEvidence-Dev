import { describe, it, expect } from "vitest";
import {
  workspaceCreateSchema,
  workspaceUpdateSchema,
  invitationCreateSchema,
  memberRoleUpdateSchema,
  workspaceSlugSchema,
  WORKSPACE_ROLES,
  INVITATION_ROLES,
} from "@/lib/validators/workspace";

describe("workspaceCreateSchema", () => {
  it("accepts valid workspace", () => {
    const result = workspaceCreateSchema.safeParse({
      name: "My Research Team",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = workspaceCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = workspaceCreateSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = workspaceCreateSchema.safeParse({ name: "  My Team  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Team");
    }
  });

  it("accepts optional slug", () => {
    const result = workspaceCreateSchema.safeParse({
      name: "My Team",
      slug: "my-team",
    });
    expect(result.success).toBe(true);
  });
});

describe("workspaceUpdateSchema", () => {
  it("accepts partial update with name", () => {
    const result = workspaceUpdateSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = workspaceUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts settings update", () => {
    const result = workspaceUpdateSchema.safeParse({
      settings: { theme: "dark" },
    });
    expect(result.success).toBe(true);
  });
});

describe("invitationCreateSchema", () => {
  it("accepts valid invitation", () => {
    const result = invitationCreateSchema.safeParse({
      email: "colleague@university.edu",
      role: "reviewer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = invitationCreateSchema.safeParse({
      email: "not-email",
      role: "reviewer",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all invitation roles", () => {
    for (const role of INVITATION_ROLES) {
      const result = invitationCreateSchema.safeParse({
        email: "test@example.com",
        role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects admin as invitation role", () => {
    const result = invitationCreateSchema.safeParse({
      email: "test@example.com",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("memberRoleUpdateSchema", () => {
  it("accepts valid role update", () => {
    const result = memberRoleUpdateSchema.safeParse({ role: "lead" });
    expect(result.success).toBe(true);
  });

  it("accepts all workspace roles", () => {
    for (const role of WORKSPACE_ROLES) {
      const result = memberRoleUpdateSchema.safeParse({ role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = memberRoleUpdateSchema.safeParse({ role: "superadmin" });
    expect(result.success).toBe(false);
  });
});

describe("workspaceSlugSchema", () => {
  it("accepts valid slug", () => {
    const result = workspaceSlugSchema.safeParse("my-research-team");
    expect(result.success).toBe(true);
  });

  it("accepts alphanumeric with hyphens", () => {
    const result = workspaceSlugSchema.safeParse("team-alpha-2026");
    expect(result.success).toBe(true);
  });

  it("rejects slugs with spaces", () => {
    const result = workspaceSlugSchema.safeParse("my team");
    expect(result.success).toBe(false);
  });

  it("rejects slugs with special characters", () => {
    const result = workspaceSlugSchema.safeParse("my_team!");
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = workspaceSlugSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects slug over 50 characters", () => {
    const result = workspaceSlugSchema.safeParse("a".repeat(51));
    expect(result.success).toBe(false);
  });
});
