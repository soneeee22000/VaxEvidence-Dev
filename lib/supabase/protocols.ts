import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { ProtocolFormValues } from "@/lib/validators/protocol"

export type ProtocolRecord = ProtocolFormValues & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
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

export const createProtocol = async (payload: ProtocolFormValues & { user_id: string }) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase is not configured." } }
  }
  return supabase.from("protocols").insert(payload).select("*").single()
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
