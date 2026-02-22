import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// =============================================================================
// AUTHENTICATION PROXY
// =============================================================================
// Uses Supabase Auth to protect routes.
// Redirects unauthenticated users to /auth for protected routes.
// =============================================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow v1 API routes through without cookie auth (uses API key auth)
  if (pathname.startsWith("/api/v1")) {
    return NextResponse.next({ request });
  }

  // Allow SSO auth routes through without session check (pre-authentication)
  if (pathname.startsWith("/api/auth/sso")) {
    return NextResponse.next({ request });
  }

  // Update Supabase session and get current user
  const { response, user } = await updateSession(request);

  // Protect /app routes - redirect to login if not authenticated
  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth page
  if (pathname.startsWith("/auth") && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth", "/api/v1/:path*", "/api/auth/sso/:path*"],
};
