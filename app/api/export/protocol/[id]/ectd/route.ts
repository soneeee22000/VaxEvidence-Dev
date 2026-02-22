import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateECTDPDF } from "@/lib/export/ectd-pdf-generator";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";
import type { ECTDPackageData } from "@/lib/export/ectd-pdf-generator";

/**
 * Export protocol as eCTD Module 5 Clinical Study Report (PDF)
 * POST /api/export/protocol/[id]/ectd
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

    const rl = checkIpRateLimit(request, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: getIpRateLimitHeaders(rl) },
      );
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
    const { data: linkedEvidence, error: evidenceError } = await admin
      .from("protocol_evidence_links")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId);

    if (evidenceError) {
      console.error("Failed to fetch linked evidence:", evidenceError.message);
    }

    // Fetch included screening decisions with evidence details
    const { data: screeningDecisions, error: screeningError } = await admin
      .from("screening_decisions")
      .select("*, evidence_items(id, title, type, authors)")
      .eq("protocol_id", protocolId)
      .eq("decision", "include")
      .eq("stage", "included");

    if (screeningError) {
      console.error(
        "Failed to fetch screening decisions:",
        screeningError.message,
      );
    }

    // Fetch risk-of-bias assessments
    const { data: robAssessments, error: robError } = await admin
      .from("risk_of_bias_assessments")
      .select("*")
      .eq("protocol_id", protocolId);

    if (robError) {
      console.error("Failed to fetch RoB assessments:", robError.message);
    }

    // Fetch meta-analysis entries
    const { data: metaAnalysisEntries, error: metaError } = await admin
      .from("meta_analysis_entries")
      .select("*")
      .eq("protocol_id", protocolId);

    if (metaError) {
      console.error(
        "Failed to fetch meta-analysis entries:",
        metaError.message,
      );
    }

    const packageData: ECTDPackageData = {
      protocol,
      linkedEvidence: linkedEvidence || [],
      screeningDecisions: screeningDecisions || [],
      robAssessments: robAssessments || [],
      metaAnalysisEntries: metaAnalysisEntries || [],
    };

    // Generate eCTD Module 5 PDF
    const pdfBlob = await generateECTDPDF(packageData);

    // Generate safe filename
    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 40);

    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="eCTD-Module5-${safeTitle}-${protocolId.substring(0, 8)}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating eCTD Module 5 PDF:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to generate eCTD Module 5 package",
        ...(isDev && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
