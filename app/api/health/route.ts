import { NextResponse } from "next/server";

const startTime = Date.now();

/**
 * GET /api/health
 * Returns system health status including DB connectivity.
 */
export async function GET() {
  const uptimeMs = Date.now() - startTime;

  let dbConnected = false;
  let dbLatencyMs = -1;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const dbStart = Date.now();
      const { error } = await admin.from("protocols").select("id").limit(1);
      dbLatencyMs = Date.now() - dbStart;
      dbConnected = !error;
    }
  } catch {
    dbConnected = false;
  }

  const status = dbConnected ? "healthy" : "degraded";

  return NextResponse.json({
    status,
    uptime: `${Math.floor(uptimeMs / 1000)}s`,
    db: {
      connected: dbConnected,
      latencyMs: dbLatencyMs,
    },
    timestamp: new Date().toISOString(),
  });
}
