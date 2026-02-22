import { z } from "zod";

/** Supported webhook event types. */
export const WEBHOOK_EVENTS = [
  "protocol.created",
  "protocol.updated",
  "evidence.created",
  "evidence.updated",
  "evidence.deleted",
  "screening.decision_made",
  "dataset.created",
  "export.generated",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Delivery status values. */
export const deliveryStatuses = ["pending", "delivered", "failed"] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];

/** Schema for creating a webhook. */
export const webhookCreateSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "At least one event required"),
  description: z.string().max(500).optional(),
});

export type WebhookCreateValues = z.input<typeof webhookCreateSchema>;

/** Schema for updating a webhook. */
export const webhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

export type WebhookUpdateValues = z.input<typeof webhookUpdateSchema>;

/** Database record shapes. */
export interface WebhookRecord {
  id: string;
  workspace_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  last_response_code: number | null;
  created_at: string;
  delivered_at: string | null;
}
