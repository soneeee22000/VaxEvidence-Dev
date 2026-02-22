import { getSupabaseAdmin } from "@/lib/supabase/server";
import { withApiKey, type ApiKeyRequest } from "@/lib/api/with-api-key";
import { parsePagination, jsonSuccess, jsonError } from "@/lib/api/v1/types";
import { getWorkspaceMemberUserIds } from "@/lib/api/v1/workspace-helpers";
import { dispatchEvent } from "@/lib/api/webhook-dispatcher";

/**
 * GET /api/v1/datasets
 *
 * List datasets scoped to the authenticated workspace (paginated).
 *
 * Query params:
 *   - page         (default 1)
 *   - per_page     (default 20, max 100)
 *   - dataset_type (optional filter, e.g. clinical_trial)
 *   - status       (optional filter)
 *   - search       (optional name ilike search)
 */
export const GET = withApiKey(
  async (request: ApiKeyRequest) => {
    try {
      const { workspaceId } = request.apiKey;
      const memberIds = await getWorkspaceMemberUserIds(workspaceId);

      if (memberIds.length === 0) {
        return jsonSuccess([], {
          page: 1,
          per_page: 20,
          total: 0,
          total_pages: 0,
        });
      }

      const url = new URL(request.url);
      const { page, perPage, from, to } = parsePagination(url.searchParams);

      const datasetType = url.searchParams.get("dataset_type") ?? undefined;
      const status = url.searchParams.get("status") ?? undefined;
      const search = url.searchParams.get("search") ?? undefined;

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("datasets")
        .select("*", { count: "exact" })
        .in("user_id", memberIds);

      if (datasetType) {
        query = query.eq("dataset_type", datasetType);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      query = query.order("updated_at", { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return jsonError("query_failed", error.message, 500);
      }

      const total = count ?? 0;

      return jsonSuccess(data ?? [], {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      });
    } catch (err) {
      return jsonError(
        "internal_error",
        err instanceof Error ? err.message : String(err),
        500,
      );
    }
  },
  { requiredScopes: ["read"] },
);

/**
 * POST /api/v1/datasets
 *
 * Create a new dataset (metadata only, no file upload via API).
 *
 * Required body fields: name, description, dataset_type.
 */
export const POST = withApiKey(
  async (request: ApiKeyRequest) => {
    try {
      const { userId } = request.apiKey;

      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return jsonError(
          "invalid_json",
          "Request body must be valid JSON",
          400,
        );
      }

      /* Validate required fields. */
      const requiredFields = ["name", "description", "dataset_type"] as const;

      const missing = requiredFields.filter((f) => !body[f]);

      if (missing.length > 0) {
        return jsonError(
          "validation_error",
          `Missing required fields: ${missing.join(", ")}`,
          422,
          { missing_fields: missing },
        );
      }

      /* Only allow known columns through. */
      const allowedFields = [
        "name",
        "description",
        "dataset_type",
        "file_name",
        "file_size",
        "file_type",
        "row_count",
        "column_count",
        "date_range_start",
        "date_range_end",
        "tags",
        "status",
        "metadata",
      ] as const;

      const insertPayload: Record<string, unknown> = { user_id: userId };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          insertPayload[field] = body[field];
        }
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("datasets")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        return jsonError("insert_failed", error.message, 500);
      }

      dispatchEvent(request.apiKey.workspaceId, "dataset.created", {
        dataset: data,
      }).catch(() => {});

      return jsonSuccess(data, undefined, 201);
    } catch (err) {
      return jsonError(
        "internal_error",
        err instanceof Error ? err.message : String(err),
        500,
      );
    }
  },
  { requiredScopes: ["write"] },
);
