import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateProtocolPDF } from "@/lib/export/pdf-generator";
import type { ProtocolExportOptions } from "@/lib/export/types";

/**
 * Export protocol as PDF
 * POST /api/export/protocol/[id]
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

    if (!protocolId) {
      return NextResponse.json(
        { error: "Protocol ID is required" },
        { status: 400 },
      );
    }

    // Parse export options from request body
    const body = await request.json();
    const options: ProtocolExportOptions = {
      includeEvidence: body.includeEvidence ?? true,
      includeDatasets: body.includeDatasets ?? true,
      includeComments: body.includeComments ?? false,
      includeReviews: body.includeReviews ?? false,
      templateStyle: body.templateStyle ?? "professional",
    };

    const admin = getSupabaseAdmin();

    // Fetch protocol data
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

    // Fetch linked data
    const { data: linkedEvidence } = await admin
      .from("protocol_evidence")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId);

    const { data: linkedDatasets } = await admin
      .from("protocol_datasets")
      .select("*, datasets(*)")
      .eq("protocol_id", protocolId);

    const { data: comments } = options.includeComments
      ? await admin
          .from("comments")
          .select("*")
          .eq("resource_id", protocolId)
          .eq("resource_type", "protocol")
          .order("created_at")
      : { data: [] };

    const { data: reviews } = options.includeReviews
      ? await admin
          .from("reviews")
          .select("*")
          .eq("protocol_id", protocolId)
          .order("created_at", { ascending: false })
      : { data: [] };

    // Generate PDF
    const pdfBlob = await generateProtocolPDF(
      protocol,
      linkedEvidence || [],
      linkedDatasets || [],
      comments || [],
      reviews || [],
      options,
    );

    // Generate safe filename
    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 50);

    // Return PDF as download
    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}-${protocolId.substring(0, 8)}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting protocol as PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
