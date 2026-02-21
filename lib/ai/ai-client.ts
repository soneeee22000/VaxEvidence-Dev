import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * AI model factory for the Vercel AI SDK.
 * Server-only — never import in client components.
 *
 * Supports two providers:
 *   - "google" (default) — Google Gemini via GOOGLE_GENERATIVE_AI_API_KEY
 *   - "openai"           — OpenAI via OPENAI_API_KEY
 *
 * Configure via env vars:
 *   AI_PROVIDER=google|openai  (default: google)
 *   AI_MODEL=<model-id>        (default: gemini-2.0-flash / gpt-4o)
 */

const AI_PROVIDER = process.env.AI_PROVIDER ?? "google";

function createModel() {
  if (AI_PROVIDER === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const modelId = process.env.AI_MODEL ?? "gpt-4o";
    return openai(modelId);
  }

  // Default: Google Gemini (free tier)
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  const modelId = process.env.AI_MODEL ?? "gemini-2.0-flash";
  return google(modelId);
}

/** Pre-configured model reference used in all AI routes. */
export const aiModel = createModel();
