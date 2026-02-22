import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { gcpComplianceSchema } from "@/lib/validators/gcp-compliance";

/** GET /api/gcp-compliance?protocol_id=... */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const protocolId = url.searchParams.get("protocol_id");

  if (!protocolId) {
    return NextResponse.json(
      { error: "protocol_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: protocol } = await supabase
      .from("protocols")
      .select("user_id")
      .eq("id", protocolId)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("gcp_compliance")
      .select("*")
      .eq("protocol_id", protocolId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/** POST /api/gcp-compliance — upsert GCP compliance data. */
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

  const parsed = gcpComplianceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: protocol } = await supabase
      .from("protocols")
      .select("user_id")
      .eq("id", parsed.data.protocol_id)
      .single();

    if (!protocol || protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("gcp_compliance")
      .upsert(
        {
          protocol_id: parsed.data.protocol_id,
          principles: parsed.data.principles,
          protocol_sections: parsed.data.protocol_sections,
          essential_documents: parsed.data.essential_documents,
          compliance_score: parsed.data.compliance_score,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "protocol_id" },
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
