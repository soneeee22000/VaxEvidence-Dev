import { z } from "zod"

export const waitlistRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  honeypot: z.string().optional(),
})

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>

export const normalizeWaitlistRequest = (payload: WaitlistRequest) => ({
  email: payload.email,
  name: payload.name?.trim() || null,
  source: payload.source?.trim() || null,
  honeypot: payload.honeypot?.trim() || "",
})
