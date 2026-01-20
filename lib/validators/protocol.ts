import { z } from "zod"

export const protocolStatuses = ["draft", "in_review", "final"] as const

export const protocolSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(200),
  study_question: z.string().trim().min(10, "Study question is too short.").max(1000),
  population: z.string().trim().min(3, "Population is required.").max(500),
  comparator: z.string().trim().min(3, "Comparator is required.").max(500),
  outcomes: z.string().trim().min(3, "Outcomes are required.").max(1000),
  design: z.string().trim().min(3, "Study design is required.").max(500),
  status: z.enum(protocolStatuses).default("draft"),
})

export type ProtocolFormValues = z.infer<typeof protocolSchema>
