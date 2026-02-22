import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateSDTMPackage } from "@/lib/export/sdtm-package-generator";
import { SDTM_DOMAINS } from "@/lib/regulatory/sdtm-domains";
import type { SDTMProtocolData } from "@/lib/regulatory/sdtm-trial-design";

/** Valid domain codes for input validation */
const VALID_DOMAIN_CODES = new Set(SDTM_DOMAINS.map((d) => d.code));
const MAX_DOMAINS = SDTM_DOMAINS.length;

/**
 * Export protocol as CDISC/SDTM dataset templates (ZIP)
 * POST /api/export/protocol/[id]/sdtm
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

    // Parse and validate optional selectedDomains from request body
    let selectedDomains: string[] | undefined;
    try {
      const body = await request.json();
      if (body.selectedDomains && Array.isArray(body.selectedDomains)) {
        const raw: unknown[] = body.selectedDomains;
        if (raw.length > MAX_DOMAINS) {
          return NextResponse.json(
            { error: "Too many domains requested" },
            { status: 400 },
          );
        }
        selectedDomains = raw
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.toUpperCase())
          .filter((v) => VALID_DOMAIN_CODES.has(v));
      }
    } catch {
      // Body is optional — if no JSON body, generate all domains
    }

    // Build SDTMProtocolData from protocol record
    const sdtmData: SDTMProtocolData = {
      id: protocol.id,
      title: protocol.title,
      study_question: protocol.study_question,
      population: protocol.population,
      intervention: protocol.intervention,
      comparator: protocol.comparator,
      outcomes: protocol.outcomes,
      design: protocol.design,
      status: protocol.status,
    };

    // Generate ZIP package
    const zipBuffer = await generateSDTMPackage(sdtmData, selectedDomains);

    // Generate safe filename
    const safeTitle = protocol.title
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 40);

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="SDTM-${safeTitle}-${protocolId.substring(0, 8)}.zip"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating SDTM package:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to generate SDTM templates",
        ...(isDev && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
