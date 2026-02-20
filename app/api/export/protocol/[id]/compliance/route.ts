import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateCompliancePDF } from "@/lib/export/compliance-pdf-generator";
import { verifyContentHash } from "@/lib/utils/content-hash";
import { VERSIONABLE_FIELDS } from "@/lib/validators/protocol-version";

/**
 * POST /api/export/protocol/[id]/compliance
 * Generate a 21 CFR Part 11 compliance PDF report.
 */
export async function POST(
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

    // Fetch protocol
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

    // Fetch versions
    const { data: versions } = await admin
      .from("protocol_versions")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("version_number", { ascending: true });

    const versionList = versions ?? [];

    // Verify hashes for all versions
    const hashVerifications = await Promise.all(
      versionList.map(async (version) => {
        const contentFields: Record<string, unknown> = {};
        for (const field of VERSIONABLE_FIELDS) {
          contentFields[field] = version[field] ?? "";
        }
        const hashValid = await verifyContentHash(
          contentFields,
          version.content_hash,
        );
        return {
          versionNumber: version.version_number,
          hashValid,
          contentHash: version.content_hash,
        };
      }),
    );

    // Fetch activity logs related to this protocol's versions
    const { data: activityLogs } = await admin
      .from("activity_logs")
      .select("*")
      .in("action_type", ["version_create", "version_sign", "create", "update"])
      .order("created_at", { ascending: true });

    // Filter to logs related to this protocol (via metadata or resource_id)
    const relevantLogs = (activityLogs ?? []).filter(
      (log) =>
        log.metadata?.protocol_id === protocolId ||
        log.resource_id === protocolId,
    );

    // Generate PDF
    const pdfBlob = await generateCompliancePDF({
      protocol: {
        id: protocol.id,
        title: protocol.title,
        status: protocol.status,
        created_at: protocol.created_at,
        updated_at: protocol.updated_at,
      },
      versions: versionList,
      activityLogs: relevantLogs,
      hashVerifications,
    });

    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 50);

    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-${safeTitle}-${protocolId.substring(0, 8)}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate compliance report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
