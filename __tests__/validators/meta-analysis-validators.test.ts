import { describe, it, expect } from "vitest";
import { metaAnalysisEntrySchema } from "@/lib/validators/meta-analysis";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440001";

describe("metaAnalysisEntrySchema", () => {
  const validEntry = {
    protocol_id: VALID_UUID,
    evidence_id: VALID_UUID_2,
    study_label: "Smith et al. 2024",
    effect_size: 0.85,
    ci_lower: 0.72,
    ci_upper: 0.95,
  };

  describe("valid payloads", () => {
    it("accepts a valid complete entry", () => {
      const result = metaAnalysisEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it("accepts entry with all optional fields", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        weight: 12.5,
        subgroup: "Adults 65+",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null evidence_id", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        evidence_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts omitted evidence_id", () => {
      const { evidence_id, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("accepts null weight", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        weight: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null subgroup", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        subgroup: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts zero effect_size", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        effect_size: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts negative effect_size", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        effect_size: -0.5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts ci_lower greater than ci_upper (no cross-validation)", () => {
      // Schema only validates types, not logical constraints
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        ci_lower: 1.0,
        ci_upper: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts zero weight", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        weight: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid payloads", () => {
    it("rejects non-UUID protocol_id", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        protocol_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID evidence_id (when provided)", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        evidence_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty study_label", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        study_label: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing study_label", () => {
      const { study_label, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing effect_size", () => {
      const { effect_size, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects string effect_size", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        effect_size: "not-a-number",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing ci_lower", () => {
      const { ci_lower, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing ci_upper", () => {
      const { ci_upper, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing protocol_id", () => {
      const { protocol_id, ...rest } = validEntry;
      const result = metaAnalysisEntrySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects string weight", () => {
      const result = metaAnalysisEntrySchema.safeParse({
        ...validEntry,
        weight: "heavy",
      });
      expect(result.success).toBe(false);
    });
  });
});
