import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { ProtocolFormValues } from "@/lib/validators/protocol"

export type ProtocolRecord = ProtocolFormValues & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  template_id?: string | null
  template_name?: string | null
}

export type TemplateUsagePayload = {
  user_id: string
  template_id: string
  template_name: string
  created_protocol_id?: string
}

export type ProtocolCreatePayload = ProtocolFormValues & {
  user_id: string
  template_id?: string | null
  template_name?: string | null
}

export const fetchProtocols = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase
    .from("protocols")
    .select("*")
    .order("updated_at", { ascending: false })
}

export const fetchProtocolById = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase.from("protocols").select("*").eq("id", id).single()
}

export const createProtocol = async (payload: ProtocolCreatePayload) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase.from("protocols").insert(payload).select("*").single()
}

export const createTemplateUsage = async (payload: TemplateUsagePayload) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase.from("template_usage").insert(payload).select("*").single()
}

export const updateProtocol = async (
  id: string,
  payload: Partial<ProtocolFormValues>
) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase
    .from("protocols")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
}

export const deleteProtocol = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase.from("protocols").delete().eq("id", id)
}
