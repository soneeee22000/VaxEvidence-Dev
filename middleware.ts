import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  return key
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        response.cookies.set({ name, value, ...options })
      },
      remove: (name, options) => {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl
  if (pathname.startsWith("/app") && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth"
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname.startsWith("/auth") && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/app"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/app/:path*", "/auth"],
}
