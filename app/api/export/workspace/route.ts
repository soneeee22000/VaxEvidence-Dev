import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  generateWorkspaceArchive,
  generateJSONExport,
} from "@/lib/export/archive-generator";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

/**
 * Export entire workspace as ZIP archive
 * POST /api/export/workspace
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
    const format = body.format || "zip"; // 'zip' or 'json'

    const admin = getSupabaseAdmin();

    // Fetch all user data
    const { data: protocols, error: protocolsError } = await admin
      .from("protocols")
      .select("*")
      .eq("user_id", user.id);

    if (protocolsError) {
      return NextResponse.json(
        { error: "Failed to fetch protocols" },
        { status: 500 },
      );
    }

    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("*")
      .eq("user_id", user.id);

    if (evidenceError) {
      return NextResponse.json(
        { error: "Failed to fetch evidence" },
        { status: 500 },
      );
    }

    const { data: datasets, error: datasetsError } = await admin
      .from("datasets")
      .select("*")
      .eq("user_id", user.id);

    if (datasetsError) {
      return NextResponse.json(
        { error: "Failed to fetch datasets" },
        { status: 500 },
      );
    }

    // Fetch linked data for all protocols
    const linkedEvidence: Record<string, any[]> = {};
    const linkedDatasets: Record<string, any[]> = {};
    const comments: Record<string, any[]> = {};
    const reviews: Record<string, any[]> = {};

    if (protocols && protocols.length > 0) {
      for (const protocol of protocols) {
        const { data: linkedEv } = await admin
          .from("protocol_evidence_links")
          .select("*, evidence_items(*)")
          .eq("protocol_id", protocol.id);

        const { data: linkedDs } = await admin
          .from("protocol_dataset_links")
          .select("*, datasets(*)")
          .eq("protocol_id", protocol.id);

        const { data: protocolComments } = await admin
          .from("comments")
          .select("*")
          .eq("resource_id", protocol.id)
          .eq("resource_type", "protocol")
          .order("created_at");

        const { data: protocolReviews } = await admin
          .from("reviews")
          .select("*")
          .eq("protocol_id", protocol.id)
          .order("created_at", { ascending: false });

        linkedEvidence[protocol.id] = linkedEv || [];
        linkedDatasets[protocol.id] = linkedDs || [];
        comments[protocol.id] = protocolComments || [];
        reviews[protocol.id] = protocolReviews || [];
      }
    }

    // Generate export based on format
    let archiveBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === "json") {
      archiveBuffer = await generateJSONExport(
        protocols || [],
        evidence || [],
        datasets || [],
        linkedEvidence,
        linkedDatasets,
      );
      contentType = "application/zip";
      filename = `vaxevidence-export-${new Date().toISOString().split("T")[0]}.zip`;
    } else {
      archiveBuffer = await generateWorkspaceArchive(
        protocols || [],
        evidence || [],
        datasets || [],
        linkedEvidence,
        linkedDatasets,
        comments,
        reviews,
      );
      contentType = "application/zip";
      filename = `vaxevidence-workspace-${new Date().toISOString().split("T")[0]}.zip`;
    }

    // Return ZIP as download
    return new Response(new Uint8Array(archiveBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting workspace:", error);
    return NextResponse.json(
      {
        error: "Failed to generate workspace export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
