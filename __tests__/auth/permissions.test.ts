import { describe, it, expect } from "vitest";
import {
  type WorkspaceRole,
  canCreateProtocol,
  canEditProtocol,
  canDeleteProtocol,
  canCreateEvidence,
  canCreateComment,
  canSubmitReview,
  canManageMembers,
  canManageWorkspace,
  canExport,
  canViewData,
  getRoleLabel,
  getRoleLevel,
  isRoleAtLeast,
  WORKSPACE_ROLES,
} from "@/lib/auth/permissions";

describe("permissions", () => {
  describe("WORKSPACE_ROLES", () => {
    it("contains all 4 roles", () => {
      expect(WORKSPACE_ROLES).toEqual(["admin", "lead", "reviewer", "viewer"]);
    });
  });

  describe("canCreateProtocol", () => {
    it("allows admin", () => expect(canCreateProtocol("admin")).toBe(true));
    it("allows lead", () => expect(canCreateProtocol("lead")).toBe(true));
    it("denies reviewer", () =>
      expect(canCreateProtocol("reviewer")).toBe(false));
    it("denies viewer", () => expect(canCreateProtocol("viewer")).toBe(false));
  });

  describe("canEditProtocol", () => {
    it("allows admin", () => expect(canEditProtocol("admin")).toBe(true));
    it("allows lead", () => expect(canEditProtocol("lead")).toBe(true));
    it("denies reviewer", () =>
      expect(canEditProtocol("reviewer")).toBe(false));
    it("denies viewer", () => expect(canEditProtocol("viewer")).toBe(false));
  });

  describe("canDeleteProtocol", () => {
    it("allows admin for any protocol", () => {
      expect(canDeleteProtocol("admin", "other-user", "admin-user")).toBe(true);
    });
    it("allows lead for own protocol", () => {
      expect(canDeleteProtocol("lead", "user-1", "user-1")).toBe(true);
    });
    it("denies lead for others protocol", () => {
      expect(canDeleteProtocol("lead", "other-user", "user-1")).toBe(false);
    });
    it("denies reviewer", () => {
      expect(canDeleteProtocol("reviewer", "user-1", "user-1")).toBe(false);
    });
  });

  describe("canCreateEvidence", () => {
    it("allows admin", () => expect(canCreateEvidence("admin")).toBe(true));
    it("allows lead", () => expect(canCreateEvidence("lead")).toBe(true));
    it("denies reviewer", () =>
      expect(canCreateEvidence("reviewer")).toBe(false));
    it("denies viewer", () => expect(canCreateEvidence("viewer")).toBe(false));
  });

  describe("canCreateComment", () => {
    it("allows admin", () => expect(canCreateComment("admin")).toBe(true));
    it("allows lead", () => expect(canCreateComment("lead")).toBe(true));
    it("allows reviewer", () =>
      expect(canCreateComment("reviewer")).toBe(true));
    it("denies viewer", () => expect(canCreateComment("viewer")).toBe(false));
  });

  describe("canSubmitReview", () => {
    it("allows admin", () => expect(canSubmitReview("admin")).toBe(true));
    it("allows lead", () => expect(canSubmitReview("lead")).toBe(true));
    it("allows reviewer", () => expect(canSubmitReview("reviewer")).toBe(true));
    it("denies viewer", () => expect(canSubmitReview("viewer")).toBe(false));
  });

  describe("canManageMembers", () => {
    it("allows admin", () => expect(canManageMembers("admin")).toBe(true));
    it("denies lead", () => expect(canManageMembers("lead")).toBe(false));
    it("denies reviewer", () =>
      expect(canManageMembers("reviewer")).toBe(false));
    it("denies viewer", () => expect(canManageMembers("viewer")).toBe(false));
  });

  describe("canManageWorkspace", () => {
    it("allows admin", () => expect(canManageWorkspace("admin")).toBe(true));
    it("denies lead", () => expect(canManageWorkspace("lead")).toBe(false));
  });

  describe("canExport", () => {
    it("allows all roles", () => {
      for (const role of WORKSPACE_ROLES) {
        expect(canExport(role)).toBe(true);
      }
    });
  });

  describe("canViewData", () => {
    it("allows all roles", () => {
      for (const role of WORKSPACE_ROLES) {
        expect(canViewData(role)).toBe(true);
      }
    });
  });

  describe("getRoleLabel", () => {
    it("returns human-readable labels", () => {
      expect(getRoleLabel("admin")).toBe("Admin");
      expect(getRoleLabel("lead")).toBe("Lead Researcher");
      expect(getRoleLabel("reviewer")).toBe("Reviewer");
      expect(getRoleLabel("viewer")).toBe("View Only");
    });
  });

  describe("getRoleLevel", () => {
    it("returns higher numbers for higher roles", () => {
      expect(getRoleLevel("admin")).toBeGreaterThan(getRoleLevel("lead"));
      expect(getRoleLevel("lead")).toBeGreaterThan(getRoleLevel("reviewer"));
      expect(getRoleLevel("reviewer")).toBeGreaterThan(getRoleLevel("viewer"));
    });
  });

  describe("isRoleAtLeast", () => {
    it("admin is at least any role", () => {
      for (const role of WORKSPACE_ROLES) {
        expect(isRoleAtLeast("admin", role)).toBe(true);
      }
    });
    it("viewer is only at least viewer", () => {
      expect(isRoleAtLeast("viewer", "viewer")).toBe(true);
      expect(isRoleAtLeast("viewer", "reviewer")).toBe(false);
    });
    it("reviewer is at least reviewer and viewer", () => {
      expect(isRoleAtLeast("reviewer", "viewer")).toBe(true);
      expect(isRoleAtLeast("reviewer", "reviewer")).toBe(true);
      expect(isRoleAtLeast("reviewer", "lead")).toBe(false);
    });
  });
});
