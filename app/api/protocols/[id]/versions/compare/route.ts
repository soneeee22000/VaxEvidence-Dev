import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  VERSIONABLE_FIELDS,
  FIELD_LABELS,
  type ProtocolVersionField,
} from "@/lib/validators/protocol-version";

/**
 * GET /api/protocols/[id]/versions/compare?a=<versionId>&b=<versionId>
 * Compare two versions field-by-field and return a diff.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params; // consume params to avoid warnings

    const versionAId = request.nextUrl.searchParams.get("a");
    const versionBId = request.nextUrl.searchParams.get("b");

    if (!versionAId || !versionBId) {
      return NextResponse.json(
        { error: "Both query params 'a' and 'b' (version IDs) are required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const [resA, resB] = await Promise.all([
      admin.from("protocol_versions").select("*").eq("id", versionAId).single(),
      admin.from("protocol_versions").select("*").eq("id", versionBId).single(),
    ]);

    if (resA.error || !resA.data) {
      return NextResponse.json(
        { error: `Version A not found: ${versionAId}` },
        { status: 404 },
      );
    }

    if (resB.error || !resB.data) {
      return NextResponse.json(
        { error: `Version B not found: ${versionBId}` },
        { status: 404 },
      );
    }

    const versionA = resA.data;
    const versionB = resB.data;

    const fields: ProtocolVersionField[] = VERSIONABLE_FIELDS.map((field) => {
      const oldValue = String(versionA[field] ?? "");
      const newValue = String(versionB[field] ?? "");
      return {
        field,
        label: FIELD_LABELS[field],
        oldValue,
        newValue,
        changed: oldValue !== newValue,
      };
    });

    return NextResponse.json({
      data: {
        fields,
        versionA: versionA.version_number,
        versionB: versionB.version_number,
      },
    });
  } catch (error) {
    console.error("Error comparing protocol versions:", error);
    return NextResponse.json(
      { error: "Failed to compare versions" },
      { status: 500 },
    );
  }
}
