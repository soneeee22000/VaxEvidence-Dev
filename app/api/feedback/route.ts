import { NextResponse, type NextRequest } from "next/server";
import { feedbackSchema } from "@/lib/validators/feedback";
import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";

const FEEDBACK_RATE_LIMIT = 10; // 10 submissions per minute
const FEEDBACK_WINDOW_MS = 60_000;

/**
 * POST /api/feedback — Submit user feedback.
 * Authenticated users get their user_id attached; anonymous submissions are allowed.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const rl = checkIpRateLimit(
      request,
      FEEDBACK_RATE_LIMIT,
      FEEDBACK_WINDOW_MS,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please try again later." },
        { status: 429, headers: getIpRateLimitHeaders(rl) },
      );
    }

    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Optional auth — null for anonymous/demo users
    const user = await getServerUser();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("user_feedback").insert({
      user_id: user?.id ?? null,
      category: parsed.data.category,
      message: parsed.data.message,
      email: parsed.data.email || null,
      page_url: parsed.data.page_url || null,
      user_agent: request.headers.get("user-agent") ?? null,
    });

    if (error) {
      console.error("Failed to insert feedback:", error.message);
      return NextResponse.json(
        { error: "Failed to save feedback." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
