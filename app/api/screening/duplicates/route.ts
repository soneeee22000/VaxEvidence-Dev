import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabase/server";

/**
 * POST /api/screening/duplicates
 * Body: { protocol_id: string }
 * Returns duplicate groups detected among identification-stage pending items.
 */
export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const protocolId = payload.protocol_id as string;
  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("screening_decisions")
      .select(
        `*, evidence_items(id, title, type, authors, doi, external_id, external_source, description, tags)`,
      )
      .eq("protocol_id", protocolId)
      .eq("stage", "identification")
      .eq("decision", "pending");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Import and run duplicate detection
    const { detectDuplicates } =
      await import("@/lib/screening/duplicate-detection");
    const groups = detectDuplicates(data ?? []);

    return NextResponse.json({ data: groups });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
