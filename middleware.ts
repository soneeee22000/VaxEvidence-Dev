import { NextResponse, type NextRequest } from "next/server"
import { getAuthFromCookies } from "@/lib/auth/dev-auth"

// =============================================================================
// DEV-ONLY MIDDLEWARE
// =============================================================================
// Simple cookie-based auth check for development.
// In production, replace with Supabase session validation.
// =============================================================================

const DEBUG_LOG_ENDPOINT =
  process.env.DEBUG_LOG_ENDPOINT ?? process.env.NEXT_PUBLIC_DEBUG_LOG_ENDPOINT

const sendDebugLog = (payload: {
  location: string
  message: string
  data?: Record<string, unknown>
  hypothesisId?: string
}) => {
  if (!DEBUG_LOG_ENDPOINT) return
  fetch(DEBUG_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieHeader = request.headers.get("cookie")
  const isAuthenticated = getAuthFromCookies(cookieHeader)

  // Protect /app routes - redirect to login if not authenticated
  if (pathname.startsWith("/app") && !isAuthenticated) {
    sendDebugLog({
      hypothesisId: "C",
      location: "middleware.ts",
      message: "Redirecting unauthenticated user from app to auth",
      data: { pathname },
    })
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
