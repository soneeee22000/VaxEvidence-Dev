/**
 * Data Integrity Integration Tests
 *
 * Verifies unique constraints, foreign key cascades, and
 * data consistency against a real Supabase database.
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
import { cleanupAll } from "./helpers/test-data";

describe.skipIf(!isConfigured)("Data Integrity Integration Tests", () => {
  let user: TestUser;
  let client: SupabaseClient;
  const createdIds: {
    protocolIds: string[];
    evidenceIds: string[];
    datasetIds: string[];
  } = {
    protocolIds: [],
    evidenceIds: [],
    datasetIds: [],
  };

  beforeAll(async () => {
    user = await createTestUser("integrity");
    client = await getUserClient(user.email, user.password);
  });

  afterAll(async () => {
    await cleanupAll(createdIds);
    await deleteTestUser(user.id);
  });

  /**
   * Helper: create a protocol owned by the test user.
   */
  async function createProtocol(title: string): Promise<string> {
    const { data } = await client
      .from("protocols")
      .insert({
        user_id: user.id,
        title,
        study_question: "Integrity test",
        population: "All",
        comparator: "None",
        outcomes: "Test",
        design: "RCT",
      })
      .select("id")
      .single();
    createdIds.protocolIds.push(data!.id);
    return data!.id;
  }

  /**
   * Helper: create an evidence item owned by the test user.
   */
  async function createEvidence(title: string): Promise<string> {
    const { data } = await client
      .from("evidence_items")
      .insert({
        user_id: user.id,
        type: "academic",
        title,
        description: "Integrity test evidence",
        status: "draft",
      })
      .select("id")
      .single();
    createdIds.evidenceIds.push(data!.id);
    return data!.id;
  }

  // ---------------------------------------------------------------------------
  // 5A: Unique Constraints
  // ---------------------------------------------------------------------------
  describe("Unique constraints", () => {
    let protocolId: string;
    let evidenceId: string;

    beforeAll(async () => {
      protocolId = await createProtocol("Unique Constraint Protocol");
      evidenceId = await createEvidence("Unique Constraint Evidence");
    });

    it("screening_decisions: rejects duplicate (protocol, evidence, stage)", async () => {
      // First insert
      const { error: err1 } = await client.from("screening_decisions").insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        stage: "screening",
        decision: "pending",
      });
      expect(err1).toBeNull();

      // Duplicate insert (same protocol, evidence, stage)
      const { error: err2 } = await client.from("screening_decisions").insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        stage: "screening",
        decision: "include",
      });
      expect(err2).not.toBeNull();
      expect(err2!.code).toBe("23505"); // unique_violation
    });

    it("risk_of_bias_assessments: rejects duplicate (protocol, evidence, tool)", async () => {
      const { error: err1 } = await client
        .from("risk_of_bias_assessments")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          tool: "RoB2",
          overall_judgment: "low",
          domains: {},
        });
      expect(err1).toBeNull();

      const { error: err2 } = await client
        .from("risk_of_bias_assessments")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          tool: "RoB2",
          overall_judgment: "high",
          domains: {},
        });
      expect(err2).not.toBeNull();
      expect(err2!.code).toBe("23505");
    });

    it("reporting_checklists: rejects duplicate (protocol, checklist_type)", async () => {
      const admin = getAdminClient();
      // Use admin to insert since RLS checks protocol ownership
      const { error: err1 } = await admin.from("reporting_checklists").insert({
        protocol_id: protocolId,
        checklist_type: "CONSORT",
        entries: {},
      });
      expect(err1).toBeNull();

      const { error: err2 } = await admin.from("reporting_checklists").insert({
        protocol_id: protocolId,
        checklist_type: "CONSORT",
        entries: { updated: true },
      });
      expect(err2).not.toBeNull();
      expect(err2!.code).toBe("23505");

      // Cleanup
      await admin
        .from("reporting_checklists")
        .delete()
        .eq("protocol_id", protocolId);
    });

    it("gcp_compliance: rejects duplicate protocol_id", async () => {
      const admin = getAdminClient();
      const { error: err1 } = await admin.from("gcp_compliance").insert({
        protocol_id: protocolId,
        entries: {},
      });
      expect(err1).toBeNull();

      const { error: err2 } = await admin.from("gcp_compliance").insert({
        protocol_id: protocolId,
        entries: { updated: true },
      });
      expect(err2).not.toBeNull();
      expect(err2!.code).toBe("23505");

      // Cleanup
      await admin.from("gcp_compliance").delete().eq("protocol_id", protocolId);
    });
  });

  // ---------------------------------------------------------------------------
  // 5B: Foreign Key Cascades
  // ---------------------------------------------------------------------------
  describe("Foreign key cascades", () => {
    it("deleting a protocol cascades to screening_decisions", async () => {
      const admin = getAdminClient();
      const pId = await createProtocol("FK Cascade Protocol 1");
      const eId = await createEvidence("FK Cascade Evidence 1");

      // Seed related data via admin
      await admin.from("screening_decisions").insert({
        protocol_id: pId,
        evidence_id: eId,
        stage: "identification",
        decision: "pending",
      });

      // Delete protocol
      await admin.from("protocols").delete().eq("id", pId);
      createdIds.protocolIds = createdIds.protocolIds.filter(
        (id) => id !== pId,
      );

      // Verify cascade
      const { data } = await admin
        .from("screening_decisions")
        .select("id")
        .eq("protocol_id", pId);
      expect(data).toHaveLength(0);
    });

    it("deleting a protocol cascades to protocol_evidence_links", async () => {
      const admin = getAdminClient();
      const pId = await createProtocol("FK Cascade Protocol 2");
      const eId = await createEvidence("FK Cascade Evidence 2");

      await admin
        .from("protocol_evidence_links")
        .insert({ protocol_id: pId, evidence_id: eId });

      await admin.from("protocols").delete().eq("id", pId);
      createdIds.protocolIds = createdIds.protocolIds.filter(
        (id) => id !== pId,
      );

      const { data } = await admin
        .from("protocol_evidence_links")
        .select("protocol_id")
        .eq("protocol_id", pId);
      expect(data).toHaveLength(0);
    });

    it("deleting evidence cascades to screening_decisions", async () => {
      const admin = getAdminClient();
      const pId = await createProtocol("FK Cascade Protocol 3");
      const eId = await createEvidence("FK Cascade Evidence 3");

      await admin.from("screening_decisions").insert({
        protocol_id: pId,
        evidence_id: eId,
        stage: "identification",
        decision: "pending",
      });

      // Delete evidence (not protocol)
      await admin.from("evidence_items").delete().eq("id", eId);
      createdIds.evidenceIds = createdIds.evidenceIds.filter(
        (id) => id !== eId,
      );

      const { data } = await admin
        .from("screening_decisions")
        .select("id")
        .eq("evidence_id", eId);
      expect(data).toHaveLength(0);
    });

    it("deleting evidence sets meta_analysis_entries.evidence_id to NULL", async () => {
      const admin = getAdminClient();
      const pId = await createProtocol("FK Cascade Protocol 4");
      const eId = await createEvidence("FK Cascade Evidence 4");

      const { data: entry } = await admin
        .from("meta_analysis_entries")
        .insert({
          protocol_id: pId,
          evidence_id: eId,
          study_label: "Cascade Test Study",
          effect_size: 1.0,
          ci_lower: 0.8,
          ci_upper: 1.2,
        })
        .select("id")
        .single();

      // Delete evidence
      await admin.from("evidence_items").delete().eq("id", eId);
      createdIds.evidenceIds = createdIds.evidenceIds.filter(
        (id) => id !== eId,
      );

      // Meta-analysis entry should still exist but with null evidence_id
      const { data } = await admin
        .from("meta_analysis_entries")
        .select("id, evidence_id")
        .eq("id", entry!.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.evidence_id).toBeNull();
    });

    it("deleting a dataset cascades to protocol_dataset_links", async () => {
      const admin = getAdminClient();
      const pId = await createProtocol("FK Cascade Protocol 5");

      // Create dataset via admin
      const { data: ds } = await admin
        .from("datasets")
        .insert({
          user_id: user.id,
          name: "FK Cascade Dataset",
          description: "Test",
          dataset_type: "clinical_trial",
          file_name: "test.csv",
          file_size: 512,
          file_type: "text/csv",
          storage_path: `test/${Date.now()}/test.csv`,
          status: "active",
        })
        .select("id")
        .single();
      createdIds.datasetIds.push(ds!.id);

      await admin
        .from("protocol_dataset_links")
        .insert({ protocol_id: pId, dataset_id: ds!.id });

      // Delete dataset
      await admin.from("datasets").delete().eq("id", ds!.id);
      createdIds.datasetIds = createdIds.datasetIds.filter(
        (id) => id !== ds!.id,
      );

      const { data } = await admin
        .from("protocol_dataset_links")
        .select("dataset_id")
        .eq("dataset_id", ds!.id);
      expect(data).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 5C: Check Constraints
  // ---------------------------------------------------------------------------
  describe("Check constraints", () => {
    let protocolId: string;
    let evidenceId: string;

    beforeAll(async () => {
      protocolId = await createProtocol("Check Constraint Protocol");
      evidenceId = await createEvidence("Check Constraint Evidence");
    });

    it("screening_decisions: rejects invalid stage value", async () => {
      const { error } = await client.from("screening_decisions").insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        stage: "invalid_stage",
        decision: "pending",
      });
      expect(error).not.toBeNull();
      expect(error!.code).toBe("23514"); // check_violation
    });

    it("screening_decisions: rejects invalid decision value", async () => {
      const { error } = await client.from("screening_decisions").insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        stage: "identification",
        decision: "invalid_decision",
      });
      expect(error).not.toBeNull();
      expect(error!.code).toBe("23514");
    });

    it("risk_of_bias_assessments: rejects invalid tool value", async () => {
      const { error } = await client.from("risk_of_bias_assessments").insert({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        tool: "InvalidTool",
        overall_judgment: "low",
        domains: {},
      });
      expect(error).not.toBeNull();
      expect(error!.code).toBe("23514");
    });

    it("evidence_items: rejects invalid type value", async () => {
      const { error } = await client.from("evidence_items").insert({
        user_id: user.id,
        type: "invalid_type",
        title: "Bad type",
        description: "Should fail",
        status: "draft",
      });
      // May be check constraint or enum — just verify it errors
      expect(error).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 5D: NOT NULL Constraints
  // ---------------------------------------------------------------------------
  describe("NOT NULL constraints", () => {
    it("protocols: rejects missing required fields", async () => {
      const { error } = await client.from("protocols").insert({
        user_id: user.id,
        title: "Missing fields protocol",
        // Missing: study_question, population, comparator, outcomes, design
      } as Record<string, unknown>);
      expect(error).not.toBeNull();
      expect(error!.code).toBe("23502"); // not_null_violation
    });

    it("evidence_items: rejects missing title", async () => {
      const { error } = await client.from("evidence_items").insert({
        user_id: user.id,
        type: "academic",
        // Missing: title, description
        status: "draft",
      } as Record<string, unknown>);
      expect(error).not.toBeNull();
      expect(error!.code).toBe("23502");
    });
  });
}); // end describe.skipIf
