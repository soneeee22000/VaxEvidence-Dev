import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { normalizeWaitlistRequest, waitlistRequestSchema } from "@/lib/validators/waitlist"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null
  }
  return request.headers.get("x-real-ip") ?? null
}

const isRateLimited = (ip: string) => {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return true
  }

  existing.count += 1
  rateLimitStore.set(ip, existing)
  return false
}

const hashIp = (ip: string) => {
  const salt = process.env.IP_HASH_SALT ?? ""
  return createHash("sha256").update(`${salt}${ip}`).digest("hex")
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const parsed = waitlistRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const payload = normalizeWaitlistRequest(parsed.data)
  if (payload.honeypot) {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(request) ?? "unknown"
  if (ip !== "unknown" && isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    )
  }

  const ipHash = ip !== "unknown" ? hashIp(ip) : null
  const normalizedEmail = payload.email.toLowerCase()

  let supabaseAdmin
  try {
    supabaseAdmin = getSupabaseAdmin()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Supabase configuration."
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { error: insertError } = await supabaseAdmin
    .from("waitlist_signups")
    .insert({
      email: normalizedEmail,
      name: payload.name,
      source: payload.source,
      ip_hash: ipHash,
    })

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Unable to save your request." },
      { status: 500 }
    )
  }

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          name: payload.name,
          source: payload.source,
          waitlist_signup: true,
        },
      }
    )

    if (authError && !authError.message?.includes("already registered")) {
      console.error("Auth invite error:", authError.message)
    }
  } catch (authError) {
    console.error("Auth invite exception:", authError)
  }

  return NextResponse.json({ ok: true })
}
