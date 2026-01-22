import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { DEV_USER } from "@/lib/auth/dev-auth"
import type { ActivityFilters, ActivityLogWithUser } from "@/lib/validators/activity"

type SupabaseResult<T> = Promise<{ data: T | null; error: { message: string } | null }>

const notConfigured = <T>(message = "Supabase is not configured."): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } }
}

const safeCall = async <T>(fn: () => Promise<{ data: T | null; error: any }>): SupabaseResult<T> => {
  try {
    const { data, error } = await fn()
    return { data: (data ?? null) as T | null, error: error ? { message: error.message ?? String(error) } : null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}

const withUser = (rows: any[] | null): ActivityLogWithUser[] => {
  const list = rows ?? []
  return list.map((row) => ({
    ...row,
    user: {
      id: row.user_id,
      email: row.user_id === DEV_USER.id ? DEV_USER.email : "user@unknown.local",
    },
  }))
}

export const fetchActivityLog = async (filters: ActivityFilters = {}): SupabaseResult<ActivityLogWithUser[]> => {
  if (!isSupabaseConfigured() || !supabase) return notConfigured<ActivityLogWithUser[]>()

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  const { data, error } = await safeCall(async () => {
    let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false })

    if (filters.user_id) query = query.eq("user_id", filters.user_id)
    if (filters.action_type && filters.action_type.length > 0) query = query.in("action_type", filters.action_type as any)
    if (filters.resource_type && filters.resource_type.length > 0) query = query.in("resource_type", filters.resource_type as any)
    if (filters.from_date) query = query.gte("created_at", filters.from_date)
    if (filters.to_date) query = query.lte("created_at", filters.to_date)

    query = query.range(offset, offset + limit - 1)

    const res = await query
    return { data: (res.data as any) ?? null, error: res.error }
  })

  if (error) return { data: null, error }
  return { data: withUser((data as any[]) ?? []), error: null }
}
