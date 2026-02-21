import { z } from "zod";

export const notificationTypes = [
  "mention",
  "comment",
  "review_requested",
  "review_completed",
  "protocol_updated",
] as const;

export const notificationResourceTypes = [
  "protocol",
  "comment",
  "review",
] as const;

export const notificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(notificationTypes),
  title: z.string().min(1).max(500),
  body: z.string().max(2000).nullable().optional(),
  resource_type: z.enum(notificationResourceTypes),
  resource_id: z.string().uuid(),
  protocol_id: z.string().uuid().nullable().optional(),
  is_read: z.boolean().optional().default(false),
  created_by: z.string().uuid().nullable().optional(),
});

export type NotificationCreateValues = z.input<typeof notificationSchema>;

export interface NotificationRecord extends NotificationCreateValues {
  id: string;
  created_at: string;
}
