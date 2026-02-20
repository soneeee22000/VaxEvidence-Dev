import { createClient } from "@/lib/supabase/browser";
import type { ProtocolFormValues } from "@/lib/validators/protocol";

export type ProtocolRecord = ProtocolFormValues & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  template_id?: string | null;
  template_name?: string | null;
};

export type TemplateUsagePayload = {
  user_id: string;
  template_id: string;
  template_name: string;
  created_protocol_id?: string;
};

export type ProtocolCreatePayload = ProtocolFormValues & {
  user_id: string;
  template_id?: string | null;
  template_name?: string | null;
};

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export const fetchProtocols = async () => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client
    .from("protocols")
    .select("*")
    .order("updated_at", { ascending: false });
};

export const fetchProtocolById = async (id: string) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("protocols").select("*").eq("id", id).single();
};

export const createProtocol = async (payload: ProtocolCreatePayload) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }

  // First attempt with all fields
  const result = await client
    .from("protocols")
    .insert(payload)
    .select("*")
    .single();

  // If error mentions missing column (migration not applied), retry without template fields
  if (
    result.error?.message?.includes("column") ||
    result.error?.message?.includes("schema cache")
  ) {
    const { template_id, template_name, ...corePayload } = payload;
    return client.from("protocols").insert(corePayload).select("*").single();
  }

  return result;
};

export const createTemplateUsage = async (payload: TemplateUsagePayload) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("template_usage").insert(payload).select("*").single();
};

export const updateProtocol = async (
  id: string,
  payload: Partial<ProtocolFormValues>,
) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client
    .from("protocols")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
};

export const deleteProtocol = async (id: string) => {
  const client = getClient();
  if (!client) {
    return { data: null, error: { message: "Supabase is not configured." } };
  }
  return client.from("protocols").delete().eq("id", id);
};
