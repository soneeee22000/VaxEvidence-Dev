/**
 * CRUD Integration Tests
 *
 * Verifies that create, read, update, delete operations work
 * correctly against a real Supabase database via authenticated user clients.
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
  seedEvidence,
  seedEvidenceLink,
  seedScreeningDecision,
  seedRoBAssessment,
  seedMetaAnalysisEntry,
  cleanupAll,
} from "./helpers/test-data";

describe.skipIf(!isConfigured)("CRUD Integration Tests", () => {
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
    user = await createTestUser("crud");
    client = await getUserClient(user.email, user.password);
  });

  afterAll(async () => {
    await cleanupAll(createdIds);
    await deleteTestUser(user.id);
  });

  // ---------------------------------------------------------------------------
  // 4A: Protocol Lifecycle
  // ---------------------------------------------------------------------------
  describe("Protocol CRUD lifecycle", () => {
    let protocolId: string;

    it("creates a protocol and returns the inserted data", async () => {
      const { data, error } = await client
        .from("protocols")
        .insert({
          user_id: user.id,
          title: "CRUD Test Protocol",
          study_question: "Does vaccine A prevent disease B?",
          population: "Adults 18+",
          intervention: "Vaccine A",
          comparator: "Saline placebo",
          outcomes: "Seroconversion at day 28",
          design: "RCT",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.title).toBe("CRUD Test Protocol");
      expect(data!.user_id).toBe(user.id);
      expect(data!.status).toBe("draft");
      protocolId = data!.id;
      createdIds.protocolIds.push(protocolId);
    });

    it("reads the protocol with all fields", async () => {
      const { data, error } = await client
        .from("protocols")
        .select("*")
        .eq("id", protocolId)
        .single();

      expect(error).toBeNull();
      expect(data!.id).toBe(protocolId);
      expect(data!.population).toBe("Adults 18+");
      expect(data!.created_at).toBeDefined();
    });

    it("updates the protocol and verifies updated_at changes", async () => {
      const { data: before } = await client
        .from("protocols")
        .select("updated_at")
        .eq("id", protocolId)
        .single();

      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 50));

      const { data, error } = await client
        .from("protocols")
        .update({
          title: "Updated CRUD Protocol",
          updated_at: new Date().toISOString(),
        })
        .eq("id", protocolId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.title).toBe("Updated CRUD Protocol");
      expect(data!.updated_at).not.toBe(before!.updated_at);
    });

    it("lists only the user's own protocols", async () => {
      const { data, error } = await client.from("protocols").select("id");

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(
        data!.every(
          (p: { id: string }) =>
            p.id === protocolId || createdIds.protocolIds.includes(p.id),
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4B: Evidence Lifecycle
  // ---------------------------------------------------------------------------
  describe("Evidence CRUD lifecycle", () => {
    let evidenceId: string;

    it("creates an evidence item", async () => {
      const { data, error } = await client
        .from("evidence_items")
        .insert({
          user_id: user.id,
          type: "academic",
          title: "CRUD Test Evidence",
          description: "An RCT of vaccine efficacy",
          authors: "Smith J, Doe A",
          journal: "Lancet",
          doi: "10.1000/test-crud",
          tags: ["rct", "vaccine"],
          status: "draft",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.title).toBe("CRUD Test Evidence");
      expect(data!.tags).toEqual(["rct", "vaccine"]);
      evidenceId = data!.id;
      createdIds.evidenceIds.push(evidenceId);
    });

    it("reads the evidence item", async () => {
      const { data, error } = await client
        .from("evidence_items")
        .select("*")
        .eq("id", evidenceId)
        .single();

      expect(error).toBeNull();
      expect(data!.doi).toBe("10.1000/test-crud");
      expect(data!.authors).toBe("Smith J, Doe A");
    });

    it("updates the evidence item", async () => {
      const { data, error } = await client
        .from("evidence_items")
        .update({
          status: "reviewed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", evidenceId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.status).toBe("reviewed");
    });

    it("filters evidence by type", async () => {
      const { data, error } = await client
        .from("evidence_items")
        .select("id, type")
        .eq("type", "academic");

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(data!.every((e: { type: string }) => e.type === "academic")).toBe(
        true,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 4C: Screening Upsert Behavior
  // ---------------------------------------------------------------------------
  describe("Screening decision upsert", () => {
    let protocolId: string;
    let evidenceId: string;

    beforeAll(async () => {
      // Create protocol and evidence via user client
      const { data: p } = await client
        .from("protocols")
        .insert({
          user_id: user.id,
          title: "Screening Upsert Protocol",
          study_question: "Upsert test",
          population: "All",
          comparator: "None",
          outcomes: "Test",
          design: "RCT",
        })
        .select()
        .single();
      protocolId = p!.id;
      createdIds.protocolIds.push(protocolId);

      const { data: e } = await client
        .from("evidence_items")
        .insert({
          user_id: user.id,
          type: "academic",
          title: "Screening Upsert Evidence",
          description: "Test evidence",
          status: "draft",
        })
        .select()
        .single();
      evidenceId = e!.id;
      createdIds.evidenceIds.push(evidenceId);
    });

    it("inserts a screening decision", async () => {
      const { data, error } = await client
        .from("screening_decisions")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          stage: "identification",
          decision: "pending",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.decision).toBe("pending");
    });

    it("upserts the same (protocol, evidence, stage) to update", async () => {
      const { data, error } = await client
        .from("screening_decisions")
        .upsert(
          {
            protocol_id: protocolId,
            evidence_id: evidenceId,
            stage: "identification",
            decision: "include",
            notes: "Relevant to PICO",
          },
          { onConflict: "protocol_id,evidence_id,stage" },
        )
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.decision).toBe("include");
      expect(data!.notes).toBe("Relevant to PICO");
    });

    it("confirms only one row exists for the unique key", async () => {
      const { data } = await client
        .from("screening_decisions")
        .select("id")
        .eq("protocol_id", protocolId)
        .eq("evidence_id", evidenceId)
        .eq("stage", "identification");

      expect(data).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4D: Protocol-Scoped Data — Full Lifecycle
  // ---------------------------------------------------------------------------
  describe("Protocol-scoped data lifecycle", () => {
    let protocolId: string;
    let evidenceId: string;

    beforeAll(async () => {
      const { data: p } = await client
        .from("protocols")
        .insert({
          user_id: user.id,
          title: "Lifecycle Protocol",
          study_question: "Cascade test",
          population: "All",
          comparator: "None",
          outcomes: "Test",
          design: "Observational",
        })
        .select()
        .single();
      protocolId = p!.id;
      createdIds.protocolIds.push(protocolId);

      const { data: e } = await client
        .from("evidence_items")
        .insert({
          user_id: user.id,
          type: "regulatory",
          title: "Lifecycle Evidence",
          description: "Evidence for lifecycle test",
          status: "draft",
        })
        .select()
        .single();
      evidenceId = e!.id;
      createdIds.evidenceIds.push(evidenceId);
    });

    it("builds a complete protocol-scoped data graph", async () => {
      // Link evidence
      const { error: linkErr } = await client
        .from("protocol_evidence_links")
        .insert({ protocol_id: protocolId, evidence_id: evidenceId });
      expect(linkErr).toBeNull();

      // Add screening decision
      const { error: screenErr } = await client
        .from("screening_decisions")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          stage: "identification",
          decision: "include",
        });
      expect(screenErr).toBeNull();

      // Add RoB assessment
      const { error: robErr } = await client
        .from("risk_of_bias_assessments")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          tool: "RoB2",
          overall_judgment: "low",
          domains: {
            randomization: { judgment: "low", justification: "Adequate" },
          },
        });
      expect(robErr).toBeNull();

      // Add meta-analysis entry
      const { error: metaErr } = await client
        .from("meta_analysis_entries")
        .insert({
          protocol_id: protocolId,
          evidence_id: evidenceId,
          study_label: "Lifecycle Study",
          effect_size: 0.85,
          ci_lower: 0.6,
          ci_upper: 1.1,
          weight: 20,
        });
      expect(metaErr).toBeNull();
    });

    it("reads back all protocol-scoped data consistently", async () => {
      const [links, screening, rob, meta] = await Promise.all([
        client
          .from("protocol_evidence_links")
          .select("*")
          .eq("protocol_id", protocolId),
        client
          .from("screening_decisions")
          .select("*")
          .eq("protocol_id", protocolId),
        client
          .from("risk_of_bias_assessments")
          .select("*")
          .eq("protocol_id", protocolId),
        client
          .from("meta_analysis_entries")
          .select("*")
          .eq("protocol_id", protocolId),
      ]);

      expect(links.data).toHaveLength(1);
      expect(screening.data).toHaveLength(1);
      expect(rob.data).toHaveLength(1);
      expect(meta.data).toHaveLength(1);
      expect(meta.data![0].study_label).toBe("Lifecycle Study");
    });

    it("deleting the protocol cascades to all scoped data", async () => {
      // Delete via admin to bypass potential RLS on delete
      const admin = getAdminClient();
      const { error } = await admin
        .from("protocols")
        .delete()
        .eq("id", protocolId);
      expect(error).toBeNull();

      // Remove from cleanup list since already deleted
      createdIds.protocolIds = createdIds.protocolIds.filter(
        (id) => id !== protocolId,
      );

      // Verify cascades via admin
      const [links, screening, rob, meta] = await Promise.all([
        admin
          .from("protocol_evidence_links")
          .select("id")
          .eq("protocol_id", protocolId),
        admin
          .from("screening_decisions")
          .select("id")
          .eq("protocol_id", protocolId),
        admin
          .from("risk_of_bias_assessments")
          .select("id")
          .eq("protocol_id", protocolId),
        admin
          .from("meta_analysis_entries")
          .select("id")
          .eq("protocol_id", protocolId),
      ]);

      expect(links.data).toHaveLength(0);
      expect(screening.data).toHaveLength(0);
      expect(rob.data).toHaveLength(0);
      expect(meta.data).toHaveLength(0);
    });
  });
}); // end describe.skipIf
