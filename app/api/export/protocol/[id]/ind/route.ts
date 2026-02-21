import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateINDPackagePDF } from "@/lib/export/ind-package-generator";
import type { INDPackageData } from "@/lib/export/ind-package-generator";

/**
 * Export protocol as FDA IND Package (PDF)
 * POST /api/export/protocol/[id]/ind
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

    if (!protocolId) {
      return NextResponse.json(
        { error: "Protocol ID is required" },
        { status: 400 },
      );
    }

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

    // Verify ownership
    if (protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch linked evidence with details
    const { data: linkedEvidence } = await admin
      .from("protocol_evidence_links")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId);

    // Fetch risk-of-bias assessments
    const { data: robAssessments } = await admin
      .from("risk_of_bias_assessments")
      .select("*")
      .eq("protocol_id", protocolId);

    // Fetch meta-analysis entries
    const { data: metaAnalysisEntries } = await admin
      .from("meta_analysis_entries")
      .select("*")
      .eq("protocol_id", protocolId);

    const packageData: INDPackageData = {
      protocol,
      linkedEvidence: linkedEvidence || [],
      robAssessments: robAssessments || [],
      metaAnalysisEntries: metaAnalysisEntries || [],
    };

    // Generate IND PDF
    const pdfBlob = await generateINDPackagePDF(packageData);

    // Generate safe filename
    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 40);

    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IND-${safeTitle}-${protocolId.substring(0, 8)}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating IND package PDF:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to generate IND package",
        ...(isDev && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
