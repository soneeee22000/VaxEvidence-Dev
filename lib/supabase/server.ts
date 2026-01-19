import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedAdminClient: SupabaseClient | null = null

const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return { supabaseUrl, serviceRoleKey }
}

export const getSupabaseAdmin = () => {
  if (cachedAdminClient) {
    return cachedAdminClient
  }

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv()
  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedAdminClient
}
