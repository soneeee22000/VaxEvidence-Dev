import { createBrowserClient } from "@supabase/ssr"

// =============================================================================
// SUPABASE BROWSER CLIENT
// =============================================================================
// For use in Client Components. Creates a new client for each call.
// =============================================================================

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
