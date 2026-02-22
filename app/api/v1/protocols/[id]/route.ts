import { getSupabaseAdmin } from "@/lib/supabase/server";
import { withApiKey, type ApiKeyRequest } from "@/lib/api/with-api-key";
import { jsonSuccess, jsonError } from "@/lib/api/v1/types";
import { verifyWorkspaceOwnership } from "@/lib/api/v1/workspace-helpers";
import { dispatchEvent } from "@/lib/api/webhook-dispatcher";

/** Route context with dynamic `id` parameter. */
type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/protocols/:id
 *
 * Retrieve a single protocol by ID, scoped to the workspace.
 */
export const GET = withApiKey(
  async (request: ApiKeyRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const { workspaceId } = request.apiKey;

      const { data, error } = await verifyWorkspaceOwnership(
        "protocols",
        id,
        workspaceId,
      );

      if (error) {
        return jsonError("not_found", "Protocol not found", 404);
      }

      return jsonSuccess(data);
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
 * PATCH /api/v1/protocols/:id
 *
 * Partially update a protocol. Only allowed columns are accepted.
 */
export const PATCH = withApiKey(
  async (request: ApiKeyRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const { workspaceId } = request.apiKey;

      /* Verify the protocol belongs to the workspace. */
      const { error: ownerError } = await verifyWorkspaceOwnership(
        "protocols",
        id,
        workspaceId,
      );

      if (ownerError) {
        return jsonError("not_found", "Protocol not found", 404);
      }

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

      /* Only allow known columns through. */
      const allowedFields = [
        "title",
        "study_question",
        "population",
        "intervention",
        "comparator",
        "outcomes",
        "design",
        "status",
      ] as const;

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updatePayload[field] = body[field];
        }
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("protocols")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return jsonError("update_failed", error.message, 500);
      }

      dispatchEvent(workspaceId, "protocol.updated", { protocol: data }).catch(
        () => {},
      );

      return jsonSuccess(data);
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

/**
 * DELETE /api/v1/protocols/:id
 *
 * Permanently delete a protocol. Requires admin scope.
 */
export const DELETE = withApiKey(
  async (request: ApiKeyRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const { workspaceId } = request.apiKey;

      /* Verify the protocol belongs to the workspace. */
      const { error: ownerError } = await verifyWorkspaceOwnership(
        "protocols",
        id,
        workspaceId,
      );

      if (ownerError) {
        return jsonError("not_found", "Protocol not found", 404);
      }

      const supabase = getSupabaseAdmin();

      const { error } = await supabase.from("protocols").delete().eq("id", id);

      if (error) {
        return jsonError("delete_failed", error.message, 500);
      }

      return jsonSuccess({ deleted: true });
    } catch (err) {
      return jsonError(
        "internal_error",
        err instanceof Error ? err.message : String(err),
        500,
      );
    }
  },
  { requiredScopes: ["admin"] },
);
