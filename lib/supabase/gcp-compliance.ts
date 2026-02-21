import { createClient } from "@/lib/supabase/browser";
import type { GCPComplianceRecord } from "@/lib/validators/gcp-compliance";

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

const notConfigured = <T>(): {
  data: T | null;
  error: { message: string };
} => ({
  data: null,
  error: { message: "Supabase is not configured." },
});

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

/** Fetch GCP compliance for a protocol. */
export const fetchGCPCompliance = (
  protocolId: string,
): SupabaseResult<GCPComplianceRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<GCPComplianceRecord>());

  return safeCall(() =>
    client
      .from("gcp_compliance")
      .select("*")
      .eq("protocol_id", protocolId)
      .single(),
  );
};

/** Upsert GCP compliance data (insert or update on conflict). */
export const upsertGCPCompliance = (payload: {
  protocol_id: string;
  principles: Array<{
    principle_number: number;
    status: string;
    notes?: string;
  }>;
  protocol_sections: Array<{
    section_number: string;
    status: string;
    notes?: string;
  }>;
  essential_documents: Array<{
    document_id: string;
    status: string;
    notes?: string;
  }>;
  compliance_score: number;
  created_by?: string | null;
}): SupabaseResult<GCPComplianceRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<GCPComplianceRecord>());

  return safeCall(() =>
    client
      .from("gcp_compliance")
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id" },
      )
      .select("*")
      .single(),
  );
};

/** Delete GCP compliance data by ID. */
export const deleteGCPCompliance = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() => client.from("gcp_compliance").delete().eq("id", id));
};
