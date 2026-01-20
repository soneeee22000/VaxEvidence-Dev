import { createClient, SupabaseClient } from "@supabase/supabase-js"

// =============================================================================
// SUPABASE CLIENT - Optional for Development
// =============================================================================
// In dev mode, Supabase is not required. This file provides a null-safe client
// that won't crash the app if env vars are missing.
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a real client only if both env vars are present
let supabaseClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Get the Supabase client (may be null in dev mode)
 */
export const supabase = supabaseClient

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
