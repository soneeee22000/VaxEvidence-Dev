import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { protocolVersionCreateSchema } from "@/lib/validators/protocol-version";
import { computeContentHash } from "@/lib/utils/content-hash";
import { VERSIONABLE_FIELDS } from "@/lib/validators/protocol-version";

/**
 * GET /api/protocols/[id]/versions
 * List all versions for a protocol, ordered by version_number desc.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("protocol_versions")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("version_number", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("Error listing protocol versions:", error);
    return NextResponse.json(
      { error: "Failed to list versions" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/protocols/[id]/versions
 * Create a new version snapshot of the current protocol state.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const body = await request.json();

    const parsed = protocolVersionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    // Fetch current protocol state
    const { data: protocol, error: protocolError } = await admin
      .from("protocols")
      .select("*")
      .eq("id", protocolId)
      .single();

    if (protocolError || !protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 },
      );
    }

    // Determine next version number
    const { data: latestVersion } = await admin
      .from("protocol_versions")
      .select("version_number")
      .eq("protocol_id", protocolId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

    // Extract versionable fields for hashing
    const contentFields: Record<string, unknown> = {};
    for (const field of VERSIONABLE_FIELDS) {
      contentFields[field] = protocol[field] ?? "";
    }

    const contentHash = await computeContentHash(contentFields);

    // Insert version
    const { data: version, error: insertError } = await admin
      .from("protocol_versions")
      .insert({
        protocol_id: protocolId,
        version_number: nextVersionNumber,
        title: protocol.title,
        study_question: protocol.study_question,
        population: protocol.population,
        intervention: protocol.intervention ?? "",
        comparator: protocol.comparator,
        outcomes: protocol.outcomes,
        design: protocol.design,
        status: protocol.status,
        change_summary: parsed.data.change_summary,
        content_hash: contentHash,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log activity
    await admin.from("activity_logs").insert({
      user_id: user.id,
      action_type: "version_create",
      resource_type: "protocol_version",
      resource_id: version.id,
      metadata: {
        protocol_id: protocolId,
        version_number: nextVersionNumber,
        change_summary: parsed.data.change_summary,
      },
    });

    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    console.error("Error creating protocol version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 },
    );
  }
}
