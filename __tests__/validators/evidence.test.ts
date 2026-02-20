import { describe, it, expect } from "vitest";
import {
  evidenceFormSchema,
  evidenceUpdateSchema,
  evidenceLinkSchema,
  getRequiredFieldsForType,
  getOptionalFieldsForType,
} from "@/lib/validators/evidence";

describe("evidenceFormSchema", () => {
  describe("academic type", () => {
    const validAcademic = {
      type: "academic" as const,
      title: "mRNA Vaccine Efficacy",
      description: "A study on mRNA vaccine efficacy in elderly populations",
      authors: "Smith J, Doe A",
      tags: ["COVID-19", "mRNA vaccine"],
    };

    it("accepts valid academic evidence", () => {
      const result = evidenceFormSchema.safeParse(validAcademic);
      expect(result.success).toBe(true);
    });

    it("requires authors for academic type", () => {
      const { authors, ...noAuthors } = validAcademic;
      const result = evidenceFormSchema.safeParse(noAuthors);
      expect(result.success).toBe(false);
    });

    it("accepts valid DOI format", () => {
      const result = evidenceFormSchema.safeParse({
        ...validAcademic,
        doi: "10.1038/s41586-020-2639-4",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid DOI format", () => {
      const result = evidenceFormSchema.safeParse({
        ...validAcademic,
        doi: "not-a-doi",
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty DOI string", () => {
      const result = evidenceFormSchema.safeParse({
        ...validAcademic,
        doi: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid source_url", () => {
      const result = evidenceFormSchema.safeParse({
        ...validAcademic,
        source_url: "https://pubmed.ncbi.nlm.nih.gov/12345678",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("regulatory type", () => {
    const validRegulatory = {
      type: "regulatory" as const,
      title: "FDA Guidance on Vaccine Safety",
      description:
        "FDA guidance document on post-market vaccine safety monitoring",
      regulatory_body: "FDA",
    };

    it("accepts valid regulatory evidence", () => {
      const result = evidenceFormSchema.safeParse(validRegulatory);
      expect(result.success).toBe(true);
    });

    it("requires regulatory_body", () => {
      const { regulatory_body, ...noBody } = validRegulatory;
      const result = evidenceFormSchema.safeParse(noBody);
      expect(result.success).toBe(false);
    });
  });

  describe("dataset type", () => {
    const validDataset = {
      type: "dataset" as const,
      title: "VAERS Adverse Events 2024",
      description: "Vaccine adverse events reporting system data for 2024",
      source_url: "https://vaers.hhs.gov/data/datasets.html",
    };

    it("accepts valid dataset evidence", () => {
      const result = evidenceFormSchema.safeParse(validDataset);
      expect(result.success).toBe(true);
    });

    it("requires source_url for dataset type", () => {
      const { source_url, ...noUrl } = validDataset;
      const result = evidenceFormSchema.safeParse(noUrl);
      expect(result.success).toBe(false);
    });
  });

  describe("note type", () => {
    const validNote = {
      type: "note" as const,
      title: "Research Meeting Notes",
      description: "Notes from the weekly research meeting about study design",
    };

    it("accepts valid note evidence", () => {
      const result = evidenceFormSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it("only requires title and description", () => {
      const result = evidenceFormSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });
  });

  describe("common validations", () => {
    it("rejects title shorter than 3 characters", () => {
      const result = evidenceFormSchema.safeParse({
        type: "note",
        title: "ab",
        description: "A valid description for testing",
      });
      expect(result.success).toBe(false);
    });

    it("rejects description shorter than 10 characters", () => {
      const result = evidenceFormSchema.safeParse({
        type: "note",
        title: "Valid Title",
        description: "Short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid evidence type", () => {
      const result = evidenceFormSchema.safeParse({
        type: "invalid",
        title: "Valid Title",
        description: "A valid description for testing",
      });
      expect(result.success).toBe(false);
    });

    it("defaults tags to empty array", () => {
      const result = evidenceFormSchema.safeParse({
        type: "note",
        title: "Valid Title",
        description: "A valid description for testing",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it("defaults status to draft", () => {
      const result = evidenceFormSchema.safeParse({
        type: "note",
        title: "Valid Title",
        description: "A valid description for testing",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("draft");
      }
    });
  });
});

describe("evidenceUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = evidenceUpdateSchema.safeParse({ title: "Updated Title" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = evidenceUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = evidenceUpdateSchema.safeParse({ title: "ab" });
    expect(result.success).toBe(false);
  });
});

describe("evidenceLinkSchema", () => {
  it("accepts valid UUIDs", () => {
    const result = evidenceLinkSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      evidence_id: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    const result = evidenceLinkSchema.safeParse({
      protocol_id: "not-a-uuid",
      evidence_id: "also-not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("getRequiredFieldsForType", () => {
  it("returns correct fields for academic", () => {
    expect(getRequiredFieldsForType("academic")).toEqual([
      "title",
      "description",
      "authors",
    ]);
  });

  it("returns correct fields for regulatory", () => {
    expect(getRequiredFieldsForType("regulatory")).toEqual([
      "title",
      "description",
      "regulatory_body",
    ]);
  });

  it("returns correct fields for dataset", () => {
    expect(getRequiredFieldsForType("dataset")).toEqual([
      "title",
      "description",
      "source_url",
    ]);
  });

  it("returns correct fields for note", () => {
    expect(getRequiredFieldsForType("note")).toEqual(["title", "description"]);
  });
});

describe("getOptionalFieldsForType", () => {
  it("returns correct fields for academic", () => {
    expect(getOptionalFieldsForType("academic")).toContain("journal");
    expect(getOptionalFieldsForType("academic")).toContain("doi");
  });

  it("returns correct fields for regulatory", () => {
    expect(getOptionalFieldsForType("regulatory")).toContain("document_type");
  });
});
