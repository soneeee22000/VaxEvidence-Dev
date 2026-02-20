import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { verifyContentHash } from "@/lib/utils/content-hash";
import { VERSIONABLE_FIELDS } from "@/lib/validators/protocol-version";

/**
 * GET /api/protocols/[id]/versions/[versionId]
 * Fetch a single version with optional hash verification.
 * Query param: ?verify=true to include hash verification result.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { versionId } = await params;
    const shouldVerify = request.nextUrl.searchParams.get("verify") === "true";

    const admin = getSupabaseAdmin();

    const { data: version, error } = await admin
      .from("protocol_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (error || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    let hashValid: boolean | null = null;
    if (shouldVerify) {
      const contentFields: Record<string, unknown> = {};
      for (const field of VERSIONABLE_FIELDS) {
        contentFields[field] = version[field] ?? "";
      }
      hashValid = await verifyContentHash(contentFields, version.content_hash);
    }

    return NextResponse.json({
      data: version,
      ...(shouldVerify && { hash_valid: hashValid }),
    });
  } catch (error) {
    console.error("Error fetching protocol version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 },
    );
  }
}
