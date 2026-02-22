import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// =============================================================================
// AUTHENTICATION PROXY
// =============================================================================
// Uses Supabase Auth to protect routes.
// Redirects unauthenticated users to /auth for protected routes.
// Applies security headers to all matched responses.
// =============================================================================

/** Security headers applied to every proxied response. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
  ].join("; "),
};

/** Apply security headers to a NextResponse. */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow v1 API routes through without cookie auth (uses API key auth)
  if (pathname.startsWith("/api/v1")) {
    return applySecurityHeaders(NextResponse.next({ request }));
  }

  // Allow SSO auth routes through without session check (pre-authentication)
  if (pathname.startsWith("/api/auth/sso")) {
    return applySecurityHeaders(NextResponse.next({ request }));
  }

  // Allow /demo routes through without auth (public demo mode)
  if (pathname.startsWith("/demo")) {
    return applySecurityHeaders(NextResponse.next({ request }));
  }

  // Update Supabase session and get current user
  const { response, user } = await updateSession(request);

  // Protect /app routes - redirect to login if not authenticated
  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  // Redirect authenticated users away from auth page
  if (pathname.startsWith("/auth") && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/auth",
    "/demo/:path*",
    "/api/v1/:path*",
    "/api/auth/sso/:path*",
  ],
};
