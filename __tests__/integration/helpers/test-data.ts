/**
 * Data seeding and cleanup helpers for integration tests.
 * All operations use the admin client (bypasses RLS).
 */
import { getAdminClient } from "./supabase-test-client";

export interface SeededProtocol {
  id: string;
  user_id: string;
  title: string;
}

export interface SeededEvidence {
  id: string;
  user_id: string;
  title: string;
}

export interface SeededDataset {
  id: string;
  user_id: string;
  name: string;
}

/**
 * Inserts a protocol owned by the given user.
 */
export async function seedProtocol(userId: string): Promise<SeededProtocol> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("protocols")
    .insert({
      user_id: userId,
      title: `Integration Test Protocol ${Date.now()}`,
      study_question: "Does vaccine X reduce disease Y?",
      population: "Adults 18-65",
      intervention: "Vaccine X 0.5mL IM",
      comparator: "Placebo",
      outcomes: "Seroconversion rate at 28 days",
      design: "Randomized Controlled Trial",
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to seed protocol: ${error.message}`);
  }

  return { id: data.id, user_id: data.user_id, title: data.title };
}

/**
 * Inserts an evidence item owned by the given user.
 */
export async function seedEvidence(userId: string): Promise<SeededEvidence> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("evidence_items")
    .insert({
      user_id: userId,
      type: "academic",
      title: `Integration Test Evidence ${Date.now()}`,
      description: "A test evidence item for integration testing",
      status: "draft",
      tags: ["test", "integration"],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to seed evidence: ${error.message}`);
  }

  return { id: data.id, user_id: data.user_id, title: data.title };
}

/**
 * Inserts a dataset owned by the given user.
 */
export async function seedDataset(userId: string): Promise<SeededDataset> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("datasets")
    .insert({
      user_id: userId,
      name: `Integration Test Dataset ${Date.now()}`,
      description: "A test dataset for integration testing",
      dataset_type: "clinical_trial",
      file_name: "test-data.csv",
      file_size: 1024,
      file_type: "csv",
      storage_path: `test/${Date.now()}/test-data.csv`,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to seed dataset: ${error.message}`);
  }

  return { id: data.id, user_id: data.user_id, name: data.name };
}

/**
 * Inserts a screening decision (via admin, bypasses RLS).
 */
export async function seedScreeningDecision(
  protocolId: string,
  evidenceId: string,
): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("screening_decisions")
    .insert({
      protocol_id: protocolId,
      evidence_id: evidenceId,
      stage: "identification",
      decision: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed screening decision: ${error.message}`);
  }

  return data.id;
}

/**
 * Inserts a risk-of-bias assessment (via admin, bypasses RLS).
 */
export async function seedRoBAssessment(
  protocolId: string,
  evidenceId: string,
): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("risk_of_bias_assessments")
    .insert({
      protocol_id: protocolId,
      evidence_id: evidenceId,
      tool: "rob2",
      overall_judgment: "low",
      domains: {},
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed RoB assessment: ${error.message}`);
  }

  return data.id;
}

/**
 * Inserts a meta-analysis entry (via admin, bypasses RLS).
 */
export async function seedMetaAnalysisEntry(
  protocolId: string,
  evidenceId: string | null = null,
): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("meta_analysis_entries")
    .insert({
      protocol_id: protocolId,
      evidence_id: evidenceId,
      study_label: "Study A (2024)",
      effect_size: 0.75,
      ci_lower: 0.5,
      ci_upper: 1.12,
      weight: 15.3,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed meta-analysis entry: ${error.message}`);
  }

  return data.id;
}

/**
 * Links an evidence item to a protocol (via admin, bypasses RLS).
 */
export async function seedEvidenceLink(
  protocolId: string,
  evidenceId: string,
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from("protocol_evidence_links").insert({
    protocol_id: protocolId,
    evidence_id: evidenceId,
  });

  if (error) {
    throw new Error(`Failed to seed evidence link: ${error.message}`);
  }
}

/**
 * Links a dataset to a protocol (via admin, bypasses RLS).
 */
export async function seedDatasetLink(
  protocolId: string,
  datasetId: string,
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from("protocol_dataset_links").insert({
    protocol_id: protocolId,
    dataset_id: datasetId,
  });

  if (error) {
    throw new Error(`Failed to seed dataset link: ${error.message}`);
  }
}

/**
 * Inserts a comment (via admin, bypasses RLS).
 */
export async function seedComment(
  userId: string,
  resourceId: string,
): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("comments")
    .insert({
      user_id: userId,
      resource_type: "protocol",
      resource_id: resourceId,
      content: "Integration test comment",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed comment: ${error.message}`);
  }

  return data.id;
}

/**
 * Inserts a notification (via admin, bypasses RLS).
 */
export async function seedNotification(
  userId: string,
  protocolId: string,
): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: userId,
      type: "comment",
      title: "Test notification",
      body: "Someone commented on your protocol",
      resource_type: "protocol",
      resource_id: protocolId,
      protocol_id: protocolId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed notification: ${error.message}`);
  }

  return data.id;
}

/**
 * Inserts an activity log entry (via admin, bypasses RLS).
 */
export async function seedActivityLog(userId: string): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("activity_logs")
    .insert({
      user_id: userId,
      action: "test_action",
      resource_type: "protocol",
      resource_id: "test-resource",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed activity log: ${error.message}`);
  }

  return data.id;
}

export interface CleanupIds {
  protocolIds?: string[];
  evidenceIds?: string[];
  datasetIds?: string[];
  commentIds?: string[];
  notificationIds?: string[];
  activityLogIds?: string[];
}

/**
 * Deletes all test data via admin client.
 * Protocols cascade to links, screening, RoB, meta-analysis.
 */
export async function cleanupAll(ids: CleanupIds): Promise<void> {
  const admin = getAdminClient();

  // Delete in dependency order (most dependent first)
  if (ids.notificationIds?.length) {
    await admin.from("notifications").delete().in("id", ids.notificationIds);
  }
  if (ids.commentIds?.length) {
    await admin.from("comments").delete().in("id", ids.commentIds);
  }
  if (ids.activityLogIds?.length) {
    await admin.from("activity_logs").delete().in("id", ids.activityLogIds);
  }
  // Protocols cascade to links, screening, RoB, meta-analysis
  if (ids.protocolIds?.length) {
    await admin.from("protocols").delete().in("id", ids.protocolIds);
  }
  // Evidence may still exist if not cascade-deleted
  if (ids.evidenceIds?.length) {
    await admin.from("evidence_items").delete().in("id", ids.evidenceIds);
  }
  if (ids.datasetIds?.length) {
    await admin.from("datasets").delete().in("id", ids.datasetIds);
  }
}
