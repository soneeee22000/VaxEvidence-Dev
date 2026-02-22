import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import {
  generateBibliography,
  generateRegulatoryDocumentList,
} from "@/lib/export/bibliography";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";
import type { BibliographyFormat } from "@/lib/export/types";
import { bibliographyExportSchema } from "@/lib/validators/export";

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

    const rl = checkIpRateLimit(request, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: getIpRateLimitHeaders(rl) },
      );
    }

    const body = await request.json();
    const parsed = bibliographyExportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid export params", details: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const { protocolId, format } = parsed.data;

    const { error: ownershipError } = await verifyProtocolOwnership(protocolId);
    if (ownershipError) {
      return NextResponse.json(
        { error: ownershipError.message },
        { status: ownershipError.status },
      );
    }

    const admin = getSupabaseAdmin();

    // Fetch linked evidence
    const { data: linkedEvidence, error } = await admin
      .from("protocol_evidence_links")
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
