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
  matcher: ["/app/:path*", "/auth"],
};
