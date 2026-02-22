import { NextRequest } from "next/server";
import { streamText } from "ai";
import { z } from "zod";
import { getServerUser, getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProtocolOwnership } from "@/lib/api/verify-protocol-ownership";
import {
  checkIpRateLimit,
  getIpRateLimitHeaders,
} from "@/lib/api/ip-rate-limiter";
import { aiModel } from "@/lib/ai/ai-client";
import {
  buildSynthesisPrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
} from "@/lib/ai/prompt-builders";

/**
 * POST /api/ai/synthesis
 * Generate a streaming literature review based on protocol + linked evidence.
 * Returns a Vercel AI SDK data stream response for useCompletion() on the client.
 */

const requestSchema = z.object({
  protocol_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rl = checkIpRateLimit(request, 10, 60_000);
  if (!rl.allowed) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: getIpRateLimitHeaders(rl),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request", { status: 422 });
  }

  const { protocol_id } = parsed.data;

  const { error: ownershipError } = await verifyProtocolOwnership(protocol_id);
  if (ownershipError) {
    return new Response(ownershipError.message, {
      status: ownershipError.status,
    });
  }

  const admin = getSupabaseAdmin();

  // Fetch protocol
  const { data: protocol, error: protocolError } = await admin
    .from("protocols")
    .select(
      "title, study_question, population, intervention, comparator, outcomes, design",
    )
    .eq("id", protocol_id)
    .single();

  if (protocolError || !protocol) {
    return new Response("Protocol not found", { status: 404 });
  }

  // Fetch linked evidence with full details
  const { data: links } = await admin
    .from("protocol_evidence_links")
    .select("*, evidence_items(*)")
    .eq("protocol_id", protocol_id);

  const evidence = (links ?? [])
    .map((l: any) => l.evidence_items)
    .filter(Boolean);

  const result = streamText({
    model: aiModel,
    system: VACCINE_RESEARCH_SYSTEM_PROMPT,
    prompt: buildSynthesisPrompt(protocol, evidence),
    maxOutputTokens: 2000,
  });

  return result.toTextStreamResponse();
}
