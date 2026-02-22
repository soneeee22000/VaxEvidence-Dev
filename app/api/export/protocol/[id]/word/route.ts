import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { generateProtocolWord } from "@/lib/export/word-generator";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";
import type { ProtocolExportOptions } from "@/lib/export/types";
import { protocolExportOptionsSchema } from "@/lib/validators/export";

/**
 * Export protocol as Word document
 * POST /api/export/protocol/[id]/word
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

    // Parse and validate export options from request body
    const body = await request.json();
    const parsed = protocolExportOptionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid export options", details: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const options: ProtocolExportOptions = parsed.data;

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

    if (protocol.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch linked data
    const { data: linkedEvidence } = await admin
      .from("protocol_evidence_links")
      .select("*, evidence_items(*)")
      .eq("protocol_id", protocolId);

    const { data: linkedDatasets } = await admin
      .from("protocol_dataset_links")
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

    // Generate Word document
    const wordBlob = await generateProtocolWord(
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

    // Return Word document as download
    return new Response(wordBlob, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeTitle}-${protocolId.substring(0, 8)}.docx"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting protocol as Word:", error);
    return NextResponse.json(
      {
        error: "Failed to generate Word document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
