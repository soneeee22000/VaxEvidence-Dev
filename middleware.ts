import { NextResponse, type NextRequest } from "next/server"
import { getAuthFromCookies } from "@/lib/auth/dev-auth"

// =============================================================================
// DEV-ONLY MIDDLEWARE
// =============================================================================
// Simple cookie-based auth check for development.
// In production, replace with Supabase session validation.
// =============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieHeader = request.headers.get("cookie")
  const isAuthenticated = getAuthFromCookies(cookieHeader)

  // Protect /app routes - redirect to login if not authenticated
  if (pathname.startsWith("/app") && !isAuthenticated) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e605cce5-96c8-48d9-ac3a-0c2be5d3a457',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts',message:'Redirecting unauthenticated user from app to auth',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth"
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth page
  if (pathname.startsWith("/auth") && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/app"
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*", "/auth"],
}
