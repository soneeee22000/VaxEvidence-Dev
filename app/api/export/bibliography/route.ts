import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  generateBibliography,
  generateRegulatoryDocumentList,
} from "@/lib/export/bibliography";
import type { BibliographyFormat } from "@/lib/export/types";

/**
 * Export bibliography for a protocol's evidence
 * POST /api/export/bibliography
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { protocolId, format } = body;

    if (!protocolId) {
      return NextResponse.json(
        { error: "Protocol ID is required" },
        { status: 400 },
      );
    }

    if (
      !format ||
      !["bibtex", "apa", "mla", "chicago", "ris"].includes(format)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid format. Must be one of: bibtex, apa, mla, chicago, ris",
        },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    // Fetch linked evidence
    const { data: linkedEvidence, error } = await admin
      .from("protocol_evidence")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch evidence" },
        { status: 500 },
      );
    }

    if (!linkedEvidence || linkedEvidence.length === 0) {
      return NextResponse.json(
        { error: "No evidence found for this protocol" },
        { status: 404 },
      );
    }

    // Generate bibliography
    const bibliography = generateBibliography(
      linkedEvidence,
      format as BibliographyFormat,
    );

    // Also generate regulatory documents list if any exist
    let regulatoryDocs = "";
    const hasRegulatory = linkedEvidence.some(
      (item) => item.evidence_items.type === "regulatory",
    );
    if (hasRegulatory) {
      regulatoryDocs = "\n\n" + generateRegulatoryDocumentList(linkedEvidence);
    }

    const fullContent = bibliography + regulatoryDocs;

    // Determine file extension
    const fileExtensions: Record<BibliographyFormat, string> = {
      bibtex: "bib",
      apa: "txt",
      mla: "txt",
      chicago: "txt",
      ris: "ris",
    };
    const extension = fileExtensions[format as BibliographyFormat];

    // Return as downloadable file
    return new Response(fullContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="bibliography-${protocolId.substring(0, 8)}.${extension}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating bibliography:", error);
    return NextResponse.json(
      {
        error: "Failed to generate bibliography",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
