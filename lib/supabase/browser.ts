import { createBrowserClient } from "@supabase/ssr";

// =============================================================================
// SUPABASE BROWSER CLIENT (SINGLETON)
// =============================================================================
// For use in Client Components. Caches the client to avoid multiple
// GoTrueClient instances warning.
// =============================================================================

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
