import { getSupabaseAdmin } from "@/lib/supabase/server";
import { withApiKey, type ApiKeyRequest } from "@/lib/api/with-api-key";
import { parsePagination, jsonSuccess, jsonError } from "@/lib/api/v1/types";
import { getWorkspaceMemberUserIds } from "@/lib/api/v1/workspace-helpers";
import { dispatchEvent } from "@/lib/api/webhook-dispatcher";

/**
 * GET /api/v1/evidence
 *
 * List evidence items scoped to the authenticated workspace (paginated).
 *
 * Query params:
 *   - page     (default 1)
 *   - per_page (default 20, max 100)
 *   - type     (optional: academic | regulatory | dataset | note)
 *   - status   (optional filter)
 *   - search   (optional title ilike search)
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

      const type = url.searchParams.get("type") ?? undefined;
      const status = url.searchParams.get("status") ?? undefined;
      const search = url.searchParams.get("search") ?? undefined;

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("evidence_items")
        .select("*", { count: "exact" })
        .in("user_id", memberIds);

      if (type) {
        query = query.eq("type", type);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
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
 * POST /api/v1/evidence
 *
 * Create a new evidence item within the authenticated workspace.
 *
 * Required body fields: type, title, description.
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
      const requiredFields = ["type", "title", "description"] as const;
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
        "type",
        "title",
        "description",
        "authors",
        "journal",
        "doi",
        "regulatory_body",
        "document_type",
        "source_url",
        "publication_date",
        "tags",
        "status",
        "external_id",
        "external_source",
      ] as const;

      const insertPayload: Record<string, unknown> = { user_id: userId };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          insertPayload[field] = body[field];
        }
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("evidence_items")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        return jsonError("insert_failed", error.message, 500);
      }

      dispatchEvent(request.apiKey.workspaceId, "evidence.created", {
        evidence: data,
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
