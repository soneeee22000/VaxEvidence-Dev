import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenAI provider instance for the Vercel AI SDK.
 * Server-only — never import in client components.
 */
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Default model ID, configurable via AI_MODEL env var. */
const MODEL_ID = process.env.AI_MODEL ?? "gpt-4o";

/** Pre-configured model reference used in all AI routes. */
export const aiModel = openai(MODEL_ID);
