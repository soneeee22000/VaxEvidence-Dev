import { describe, it, expect } from "vitest";
import {
  screeningDecisionSchema,
  screeningBatchInitSchema,
  screeningStages,
  screeningDecisions,
  exclusionReasonCategories,
} from "@/lib/validators/screening";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440001";

describe("screeningDecisionSchema", () => {
  const validPayload = {
    protocol_id: VALID_UUID,
    evidence_id: VALID_UUID_2,
    stage: "identification" as const,
    decision: "pending" as const,
  };

  it("accepts a valid minimal payload", () => {
    const result = screeningDecisionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts all valid stages", () => {
    for (const stage of screeningStages) {
      const result = screeningDecisionSchema.safeParse({
        ...validPayload,
        stage,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid decisions", () => {
    for (const decision of screeningDecisions) {
      const result = screeningDecisionSchema.safeParse({
        ...validPayload,
        decision,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid stage value", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      stage: "invalid_stage",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid decision value", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      decision: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      protocol_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID evidence_id", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      evidence_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional exclusion_reason", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      exclusion_reason: "Wrong population",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null exclusion_reason", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      exclusion_reason: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional notes field", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      notes: "Reviewer comment",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null notes", () => {
    const result = screeningDecisionSchema.safeParse({
      ...validPayload,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing protocol_id", () => {
    const { protocol_id, ...rest } = validPayload;
    const result = screeningDecisionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing evidence_id", () => {
    const { evidence_id, ...rest } = validPayload;
    const result = screeningDecisionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing stage", () => {
    const { stage, ...rest } = validPayload;
    const result = screeningDecisionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing decision", () => {
    const { decision, ...rest } = validPayload;
    const result = screeningDecisionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("screeningBatchInitSchema", () => {
  const validBatch = {
    protocol_id: VALID_UUID,
    evidence_ids: [VALID_UUID, VALID_UUID_2],
  };

  it("accepts a valid batch init payload", () => {
    const result = screeningBatchInitSchema.safeParse(validBatch);
    expect(result.success).toBe(true);
  });

  it("defaults stage to identification", () => {
    const result = screeningBatchInitSchema.safeParse(validBatch);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stage).toBe("identification");
    }
  });

  it("accepts explicit stage", () => {
    const result = screeningBatchInitSchema.safeParse({
      ...validBatch,
      stage: "screening",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stage).toBe("screening");
    }
  });

  it("rejects empty evidence_ids array", () => {
    const result = screeningBatchInitSchema.safeParse({
      ...validBatch,
      evidence_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID in evidence_ids", () => {
    const result = screeningBatchInitSchema.safeParse({
      ...validBatch,
      evidence_ids: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = screeningBatchInitSchema.safeParse({
      ...validBatch,
      protocol_id: "bad",
    });
    expect(result.success).toBe(false);
  });
});

describe("type constants", () => {
  it("exports 4 screening stages", () => {
    expect(screeningStages).toHaveLength(4);
    expect(screeningStages).toContain("identification");
    expect(screeningStages).toContain("screening");
    expect(screeningStages).toContain("eligibility");
    expect(screeningStages).toContain("included");
  });

  it("exports 4 screening decisions", () => {
    expect(screeningDecisions).toHaveLength(4);
    expect(screeningDecisions).toContain("pending");
    expect(screeningDecisions).toContain("include");
    expect(screeningDecisions).toContain("exclude");
    expect(screeningDecisions).toContain("duplicate");
  });

  it("exports exclusion reason categories", () => {
    expect(exclusionReasonCategories.length).toBeGreaterThan(0);
    expect(exclusionReasonCategories).toContain("Wrong population");
    expect(exclusionReasonCategories).toContain("Duplicate");
    expect(exclusionReasonCategories).toContain("Other");
  });
});
