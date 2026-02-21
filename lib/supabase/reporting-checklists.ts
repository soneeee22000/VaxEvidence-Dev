import { createClient } from "@/lib/supabase/browser";
import type {
  ReportingChecklistRecord,
  ChecklistType,
} from "@/lib/validators/reporting-checklist";

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

/** Fetch a reporting checklist for a protocol and type. */
export const fetchReportingChecklist = (
  protocolId: string,
  checklistType: ChecklistType,
): SupabaseResult<ReportingChecklistRecord> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<ReportingChecklistRecord>());

  return safeCall(() =>
    client
      .from("reporting_checklists")
      .select("*")
      .eq("protocol_id", protocolId)
      .eq("checklist_type", checklistType)
      .single(),
  );
};

/** Fetch all reporting checklists for a protocol. */
export const fetchReportingChecklists = (
  protocolId: string,
): SupabaseResult<ReportingChecklistRecord[]> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<ReportingChecklistRecord[]>());

  return safeCall(async () => {
    const { data, error } = await client
      .from("reporting_checklists")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: true });
    return { data: data as ReportingChecklistRecord[] | null, error };
  });
};

/** Upsert a reporting checklist (insert or update on conflict). */
export const upsertReportingChecklist = (payload: {
  protocol_id: string;
  checklist_type: ChecklistType;
  strobe_study_type?: string;
  items: Array<{
    item_id: string;
    status: string;
    notes?: string;
    page_reference?: string;
  }>;
  completion_pct: number;
  created_by?: string | null;
}): SupabaseResult<ReportingChecklistRecord> => {
  const client = getClient();
  if (!client)
    return Promise.resolve(notConfigured<ReportingChecklistRecord>());

  return safeCall(() =>
    client
      .from("reporting_checklists")
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id,checklist_type" },
      )
      .select("*")
      .single(),
  );
};

/** Delete a reporting checklist by ID. */
export const deleteReportingChecklist = (id: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return Promise.resolve(notConfigured<null>());
  return safeCall(() =>
    client.from("reporting_checklists").delete().eq("id", id),
  );
};
