import { z } from "zod";

/**
 * Typed event names for custom analytics tracking.
 */
export const EVENT_NAMES = [
  "protocol_created",
  "evidence_added",
  "screening_decision",
  "export_triggered",
  "demo_started",
  "demo_signup_clicked",
  "onboarding_completed",
  "onboarding_skipped",
  "feedback_submitted",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/**
 * Schema for a single custom analytics event.
 */
export const customEventSchema = z.object({
  event_name: z.enum(EVENT_NAMES),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  page_url: z.string().optional(),
  session_id: z.string().optional(),
});

export type CustomEvent = z.infer<typeof customEventSchema>;

/**
 * Schema for batching multiple events in one request.
 */
export const eventBatchSchema = z.object({
  events: z.array(customEventSchema).min(1).max(50),
});

export type EventBatch = z.infer<typeof eventBatchSchema>;
