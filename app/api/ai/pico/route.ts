import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerUser } from "@/lib/supabase/server";
import { aiModel } from "@/lib/ai/ai-client";
import { picoOutputSchema } from "@/lib/ai/ai-validators";
import {
  buildPicoPrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
} from "@/lib/ai/prompt-builders";

/**
 * POST /api/ai/pico
 * Generate structured PICO fields from a research question.
 * Uses generateObject() for atomic structured output (not streaming).
 */

const requestSchema = z.object({
  research_question: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const { object } = await generateObject({
      model: aiModel,
      system: VACCINE_RESEARCH_SYSTEM_PROMPT,
      prompt: buildPicoPrompt(parsed.data.research_question),
      schema: picoOutputSchema,
    });

    return NextResponse.json({ data: object });
  } catch (err) {
    console.error("PICO generation error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 },
    );
  }
}
