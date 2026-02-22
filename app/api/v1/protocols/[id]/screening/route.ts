import { getSupabaseAdmin } from "@/lib/supabase/server";
import { withApiKey, type ApiKeyRequest } from "@/lib/api/with-api-key";
import { parsePagination, jsonSuccess, jsonError } from "@/lib/api/v1/types";
import { verifyWorkspaceOwnership } from "@/lib/api/v1/workspace-helpers";
import { dispatchEvent } from "@/lib/api/webhook-dispatcher";

/** Route context with dynamic `id` parameter (protocol ID). */
type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/protocols/:id/screening
 *
 * List screening decisions for a protocol, with evidence data joined.
 *
 * Query params:
 *   - page     (default 1)
 *   - per_page (default 20, max 100)
 *   - stage    (optional: identification | screening | eligibility | included)
 *   - decision (optional: pending | include | exclude | duplicate)
 */
export const GET = withApiKey(
  async (request: ApiKeyRequest, context: RouteContext) => {
    try {
      const { id: protocolId } = await context.params;
      const { workspaceId } = request.apiKey;

      /* Verify the protocol belongs to the workspace. */
      const { error: ownerError } = await verifyWorkspaceOwnership(
        "protocols",
        protocolId,
        workspaceId,
      );

      if (ownerError) {
        return jsonError("not_found", "Protocol not found", 404);
      }

      const url = new URL(request.url);
      const { page, perPage, from, to } = parsePagination(url.searchParams);

      const stage = url.searchParams.get("stage") ?? undefined;
      const decision = url.searchParams.get("decision") ?? undefined;

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("screening_decisions")
        .select("*, evidence_items(*)", { count: "exact" })
        .eq("protocol_id", protocolId);

      if (stage) {
        query = query.eq("stage", stage);
      }

      if (decision) {
        query = query.eq("decision", decision);
      }

      query = query.order("created_at", { ascending: false }).range(from, to);

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
 * POST /api/v1/protocols/:id/screening
 *
 * Upsert a screening decision for an evidence item within a protocol.
 * Uses the unique constraint `(protocol_id, evidence_id, stage)` for upsert.
 *
 * Required body fields: evidence_id, stage, decision.
 * Optional: exclusion_reason, notes.
 */
export const POST = withApiKey(
  async (request: ApiKeyRequest, context: RouteContext) => {
    try {
      const { id: protocolId } = await context.params;
      const { workspaceId, userId } = request.apiKey;

      /* Verify the protocol belongs to the workspace. */
      const { error: ownerError } = await verifyWorkspaceOwnership(
        "protocols",
        protocolId,
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

      /* Validate required fields. */
      const requiredFields = ["evidence_id", "stage", "decision"] as const;
      const missing = requiredFields.filter((f) => !body[f]);

      if (missing.length > 0) {
        return jsonError(
          "validation_error",
          `Missing required fields: ${missing.join(", ")}`,
          422,
          { missing_fields: missing },
        );
      }

      /* Validate stage values. */
      const validStages = [
        "identification",
        "screening",
        "eligibility",
        "included",
      ];

      if (!validStages.includes(body.stage as string)) {
        return jsonError(
          "validation_error",
          `Invalid stage. Must be one of: ${validStages.join(", ")}`,
          422,
        );
      }

      /* Validate decision values. */
      const validDecisions = ["pending", "include", "exclude", "duplicate"];

      if (!validDecisions.includes(body.decision as string)) {
        return jsonError(
          "validation_error",
          `Invalid decision. Must be one of: ${validDecisions.join(", ")}`,
          422,
        );
      }

      const supabase = getSupabaseAdmin();

      const upsertPayload = {
        protocol_id: protocolId,
        evidence_id: body.evidence_id as string,
        stage: body.stage as string,
        decision: body.decision as string,
        exclusion_reason: (body.exclusion_reason as string) ?? null,
        notes: (body.notes as string) ?? null,
        decided_by: userId,
        decided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("screening_decisions")
        .upsert(upsertPayload, {
          onConflict: "protocol_id,evidence_id,stage",
        })
        .select("*")
        .single();

      if (error) {
        return jsonError("upsert_failed", error.message, 500);
      }

      dispatchEvent(workspaceId, "screening.decision_made", {
        protocol_id: protocolId,
        decision: data,
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
