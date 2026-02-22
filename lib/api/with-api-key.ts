import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  authenticateApiKey,
  type AuthenticatedApiKey,
} from "@/lib/api/api-key-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limiter";

/** Extended request type with authenticated API key payload. */
export type ApiKeyRequest = NextRequest & { apiKey: AuthenticatedApiKey };

/** Handler function type for API key authenticated routes. */
type ApiKeyHandler = (
  request: ApiKeyRequest,
  context?: any, // Route context varies per endpoint (dynamic params)
) => Promise<NextResponse>;

/** Options for the withApiKey wrapper. */
interface WithApiKeyOptions {
  requiredScopes?: string[];
}

/**
 * Higher-order function that wraps a route handler with API key authentication,
 * rate limiting, and scope checks.
 *
 * @param handler - The route handler to protect.
 * @param options - Optional configuration (required scopes).
 * @returns A wrapped handler that performs auth, rate limit, and scope validation.
 *
 * @example
 * ```ts
 * export const GET = withApiKey(async (request) => {
 *   const { workspaceId } = request.apiKey;
 *   // ... handler logic
 * }, { requiredScopes: ["read"] });
 * ```
 */
export function withApiKey(
  handler: ApiKeyHandler,
  options?: WithApiKeyOptions,
) {
  return async (
    request: NextRequest,
    context?: unknown,
  ): Promise<NextResponse> => {
    /* 1. Authenticate the API key. */
    const authResult = await authenticateApiKey(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: authResult.error } },
        { status: 401 },
      );
    }

    const apiKey = authResult.data!;

    /* 2. Check rate limit. */
    const rateLimitResult = checkRateLimit(
      apiKey.apiKeyId,
      apiKey.rateLimitTier,
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message:
              "Rate limit exceeded. Please retry after the reset window.",
          },
        },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      );
    }

    /* 3. Check required scopes. */
    if (options?.requiredScopes && options.requiredScopes.length > 0) {
      const missingScopes = options.requiredScopes.filter(
        (scope) => !apiKey.scopes.includes(scope as never),
      );

      if (missingScopes.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: "forbidden",
              message: `Missing required scopes: ${missingScopes.join(", ")}`,
              details: {
                required: options.requiredScopes,
                granted: apiKey.scopes,
              },
            },
          },
          { status: 403 },
        );
      }
    }

    /* 4. Attach authenticated API key to request and invoke handler. */
    const apiKeyRequest = request as ApiKeyRequest;
    apiKeyRequest.apiKey = apiKey;

    const response = await handler(apiKeyRequest, context);

    /* 5. Log request (fire-and-forget). */
    const supabase = getSupabaseAdmin();
    supabase
      .from("api_request_logs")
      .insert({
        api_key_id: apiKey.apiKeyId,
        method: request.method,
        path: new URL(request.url).pathname,
        status_code: response.status,
        created_at: new Date().toISOString(),
      })
      .then(() => {
        /* intentionally empty -- fire-and-forget */
      });

    /* 6. Attach rate limit headers to the response. */
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  };
}
