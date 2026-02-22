import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import { fetchREDCapRecords, fetchREDCapMetadata } from "@/lib/api/redcap";
import {
  autoDetectMapping,
  mapREDCapToDataset,
  generateDatasetMetadata,
} from "@/lib/import/redcap-mapper";
import type { REDCapMappingConfig } from "@/lib/import/redcap-mapper";

// =============================================================================
// POST /api/integrations/redcap
// =============================================================================
// Import records from a REDCap project into a VaxEvidence dataset.
// Body: { api_url: string, api_token: string, project_name?: string, mapping_config?: REDCapMappingConfig }
// =============================================================================

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    api_url: string;
    api_token: string;
    project_name?: string;
    mapping_config?: REDCapMappingConfig;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (!payload.api_url || !payload.api_token) {
    return NextResponse.json(
      { error: "api_url and api_token are required" },
      { status: 400 },
    );
  }

  try {
    /* Fetch metadata for mapping if no config provided. */
    let mappingConfig = payload.mapping_config;
    if (!mappingConfig) {
      const metadata = await fetchREDCapMetadata(
        payload.api_url,
        payload.api_token,
      );
      mappingConfig = autoDetectMapping(metadata);
    }

    /* Fetch all records. */
    const records = await fetchREDCapRecords(
      payload.api_url,
      payload.api_token,
    );

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No records found in REDCap project" },
        { status: 404 },
      );
    }

    /* Map to dataset format. */
    const { columns, rows } = mapREDCapToDataset(records, mappingConfig);
    const projectName = payload.project_name ?? "REDCap Project";
    const meta = generateDatasetMetadata(records, projectName);

    /* Create dataset record in DB. */
    const supabase = getSupabaseAdmin();
    const { data: dataset, error: dsError } = await supabase
      .from("datasets")
      .insert({
        user_id: user.id,
        name: meta.name,
        description: meta.description,
        dataset_type: meta.dataset_type,
        row_count: meta.row_count,
        column_count: meta.column_count,
        status: "active",
        tags: ["redcap", "imported"],
        metadata: {
          source: "redcap",
          columns,
          sample_rows: rows.slice(0, 5),
          imported_at: new Date().toISOString(),
        },
      })
      .select("*")
      .single();

    if (dsError) {
      return NextResponse.json({ error: dsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        dataset_id: dataset.id,
        row_count: meta.row_count,
        column_count: meta.column_count,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
