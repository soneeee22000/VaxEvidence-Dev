import { z } from "zod";

/**
 * Feedback category options for the feedback widget.
 */
export const FEEDBACK_CATEGORIES = [
  "bug",
  "feature_request",
  "general",
  "praise",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/**
 * Schema for user feedback submissions.
 */
export const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z
    .string()
    .min(10, "Please provide at least 10 characters of detail.")
    .max(5000, "Feedback must be under 5000 characters."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  page_url: z.string().url().optional().or(z.literal("")),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
