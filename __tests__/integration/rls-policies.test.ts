/**
 * RLS Policy Integration Tests
 *
 * Creates 2 test users (A and B), seeds data as User A,
 * verifies User B cannot access it. Tests cross-user isolation
 * on all tables with RLS enabled.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isConfigured } from "./helpers/setup";
import { getUserClient, getAdminClient } from "./helpers/supabase-test-client";
import {
  createTestUser,
  deleteTestUser,
  type TestUser,
} from "./helpers/test-users";
import {
  seedProtocol,
  seedEvidence,
  seedDataset,
  seedScreeningDecision,
  seedRoBAssessment,
  seedMetaAnalysisEntry,
  seedEvidenceLink,
  seedDatasetLink,
  seedComment,
  seedNotification,
  seedActivityLog,
  cleanupAll,
  type SeededProtocol,
  type SeededEvidence,
  type SeededDataset,
} from "./helpers/test-data";

describe.skipIf(!isConfigured)("RLS Policy Integration Tests", () => {
  // Shared state across all tests in this file
  let userA: TestUser;
  let userB: TestUser;
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  // Test data seeded by User A
  let protocolA: SeededProtocol;
  let evidenceA: SeededEvidence;
  let datasetA: SeededDataset;
  let screeningId: string;
  let robId: string;
  let metaEntryId: string;
  let commentId: string;
  let notificationAId: string;
  let activityLogAId: string;

  beforeAll(async () => {
    // Create two test users
    userA = await createTestUser("rls-a");
    userB = await createTestUser("rls-b");

    // Sign in both users
    clientA = await getUserClient(userA.email, userA.password);
    clientB = await getUserClient(userB.email, userB.password);

    // Seed all data as User A (via admin to bypass RLS for seeding)
    protocolA = await seedProtocol(userA.id);
    evidenceA = await seedEvidence(userA.id);
    datasetA = await seedDataset(userA.id);

    // Link evidence and dataset to protocol
    await seedEvidenceLink(protocolA.id, evidenceA.id);
    await seedDatasetLink(protocolA.id, datasetA.id);

    // Protocol-scoped data
    screeningId = await seedScreeningDecision(protocolA.id, evidenceA.id);
    robId = await seedRoBAssessment(protocolA.id, evidenceA.id);
    metaEntryId = await seedMetaAnalysisEntry(protocolA.id, evidenceA.id);

    // Collaborative data
    commentId = await seedComment(userA.id, protocolA.id);
    notificationAId = await seedNotification(userA.id, protocolA.id);
    activityLogAId = await seedActivityLog(userA.id);
  });

  afterAll(async () => {
    // Clean up all test data
    await cleanupAll({
      protocolIds: [protocolA.id],
      evidenceIds: [evidenceA.id],
      datasetIds: [datasetA.id],
      commentIds: [commentId],
      notificationIds: [notificationAId],
      activityLogIds: [activityLogAId],
    });

    // Delete test users
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });

  // ---------------------------------------------------------------------------
  // 2A: Core Tables (user_id-scoped)
  // ---------------------------------------------------------------------------
  describe("Core tables — user_id-scoped RLS", () => {
    describe("protocols", () => {
      it("User A can read own protocol", async () => {
        const { data } = await clientA
          .from("protocols")
          .select("id")
          .eq("id", protocolA.id);
        expect(data).toHaveLength(1);
        expect(data![0].id).toBe(protocolA.id);
      });

      it("User B cannot read User A's protocol", async () => {
        const { data } = await clientB
          .from("protocols")
          .select("id")
          .eq("id", protocolA.id);
        expect(data).toHaveLength(0);
      });

      it("User B cannot update User A's protocol", async () => {
        const { data } = await clientB
          .from("protocols")
          .update({ title: "Hacked!" })
          .eq("id", protocolA.id)
          .select();
        expect(data).toHaveLength(0);

        // Verify data is unchanged via admin
        const admin = getAdminClient();
        const { data: check } = await admin
          .from("protocols")
          .select("title")
          .eq("id", protocolA.id)
          .single();
        expect(check!.title).toBe(protocolA.title);
      });

      it("User B cannot delete User A's protocol", async () => {
        const { data } = await clientB
          .from("protocols")
          .delete()
          .eq("id", protocolA.id)
          .select();
        expect(data).toHaveLength(0);

        // Verify row still exists
        const admin = getAdminClient();
        const { data: check } = await admin
          .from("protocols")
          .select("id")
          .eq("id", protocolA.id);
        expect(check).toHaveLength(1);
      });
    });

    describe("evidence_items", () => {
      it("User B cannot read User A's evidence", async () => {
        const { data } = await clientB
          .from("evidence_items")
          .select("id")
          .eq("id", evidenceA.id);
        expect(data).toHaveLength(0);
      });
    });

    describe("datasets", () => {
      it("User B cannot read User A's dataset", async () => {
        const { data } = await clientB
          .from("datasets")
          .select("id")
          .eq("id", datasetA.id);
        expect(data).toHaveLength(0);
      });
    });

    describe("activity_logs", () => {
      it("User B cannot read User A's activity logs", async () => {
        const { data } = await clientB
          .from("activity_logs")
          .select("id")
          .eq("id", activityLogAId);
        expect(data).toHaveLength(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2B: Protocol-Scoped Tables (ownership via JOIN to protocols)
  // ---------------------------------------------------------------------------
  describe("Protocol-scoped tables — ownership via protocol JOIN", () => {
    describe("screening_decisions", () => {
      it("User A can read own screening decisions", async () => {
        const { data } = await clientA
          .from("screening_decisions")
          .select("id")
          .eq("id", screeningId);
        expect(data).toHaveLength(1);
      });

      it("User B cannot read User A's screening decisions", async () => {
        const { data } = await clientB
          .from("screening_decisions")
          .select("id")
          .eq("id", screeningId);
        expect(data).toHaveLength(0);
      });

      it("User B cannot insert screening decisions for User A's protocol", async () => {
        const { error } = await clientB.from("screening_decisions").insert({
          protocol_id: protocolA.id,
          evidence_id: evidenceA.id,
          stage: "screening",
          decision: "include",
        });
        expect(error).not.toBeNull();
      });

      it("User B cannot update User A's screening decisions", async () => {
        const { data } = await clientB
          .from("screening_decisions")
          .update({ decision: "exclude" })
          .eq("id", screeningId)
          .select();
        expect(data).toHaveLength(0);
      });

      it("User B cannot delete User A's screening decisions", async () => {
        const { data } = await clientB
          .from("screening_decisions")
          .delete()
          .eq("id", screeningId)
          .select();
        expect(data).toHaveLength(0);
      });
    });

    describe("risk_of_bias_assessments", () => {
      it("User A can read own RoB assessments", async () => {
        const { data } = await clientA
          .from("risk_of_bias_assessments")
          .select("id")
          .eq("id", robId);
        expect(data).toHaveLength(1);
      });

      it("User B cannot read User A's RoB assessments", async () => {
        const { data } = await clientB
          .from("risk_of_bias_assessments")
          .select("id")
          .eq("id", robId);
        expect(data).toHaveLength(0);
      });

      it("User B cannot insert RoB for User A's protocol", async () => {
        const { error } = await clientB
          .from("risk_of_bias_assessments")
          .insert({
            protocol_id: protocolA.id,
            evidence_id: evidenceA.id,
            tool: "ROBINS-I",
            overall_judgment: "low",
            domains: {},
          });
        expect(error).not.toBeNull();
      });
    });

    describe("meta_analysis_entries", () => {
      it("User A can read own meta-analysis entries", async () => {
        const { data } = await clientA
          .from("meta_analysis_entries")
          .select("id")
          .eq("id", metaEntryId);
        expect(data).toHaveLength(1);
      });

      it("User B cannot read User A's meta-analysis entries", async () => {
        const { data } = await clientB
          .from("meta_analysis_entries")
          .select("id")
          .eq("id", metaEntryId);
        expect(data).toHaveLength(0);
      });

      it("User B cannot insert meta-analysis entries for User A's protocol", async () => {
        const { error } = await clientB.from("meta_analysis_entries").insert({
          protocol_id: protocolA.id,
          study_label: "Hacked Study",
          effect_size: 999,
          ci_lower: 0,
          ci_upper: 999,
        });
        expect(error).not.toBeNull();
      });
    });

    describe("gcp_compliance", () => {
      let gcpId: string;

      beforeAll(async () => {
        const admin = getAdminClient();
        const { data } = await admin
          .from("gcp_compliance")
          .insert({
            protocol_id: protocolA.id,
            entries: {},
          })
          .select("id")
          .single();
        gcpId = data!.id;
      });

      afterAll(async () => {
        const admin = getAdminClient();
        await admin.from("gcp_compliance").delete().eq("id", gcpId);
      });

      it("User B cannot read User A's GCP compliance", async () => {
        const { data } = await clientB
          .from("gcp_compliance")
          .select("id")
          .eq("id", gcpId);
        expect(data).toHaveLength(0);
      });

      it("User B cannot insert GCP compliance for User A's protocol", async () => {
        const { error } = await clientB.from("gcp_compliance").insert({
          protocol_id: protocolA.id,
          entries: {},
        });
        expect(error).not.toBeNull();
      });
    });

    describe("reporting_checklists", () => {
      let checklistId: string;

      beforeAll(async () => {
        const admin = getAdminClient();
        const { data } = await admin
          .from("reporting_checklists")
          .insert({
            protocol_id: protocolA.id,
            checklist_type: "CONSORT",
            entries: {},
          })
          .select("id")
          .single();
        checklistId = data!.id;
      });

      afterAll(async () => {
        const admin = getAdminClient();
        await admin.from("reporting_checklists").delete().eq("id", checklistId);
      });

      it("User B cannot read User A's reporting checklists", async () => {
        const { data } = await clientB
          .from("reporting_checklists")
          .select("id")
          .eq("id", checklistId);
        expect(data).toHaveLength(0);
      });

      it("User B cannot insert checklist for User A's protocol", async () => {
        const { error } = await clientB.from("reporting_checklists").insert({
          protocol_id: protocolA.id,
          checklist_type: "STROBE",
          entries: {},
        });
        expect(error).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2C: Junction Tables (protocol-ownership scoped)
  // ---------------------------------------------------------------------------
  describe("Junction tables — protocol-ownership scoped", () => {
    describe("protocol_evidence_links", () => {
      it("User A can read own evidence links", async () => {
        const { data } = await clientA
          .from("protocol_evidence_links")
          .select("protocol_id, evidence_id")
          .eq("protocol_id", protocolA.id);
        expect(data!.length).toBeGreaterThanOrEqual(1);
      });

      it("User B cannot read User A's evidence links", async () => {
        const { data } = await clientB
          .from("protocol_evidence_links")
          .select("protocol_id, evidence_id")
          .eq("protocol_id", protocolA.id);
        expect(data).toHaveLength(0);
      });
    });

    describe("protocol_dataset_links", () => {
      it("User A can read own dataset links", async () => {
        const { data } = await clientA
          .from("protocol_dataset_links")
          .select("protocol_id, dataset_id")
          .eq("protocol_id", protocolA.id);
        expect(data!.length).toBeGreaterThanOrEqual(1);
      });

      it("User B cannot read User A's dataset links", async () => {
        const { data } = await clientB
          .from("protocol_dataset_links")
          .select("protocol_id, dataset_id")
          .eq("protocol_id", protocolA.id);
        expect(data).toHaveLength(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2D: Collaborative Tables
  // ---------------------------------------------------------------------------
  describe("Collaborative tables — mixed access patterns", () => {
    describe("comments", () => {
      it("User B can read all comments (public SELECT)", async () => {
        const { data } = await clientB
          .from("comments")
          .select("id")
          .eq("id", commentId);
        expect(data).toHaveLength(1);
      });

      it("User B cannot update User A's comment", async () => {
        const { data } = await clientB
          .from("comments")
          .update({ content: "Hacked comment!" })
          .eq("id", commentId)
          .select();
        expect(data).toHaveLength(0);
      });

      it("User B cannot delete User A's comment", async () => {
        const { data } = await clientB
          .from("comments")
          .delete()
          .eq("id", commentId)
          .select();
        expect(data).toHaveLength(0);

        // Verify comment still exists
        const admin = getAdminClient();
        const { data: check } = await admin
          .from("comments")
          .select("id")
          .eq("id", commentId);
        expect(check).toHaveLength(1);
      });
    });

    describe("notifications", () => {
      it("User B cannot read User A's notifications", async () => {
        const { data } = await clientB
          .from("notifications")
          .select("id")
          .eq("id", notificationAId);
        expect(data).toHaveLength(0);
      });

      it("User A can read own notifications", async () => {
        const { data } = await clientA
          .from("notifications")
          .select("id")
          .eq("id", notificationAId);
        expect(data).toHaveLength(1);
      });
    });
  });
}); // end describe.skipIf
