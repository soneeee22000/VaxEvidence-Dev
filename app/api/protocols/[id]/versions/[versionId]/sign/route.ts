import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { protocolVersionSignSchema } from "@/lib/validators/protocol-version";

/**
 * POST /api/protocols/[id]/versions/[versionId]/sign
 * Apply a digital signature to a version (21 CFR Part 11 compliance).
 * This is the ONLY mutation allowed on a version record.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: protocolId, versionId } = await params;
    const body = await request.json();

    const parsed = protocolVersionSignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    // Check version exists and is not already signed
    const { data: version, error: fetchError } = await admin
      .from("protocol_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (version.signed_by) {
      return NextResponse.json(
        { error: "Version is already signed" },
        { status: 409 },
      );
    }

    // Apply signature (admin bypasses RLS — this is the only allowed update)
    const now = new Date().toISOString();
    const { data: signed, error: signError } = await admin
      .from("protocol_versions")
      .update({
        signed_by: user.id,
        signed_at: now,
        signature_meaning: parsed.data.signature_meaning,
      })
      .eq("id", versionId)
      .select("*")
      .single();

    if (signError) {
      return NextResponse.json({ error: signError.message }, { status: 500 });
    }

    // Log activity
    await admin.from("activity_logs").insert({
      user_id: user.id,
      action_type: "version_sign",
      resource_type: "protocol_version",
      resource_id: versionId,
      metadata: {
        protocol_id: protocolId,
        version_number: version.version_number,
        signature_meaning: parsed.data.signature_meaning,
      },
    });

    return NextResponse.json({ data: signed });
  } catch (error) {
    console.error("Error signing protocol version:", error);
    return NextResponse.json(
      { error: "Failed to sign version" },
      { status: 500 },
    );
  }
}
