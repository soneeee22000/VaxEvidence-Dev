import { describe, it, expect } from "vitest";
import {
  FIELD_CLASSIFICATIONS,
  classificationLevels,
  filterByClassification,
  getPhiFields,
  getClassifiedResourceTypes,
  getClassificationSummary,
  type ClassificationLevel,
} from "@/lib/security/data-classification";

describe("classificationLevels", () => {
  it("defines four levels in ascending sensitivity order", () => {
    expect(classificationLevels).toEqual([
      "public",
      "internal",
      "confidential",
      "phi",
    ]);
  });
});

describe("FIELD_CLASSIFICATIONS", () => {
  it("contains classifications for protocols", () => {
    expect(FIELD_CLASSIFICATIONS).toHaveProperty("protocols");
  });

  it("contains classifications for evidence_items", () => {
    expect(FIELD_CLASSIFICATIONS).toHaveProperty("evidence_items");
  });

  it("contains classifications for datasets", () => {
    expect(FIELD_CLASSIFICATIONS).toHaveProperty("datasets");
  });

  it("contains classifications for screening_decisions", () => {
    expect(FIELD_CLASSIFICATIONS).toHaveProperty("screening_decisions");
  });

  it("classifies protocol.design as public", () => {
    expect(FIELD_CLASSIFICATIONS.protocols.design).toBe("public");
  });

  it("classifies protocol.user_id as confidential", () => {
    expect(FIELD_CLASSIFICATIONS.protocols.user_id).toBe("confidential");
  });

  it("classifies evidence_items.doi as public", () => {
    expect(FIELD_CLASSIFICATIONS.evidence_items.doi).toBe("public");
  });

  it("classifies datasets.storage_path as confidential", () => {
    expect(FIELD_CLASSIFICATIONS.datasets.storage_path).toBe("confidential");
  });

  it("only uses valid classification levels", () => {
    const validLevels = new Set<string>(classificationLevels);
    for (const [, fields] of Object.entries(FIELD_CLASSIFICATIONS)) {
      for (const [, level] of Object.entries(fields)) {
        expect(validLevels.has(level)).toBe(true);
      }
    }
  });
});

describe("filterByClassification", () => {
  const sampleProtocol = {
    id: "p-1",
    title: "My Protocol",
    design: "RCT",
    user_id: "u-1",
    population: "Adults 18+",
    intervention: "Vaccine A",
    status: "draft",
  };

  it("returns only public fields when maxLevel is public", () => {
    const result = filterByClassification(
      "protocols",
      sampleProtocol,
      "public",
    );
    expect(result).toEqual({ design: "RCT" });
  });

  it("returns public + internal fields when maxLevel is internal", () => {
    const result = filterByClassification(
      "protocols",
      sampleProtocol,
      "internal",
    );

    expect(result).toHaveProperty("design");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("intervention");
    expect(result).toHaveProperty("status");
    // Confidential fields excluded
    expect(result).not.toHaveProperty("user_id");
    expect(result).not.toHaveProperty("population");
  });

  it("returns public + internal + confidential when maxLevel is confidential", () => {
    const result = filterByClassification(
      "protocols",
      sampleProtocol,
      "confidential",
    );

    expect(result).toHaveProperty("design");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("user_id");
    expect(result).toHaveProperty("population");
  });

  it("returns all fields when maxLevel is phi", () => {
    const result = filterByClassification("protocols", sampleProtocol, "phi");
    expect(Object.keys(result).sort()).toEqual(
      Object.keys(sampleProtocol).sort(),
    );
  });

  it("returns data as-is for unknown resource types", () => {
    const data = { foo: "bar", baz: 42 };
    const result = filterByClassification("nonexistent", data, "public");
    expect(result).toEqual(data);
  });

  it("handles empty data object", () => {
    const result = filterByClassification("protocols", {}, "public");
    expect(result).toEqual({});
  });

  it("treats unknown fields as internal by default", () => {
    const data = { unknown_field: "value", design: "RCT" };
    // At public level, unknown_field (defaulting to internal) should be excluded
    const publicResult = filterByClassification("protocols", data, "public");
    expect(publicResult).not.toHaveProperty("unknown_field");
    expect(publicResult).toHaveProperty("design");

    // At internal level, unknown_field should be included
    const internalResult = filterByClassification(
      "protocols",
      data,
      "internal",
    );
    expect(internalResult).toHaveProperty("unknown_field");
  });

  it("filters evidence_items correctly at public level", () => {
    const evidence = {
      id: "e-1",
      title: "Study Title",
      authors: "Author A",
      doi: "10.1234/test",
      journal: "Nature",
      description: "Details",
      user_id: "u-1",
    };
    const result = filterByClassification("evidence_items", evidence, "public");
    expect(result).toEqual({
      title: "Study Title",
      authors: "Author A",
      doi: "10.1234/test",
      journal: "Nature",
    });
  });
});

describe("getPhiFields", () => {
  it("returns an empty array for resource types with no PHI fields", () => {
    // protocols has no PHI-level fields
    const result = getPhiFields("protocols");
    expect(result).toEqual([]);
  });

  it("returns an empty array for unknown resource types", () => {
    expect(getPhiFields("nonexistent_type")).toEqual([]);
  });

  it("returns an empty array for evidence_items (no PHI fields defined)", () => {
    expect(getPhiFields("evidence_items")).toEqual([]);
  });

  it("returns an empty array for datasets (no PHI fields defined)", () => {
    expect(getPhiFields("datasets")).toEqual([]);
  });
});

describe("getClassifiedResourceTypes", () => {
  it("returns all resource types with classifications", () => {
    const types = getClassifiedResourceTypes();
    expect(types).toContain("protocols");
    expect(types).toContain("evidence_items");
    expect(types).toContain("datasets");
    expect(types).toContain("screening_decisions");
  });

  it("returns an array of strings", () => {
    const types = getClassifiedResourceTypes();
    for (const t of types) {
      expect(typeof t).toBe("string");
    }
  });

  it("matches the keys of FIELD_CLASSIFICATIONS", () => {
    const types = getClassifiedResourceTypes();
    expect(types.sort()).toEqual(Object.keys(FIELD_CLASSIFICATIONS).sort());
  });
});

describe("getClassificationSummary", () => {
  it("returns correct counts for protocols", () => {
    const summary = getClassificationSummary("protocols");
    expect(summary).not.toBeNull();

    // Verify all levels are present
    expect(summary).toHaveProperty("public");
    expect(summary).toHaveProperty("internal");
    expect(summary).toHaveProperty("confidential");
    expect(summary).toHaveProperty("phi");

    // Total count should equal number of fields
    const total =
      summary!.public +
      summary!.internal +
      summary!.confidential +
      summary!.phi;
    expect(total).toBe(Object.keys(FIELD_CLASSIFICATIONS.protocols).length);
  });

  it("returns null for unknown resource types", () => {
    expect(getClassificationSummary("nonexistent")).toBeNull();
  });

  it("correctly counts public fields in protocols (design only)", () => {
    const summary = getClassificationSummary("protocols");
    expect(summary!.public).toBe(1); // only "design"
  });

  it("correctly counts confidential fields in protocols", () => {
    const summary = getClassificationSummary("protocols");
    // population and user_id are confidential
    expect(summary!.confidential).toBe(2);
  });

  it("reports zero PHI fields for all current resource types", () => {
    for (const resourceType of getClassifiedResourceTypes()) {
      const summary = getClassificationSummary(resourceType);
      expect(summary!.phi).toBe(0);
    }
  });
});
