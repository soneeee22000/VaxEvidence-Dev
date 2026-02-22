import { NextResponse } from "next/server";
import { OPENAPI_SPEC } from "@/lib/api/v1/openapi-spec";

/**
 * GET /api/v1/docs
 *
 * Serve the OpenAPI 3.1.0 specification as JSON.
 * No authentication required — this is a public documentation endpoint.
 */
export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * OPTIONS /api/v1/docs
 *
 * Handle CORS preflight requests for the docs endpoint.
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
