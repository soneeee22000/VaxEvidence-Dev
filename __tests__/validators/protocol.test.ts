import { describe, it, expect } from "vitest";
import { protocolSchema, protocolStatuses } from "@/lib/validators/protocol";

describe("protocolSchema", () => {
  const validProtocol = {
    title: "COVID-19 Vaccine Efficacy Study",
    study_question:
      "Does mRNA vaccine reduce hospitalization in adults over 65?",
    population: "Adults aged 65+",
    intervention: "BNT162b2 mRNA vaccine",
    comparator: "Placebo saline injection",
    outcomes: "Hospitalization rate within 90 days",
    design: "Randomized controlled trial",
    status: "draft" as const,
  };

  it("accepts valid protocol data", () => {
    const result = protocolSchema.safeParse(validProtocol);
    expect(result.success).toBe(true);
  });

  it("defaults status to draft", () => {
    const { status, ...withoutStatus } = validProtocol;
    const result = protocolSchema.safeParse(withoutStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("accepts all valid statuses", () => {
    for (const status of protocolStatuses) {
      const result = protocolSchema.safeParse({ ...validProtocol, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = protocolSchema.safeParse({ ...validProtocol, title: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects study_question shorter than 10 characters", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      study_question: "Short?",
    });
    expect(result.success).toBe(false);
  });

  it("rejects population shorter than 3 characters", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      population: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects comparator shorter than 3 characters", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      comparator: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects outcomes shorter than 3 characters", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      outcomes: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects design shorter than 3 characters", () => {
    const result = protocolSchema.safeParse({ ...validProtocol, design: "ab" });
    expect(result.success).toBe(false);
  });

  it("allows intervention to be optional/empty", () => {
    const { intervention, ...withoutIntervention } = validProtocol;
    const result = protocolSchema.safeParse(withoutIntervention);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intervention).toBe("");
    }
  });

  it("trims whitespace from fields", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      title: "  Trimmed Title  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Trimmed Title");
    }
  });

  it("rejects title exceeding 500 characters", () => {
    const result = protocolSchema.safeParse({
      ...validProtocol,
      title: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
