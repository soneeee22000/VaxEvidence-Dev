import { createClient } from "@/lib/supabase/browser";
import type { ProtocolVersionRecord } from "@/lib/validators/protocol-version";

// =============================================================================
// PROTOCOL VERSIONS CRUD
// =============================================================================
// Immutable version snapshots for protocols.
// Follows the safeCall/SupabaseResult pattern from reviews.ts.
// =============================================================================

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

const notConfigured = <T>(
  message = "Supabase is not configured.",
): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } };
};

const safeCall = async <T>(
  fn: () => Promise<{ data: T | null; error: any }>,
): SupabaseResult<T> => {
  try {
    const { data, error } = await fn();
    return {
      data: (data ?? null) as T | null,
      error: error ? { message: error.message ?? String(error) } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

/**
 * Fetch all versions for a protocol, ordered by version_number descending.
 */
export const fetchVersionsByProtocolId = async (
  protocolId: string,
): SupabaseResult<ProtocolVersionRecord[]> => {
  const client = getClient();
  if (!client) return notConfigured<ProtocolVersionRecord[]>();

  return safeCall(() =>
    client
      .from("protocol_versions")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("version_number", { ascending: false }),
  );
};

/**
 * Fetch a single version by its ID.
 */
export const fetchVersionById = async (
  versionId: string,
): SupabaseResult<ProtocolVersionRecord> => {
  const client = getClient();
  if (!client) return notConfigured<ProtocolVersionRecord>();

  return safeCall(() =>
    client.from("protocol_versions").select("*").eq("id", versionId).single(),
  );
};

/**
 * Fetch the latest (highest version_number) version for a protocol.
 */
export const fetchLatestVersion = async (
  protocolId: string,
): SupabaseResult<ProtocolVersionRecord> => {
  const client = getClient();
  if (!client) return notConfigured<ProtocolVersionRecord>();

  return safeCall(() =>
    client
      .from("protocol_versions")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single(),
  );
};

/**
 * Payload for creating a new version (omits auto-generated fields).
 */
export type CreateVersionPayload = {
  protocol_id: string;
  version_number: number;
  title: string;
  study_question: string;
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  design: string;
  status: string;
  change_summary: string;
  content_hash: string;
  created_by: string;
};

/**
 * Create a new immutable version snapshot.
 */
export const createVersion = async (
  payload: CreateVersionPayload,
): SupabaseResult<ProtocolVersionRecord> => {
  const client = getClient();
  if (!client) return notConfigured<ProtocolVersionRecord>();

  return safeCall(() =>
    client.from("protocol_versions").insert(payload).select("*").single(),
  );
};
