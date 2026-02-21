import { describe, it, expect } from "vitest";
import {
  gcpComplianceStatuses,
  gcpPrincipleEntrySchema,
  gcpProtocolSectionEntrySchema,
  gcpDocumentEntrySchema,
  gcpComplianceSchema,
  complianceStatusLabels,
  complianceStatusColors,
} from "@/lib/validators/gcp-compliance";

describe("gcpPrincipleEntrySchema", () => {
  it("accepts valid principle entry", () => {
    const result = gcpPrincipleEntrySchema.safeParse({
      principle_number: 1,
      status: "compliant",
      notes: "Protocol approved by IRB",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of gcpComplianceStatuses) {
      const result = gcpPrincipleEntrySchema.safeParse({
        principle_number: 5,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("defaults status to not_assessed", () => {
    const result = gcpPrincipleEntrySchema.safeParse({
      principle_number: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("not_assessed");
    }
  });

  it("rejects principle_number < 1", () => {
    const result = gcpPrincipleEntrySchema.safeParse({
      principle_number: 0,
      status: "compliant",
    });
    expect(result.success).toBe(false);
  });

  it("rejects principle_number > 13", () => {
    const result = gcpPrincipleEntrySchema.safeParse({
      principle_number: 14,
      status: "compliant",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer principle_number", () => {
    const result = gcpPrincipleEntrySchema.safeParse({
      principle_number: 1.5,
      status: "compliant",
    });
    expect(result.success).toBe(false);
  });
});

describe("gcpProtocolSectionEntrySchema", () => {
  it("accepts valid protocol section entry", () => {
    const result = gcpProtocolSectionEntrySchema.safeParse({
      section_number: "6.3",
      status: "compliant",
      notes: "Objectives clearly stated",
    });
    expect(result.success).toBe(true);
  });

  it("defaults status to not_assessed", () => {
    const result = gcpProtocolSectionEntrySchema.safeParse({
      section_number: "6.1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("not_assessed");
    }
  });

  it("rejects missing section_number", () => {
    const result = gcpProtocolSectionEntrySchema.safeParse({
      status: "compliant",
    });
    expect(result.success).toBe(false);
  });
});

describe("gcpDocumentEntrySchema", () => {
  it("accepts valid document entry", () => {
    const result = gcpDocumentEntrySchema.safeParse({
      document_id: "8.2.1",
      status: "compliant",
      notes: "IB version 3.0 available",
    });
    expect(result.success).toBe(true);
  });

  it("defaults status to not_assessed", () => {
    const result = gcpDocumentEntrySchema.safeParse({
      document_id: "8.3.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("not_assessed");
    }
  });
});

describe("gcpComplianceSchema", () => {
  const validPayload = {
    protocol_id: "550e8400-e29b-41d4-a716-446655440000",
    principles: [
      { principle_number: 1, status: "compliant" as const, notes: "OK" },
    ],
    protocol_sections: [
      { section_number: "6.1", status: "compliant" as const },
    ],
    essential_documents: [
      { document_id: "8.2.1", status: "compliant" as const },
    ],
    compliance_score: 75,
  };

  it("accepts valid GCP compliance payload", () => {
    const result = gcpComplianceSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = gcpComplianceSchema.safeParse({
      ...validPayload,
      protocol_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults arrays to empty", () => {
    const result = gcpComplianceSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.principles).toEqual([]);
      expect(result.data.protocol_sections).toEqual([]);
      expect(result.data.essential_documents).toEqual([]);
      expect(result.data.compliance_score).toBe(0);
    }
  });

  it("rejects compliance_score > 100", () => {
    const result = gcpComplianceSchema.safeParse({
      ...validPayload,
      compliance_score: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects compliance_score < 0", () => {
    const result = gcpComplianceSchema.safeParse({
      ...validPayload,
      compliance_score: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("complianceStatusLabels", () => {
  it("has labels for all statuses", () => {
    for (const status of gcpComplianceStatuses) {
      expect(complianceStatusLabels[status]).toBeTruthy();
    }
  });
});

describe("complianceStatusColors", () => {
  it("has colors for all statuses", () => {
    for (const status of gcpComplianceStatuses) {
      expect(complianceStatusColors[status]).toBeTruthy();
    }
  });

  it("colors are Tailwind bg- classes", () => {
    for (const status of gcpComplianceStatuses) {
      expect(complianceStatusColors[status]).toMatch(/^bg-/);
    }
  });
});
