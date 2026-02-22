import { describe, it, expect } from "vitest";
import {
  robDomainSchema,
  robAssessmentSchema,
  robTools,
  robJudgments,
  rob2Domains,
  robinsIDomains,
  judgmentColors,
  judgmentLabels,
} from "@/lib/validators/risk-of-bias";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440001";

describe("robDomainSchema", () => {
  it("accepts valid domain with judgment only", () => {
    const result = robDomainSchema.safeParse({ judgment: "low" });
    expect(result.success).toBe(true);
  });

  it("accepts valid domain with judgment and justification", () => {
    const result = robDomainSchema.safeParse({
      judgment: "high",
      justification: "Inadequate randomization sequence",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid judgment values", () => {
    for (const judgment of robJudgments) {
      const result = robDomainSchema.safeParse({ judgment });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid judgment value", () => {
    const result = robDomainSchema.safeParse({ judgment: "medium" });
    expect(result.success).toBe(false);
  });

  it("rejects missing judgment", () => {
    const result = robDomainSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts empty string justification", () => {
    const result = robDomainSchema.safeParse({
      judgment: "low",
      justification: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("robAssessmentSchema", () => {
  const validRoB2 = {
    protocol_id: VALID_UUID,
    evidence_id: VALID_UUID_2,
    tool: "rob2" as const,
    domains: {
      "Randomization process": { judgment: "low" as const },
      "Deviations from interventions": {
        judgment: "some_concerns" as const,
        justification: "Protocol deviations noted",
      },
    },
    overall_judgment: "some_concerns" as const,
  };

  it("accepts a valid RoB 2 assessment", () => {
    const result = robAssessmentSchema.safeParse(validRoB2);
    expect(result.success).toBe(true);
  });

  it("accepts a valid ROBINS-I assessment", () => {
    const payload = {
      ...validRoB2,
      tool: "robins_i",
      domains: {
        Confounding: { judgment: "high" as const },
        "Missing data": {
          judgment: "low" as const,
          justification: "Complete follow-up",
        },
      },
    };
    const result = robAssessmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid tool", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      tool: "unknown_tool",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      protocol_id: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID evidence_id", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      evidence_id: "bad-id",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid overall_judgment", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      overall_judgment: "moderate",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid judgment inside domains", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      domains: {
        "Randomization process": { judgment: "invalid" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty domains record", () => {
    const result = robAssessmentSchema.safeParse({
      ...validRoB2,
      domains: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing protocol_id", () => {
    const { protocol_id, ...rest } = validRoB2;
    const result = robAssessmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing tool", () => {
    const { tool, ...rest } = validRoB2;
    const result = robAssessmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing overall_judgment", () => {
    const { overall_judgment, ...rest } = validRoB2;
    const result = robAssessmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("type constants", () => {
  it("exports 2 RoB tools", () => {
    expect(robTools).toHaveLength(2);
    expect(robTools).toContain("rob2");
    expect(robTools).toContain("robins_i");
  });

  it("exports 4 judgment levels", () => {
    expect(robJudgments).toHaveLength(4);
    expect(robJudgments).toContain("low");
    expect(robJudgments).toContain("some_concerns");
    expect(robJudgments).toContain("high");
    expect(robJudgments).toContain("critical");
  });

  it("exports 5 RoB 2 domains", () => {
    expect(rob2Domains).toHaveLength(5);
    expect(rob2Domains).toContain("Randomization process");
    expect(rob2Domains).toContain("Selection of reported result");
  });

  it("exports 7 ROBINS-I domains", () => {
    expect(robinsIDomains).toHaveLength(7);
    expect(robinsIDomains).toContain("Confounding");
    expect(robinsIDomains).toContain("Selection of reported result");
  });

  it("has a color for every judgment", () => {
    for (const judgment of robJudgments) {
      expect(judgmentColors[judgment]).toBeDefined();
      expect(judgmentColors[judgment]).toMatch(/^bg-/);
    }
  });

  it("has a label for every judgment", () => {
    for (const judgment of robJudgments) {
      expect(judgmentLabels[judgment]).toBeDefined();
      expect(typeof judgmentLabels[judgment]).toBe("string");
    }
  });
});
