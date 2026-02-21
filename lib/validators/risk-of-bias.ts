import { z } from "zod";

/** Risk of Bias assessment tools. */
export const robTools = ["rob2", "robins_i"] as const;
export type RobTool = (typeof robTools)[number];

/** Domain judgments. */
export const robJudgments = [
  "low",
  "some_concerns",
  "high",
  "critical",
] as const;
export type RobJudgment = (typeof robJudgments)[number];

/** RoB 2 domains for randomized controlled trials. */
export const rob2Domains = [
  "Randomization process",
  "Deviations from interventions",
  "Missing outcome data",
  "Measurement of outcome",
  "Selection of reported result",
] as const;

/** ROBINS-I domains for non-randomized studies. */
export const robinsIDomains = [
  "Confounding",
  "Selection of participants",
  "Classification of interventions",
  "Deviations from interventions",
  "Missing data",
  "Measurement of outcomes",
  "Selection of reported result",
] as const;

/** Domain assessment shape within JSONB. */
export const robDomainSchema = z.object({
  judgment: z.enum(robJudgments),
  justification: z.string().optional(),
});

export type RobDomainAssessment = z.infer<typeof robDomainSchema>;

/** Schema for creating/updating a RoB assessment. */
export const robAssessmentSchema = z.object({
  protocol_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  tool: z.enum(robTools),
  domains: z.record(z.string(), robDomainSchema),
  overall_judgment: z.enum(robJudgments),
});

export type RobAssessmentFormValues = z.infer<typeof robAssessmentSchema>;

/** Database record shape. */
export interface RobAssessmentRecord {
  id: string;
  protocol_id: string;
  evidence_id: string;
  tool: RobTool;
  domains: Record<string, RobDomainAssessment>;
  overall_judgment: RobJudgment;
  assessed_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Judgment display colors for traffic-light visualization. */
export const judgmentColors: Record<RobJudgment, string> = {
  low: "bg-green-500",
  some_concerns: "bg-amber-500",
  high: "bg-red-500",
  critical: "bg-red-800",
};

/** Judgment display labels. */
export const judgmentLabels: Record<RobJudgment, string> = {
  low: "Low",
  some_concerns: "Some concerns",
  high: "High",
  critical: "Critical",
};
