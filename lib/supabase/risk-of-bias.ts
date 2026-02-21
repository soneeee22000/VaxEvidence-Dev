import { createClient } from "@/lib/supabase/browser";
import type {
  RobAssessmentRecord,
  RobTool,
} from "@/lib/validators/risk-of-bias";

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

/** Fetch all RoB assessments for a protocol. */
export const fetchRobAssessments = (
  protocolId: string,
  tool?: RobTool,
): SupabaseResult<RobAssessmentRecord[]> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<RobAssessmentRecord[]>());

  return safeCall(async () => {
    let query = client
      .from("risk_of_bias_assessments")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });

    if (tool) {
      query = query.eq("tool", tool);
    }

    const { data, error } = await query;
    return { data: data as RobAssessmentRecord[] | null, error };
  });
};

/** Fetch a single RoB assessment by ID. */
export const fetchRobAssessmentById = (
  id: string,
): SupabaseResult<RobAssessmentRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<RobAssessmentRecord>());

  return safeCall(() =>
    client.from("risk_of_bias_assessments").select("*").eq("id", id).single(),
  );
};

/** Upsert a RoB assessment (insert or update on conflict). */
export const upsertRobAssessment = (payload: {
  protocol_id: string;
  evidence_id: string;
  tool: RobTool;
  domains: Record<string, { judgment: string; justification?: string }>;
  overall_judgment: string;
  assessed_by?: string | null;
}): SupabaseResult<RobAssessmentRecord> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<RobAssessmentRecord>());

  return safeCall(() =>
    client
      .from("risk_of_bias_assessments")
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,evidence_id,tool" },
      )
      .select("*")
      .single(),
  );
};

/** Delete a RoB assessment by ID. */
export const deleteRobAssessment = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("risk_of_bias_assessments").delete().eq("id", id),
  );
};
