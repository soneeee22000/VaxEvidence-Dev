import { describe, it, expect } from "vitest";
import {
  ECTD_MODULE5_SECTIONS,
  getECTDSection,
  getECTDSections,
  evaluateECTDCompleteness,
  type ECTDSectionDefinition,
} from "@/lib/regulatory/ectd-module5-structure";

// ---------------------------------------------------------------------------
// ECTD_MODULE5_SECTIONS constant
// ---------------------------------------------------------------------------
describe("ECTD_MODULE5_SECTIONS", () => {
  it("contains exactly 15 sections", () => {
    expect(ECTD_MODULE5_SECTIONS).toHaveLength(15);
  });

  it("each section has required properties", () => {
    for (const section of ECTD_MODULE5_SECTIONS) {
      expect(section.sectionNumber).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.reference).toBeTruthy();
      expect(section.guidance).toBeTruthy();
      expect(Array.isArray(section.autoPopulateFrom)).toBe(true);
      expect(typeof section.templateOnly).toBe("boolean");
    }
  });

  it("has unique section numbers", () => {
    const numbers = ECTD_MODULE5_SECTIONS.map((s) => s.sectionNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("all sections start with 5.", () => {
    for (const section of ECTD_MODULE5_SECTIONS) {
      expect(section.sectionNumber).toMatch(/^5\./);
    }
  });

  it("top-level sections (no parent) are 5.1, 5.2, 5.3, 5.4", () => {
    const topLevel = ECTD_MODULE5_SECTIONS.filter((s) => !s.parentSection);
    expect(topLevel.map((s) => s.sectionNumber)).toEqual([
      "5.1",
      "5.2",
      "5.3",
      "5.4",
    ]);
  });

  it("child sections reference valid parent sections", () => {
    const allNumbers = new Set(
      ECTD_MODULE5_SECTIONS.map((s) => s.sectionNumber),
    );
    const children = ECTD_MODULE5_SECTIONS.filter((s) => s.parentSection);
    for (const child of children) {
      expect(allNumbers.has(child.parentSection!)).toBe(true);
    }
  });

  it("has template-only sections for biopharmaceutic/PK/PD", () => {
    const templateOnly = ECTD_MODULE5_SECTIONS.filter((s) => s.templateOnly);
    expect(templateOnly.length).toBeGreaterThan(0);
    const numbers = templateOnly.map((s) => s.sectionNumber);
    expect(numbers).toContain("5.3");
    expect(numbers).toContain("5.3.1");
    expect(numbers).toContain("5.3.2");
    expect(numbers).toContain("5.3.3");
    expect(numbers).toContain("5.3.4");
  });

  it("all references cite ICH M4E(R2)", () => {
    for (const section of ECTD_MODULE5_SECTIONS) {
      expect(section.reference).toContain("ICH M4E(R2)");
    }
  });
});

// ---------------------------------------------------------------------------
// getECTDSection
// ---------------------------------------------------------------------------
describe("getECTDSection", () => {
  it("returns section 5.1 — Table of Contents", () => {
    const section = getECTDSection("5.1");
    expect(section.title).toBe("Table of Contents of Module 5");
  });

  it("returns section 5.3.5.1 — Controlled Clinical Studies", () => {
    const section = getECTDSection("5.3.5.1");
    expect(section.title).toContain("Controlled Clinical Studies");
    expect(section.parentSection).toBe("5.3.5");
  });

  it("returns section 5.4 — Literature References", () => {
    const section = getECTDSection("5.4");
    expect(section.title).toBe("Literature References");
    expect(section.templateOnly).toBe(false);
  });

  it("throws for unknown section number", () => {
    expect(() => getECTDSection("5.99")).toThrow(
      "eCTD Module 5 section 5.99 not found",
    );
  });

  it("throws for empty string", () => {
    expect(() => getECTDSection("")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getECTDSections (grouped hierarchy)
// ---------------------------------------------------------------------------
describe("getECTDSections", () => {
  it("returns groups for top-level sections", () => {
    const groups = getECTDSections();
    expect(groups).toHaveLength(4); // 5.1, 5.2, 5.3, 5.4
  });

  it("groups have section and children properties", () => {
    const groups = getECTDSections();
    for (const group of groups) {
      expect(group.section).toBeDefined();
      expect(group.section.sectionNumber).toBeTruthy();
      expect(Array.isArray(group.children)).toBe(true);
    }
  });

  it("section 5.3 has the most children", () => {
    const groups = getECTDSections();
    const section53 = groups.find((g) => g.section.sectionNumber === "5.3");
    expect(section53).toBeDefined();
    // 5.3.1, 5.3.2, 5.3.3, 5.3.4, 5.3.5, 5.3.6, 5.3.7
    expect(section53!.children.length).toBe(7);
  });

  it("section 5.1 has no children", () => {
    const groups = getECTDSections();
    const section51 = groups.find((g) => g.section.sectionNumber === "5.1");
    expect(section51!.children).toHaveLength(0);
  });

  it("section 5.2 has no children", () => {
    const groups = getECTDSections();
    const section52 = groups.find((g) => g.section.sectionNumber === "5.2");
    expect(section52!.children).toHaveLength(0);
  });

  it("section 5.4 has no children", () => {
    const groups = getECTDSections();
    const section54 = groups.find((g) => g.section.sectionNumber === "5.4");
    expect(section54!.children).toHaveLength(0);
  });

  it("5.3.5 sub-sections are children of 5.3 (not 5.3.5)", () => {
    // 5.3.5 itself is a child of 5.3; 5.3.5.1-4 are children of 5.3.5
    const groups = getECTDSections();
    const section53 = groups.find((g) => g.section.sectionNumber === "5.3");
    const childNumbers = section53!.children.map((c) => c.sectionNumber);
    // 5.3.5 is a direct child of 5.3
    expect(childNumbers).toContain("5.3.5");
    // 5.3.5.1 is NOT a direct child of 5.3 (it's under 5.3.5)
    expect(childNumbers).not.toContain("5.3.5.1");
  });
});

// ---------------------------------------------------------------------------
// evaluateECTDCompleteness
// ---------------------------------------------------------------------------
describe("evaluateECTDCompleteness", () => {
  const fullProtocol = {
    title: "Vaccine Efficacy Trial",
    study_question: "Does vaccine X reduce infection?",
    population: "Adults 18-65",
    intervention: "BNT162b2 30mcg",
    comparator: "Saline placebo",
    outcomes: "PCR-confirmed infection",
    design: "Randomized Controlled Trial",
    status: "draft",
  };

  it("returns 15 completeness items (one per section)", () => {
    const result = evaluateECTDCompleteness({
      protocol: fullProtocol,
      evidenceCount: 5,
      screeningCount: 3,
      robCount: 2,
      metaAnalysisCount: 1,
    });
    expect(result).toHaveLength(15);
  });

  it("each item has required properties", () => {
    const result = evaluateECTDCompleteness({
      protocol: fullProtocol,
      evidenceCount: 1,
      screeningCount: 1,
      robCount: 1,
      metaAnalysisCount: 1,
    });
    for (const item of result) {
      expect(item.sectionNumber).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(["complete", "partial", "template-only"]).toContain(item.status);
      expect(item.reason).toBeTruthy();
    }
  });

  describe("5.1 — Table of Contents", () => {
    it("is always complete (auto-generated)", () => {
      const result = evaluateECTDCompleteness({
        protocol: {},
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const toc = result.find((r) => r.sectionNumber === "5.1");
      expect(toc?.status).toBe("complete");
    });
  });

  describe("5.2 — Tabular Listing", () => {
    it("is complete with screening data", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 5,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const listing = result.find((r) => r.sectionNumber === "5.2");
      expect(listing?.status).toBe("complete");
      expect(listing?.reason).toContain("5 included studies");
    });

    it("is template-only with no screening data", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const listing = result.find((r) => r.sectionNumber === "5.2");
      expect(listing?.status).toBe("template-only");
    });
  });

  describe("5.3.5.1 — Controlled Clinical Studies", () => {
    it("is complete with evidence AND RoB", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 3,
        screeningCount: 0,
        robCount: 2,
        metaAnalysisCount: 0,
      });
      const rct = result.find((r) => r.sectionNumber === "5.3.5.1");
      expect(rct?.status).toBe("complete");
    });

    it("is partial with evidence but no RoB", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 3,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const rct = result.find((r) => r.sectionNumber === "5.3.5.1");
      expect(rct?.status).toBe("partial");
      expect(rct?.reason).toContain("no risk-of-bias");
    });

    it("is template-only with no evidence", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const rct = result.find((r) => r.sectionNumber === "5.3.5.1");
      expect(rct?.status).toBe("template-only");
    });
  });

  describe("5.3.5.2 — Uncontrolled Clinical Studies", () => {
    it("is complete with evidence", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 1,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const obs = result.find((r) => r.sectionNumber === "5.3.5.2");
      expect(obs?.status).toBe("complete");
    });

    it("is template-only with no evidence", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const obs = result.find((r) => r.sectionNumber === "5.3.5.2");
      expect(obs?.status).toBe("template-only");
    });
  });

  describe("5.3.5.3 — Pooled Analyses", () => {
    it("is complete with meta-analysis data", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 3,
      });
      const pooled = result.find((r) => r.sectionNumber === "5.3.5.3");
      expect(pooled?.status).toBe("complete");
    });

    it("is template-only with no meta-analysis", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const pooled = result.find((r) => r.sectionNumber === "5.3.5.3");
      expect(pooled?.status).toBe("template-only");
    });
  });

  describe("5.4 — Literature References", () => {
    it("is complete with evidence", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 1,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const lit = result.find((r) => r.sectionNumber === "5.4");
      expect(lit?.status).toBe("complete");
    });

    it("is template-only with no evidence", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const lit = result.find((r) => r.sectionNumber === "5.4");
      expect(lit?.status).toBe("template-only");
    });
  });

  describe("default template-only sections", () => {
    it("5.3 parent is template-only", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        screeningCount: 100,
        robCount: 100,
        metaAnalysisCount: 100,
      });
      const parent = result.find((r) => r.sectionNumber === "5.3");
      expect(parent?.status).toBe("template-only");
    });

    it("5.3.5.4 Other Study Reports is template-only", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        screeningCount: 100,
        robCount: 100,
        metaAnalysisCount: 100,
      });
      const other = result.find((r) => r.sectionNumber === "5.3.5.4");
      expect(other?.status).toBe("template-only");
    });

    it("5.3.6 Post-Marketing is template-only", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        screeningCount: 100,
        robCount: 100,
        metaAnalysisCount: 100,
      });
      const pm = result.find((r) => r.sectionNumber === "5.3.6");
      expect(pm?.status).toBe("template-only");
    });
  });

  describe("empty protocol edge case", () => {
    it("handles completely empty data", () => {
      const result = evaluateECTDCompleteness({
        protocol: {},
        evidenceCount: 0,
        screeningCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      expect(result).toHaveLength(15);
      const complete = result.filter((r) => r.status === "complete");
      // Only 5.1 (auto-generated) should be complete
      expect(complete).toHaveLength(1);
      expect(complete[0].sectionNumber).toBe("5.1");
    });

    it("all data available gives maximum completeness", () => {
      const result = evaluateECTDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 10,
        screeningCount: 5,
        robCount: 3,
        metaAnalysisCount: 2,
      });
      const complete = result.filter((r) => r.status === "complete");
      // 5.1 (auto), 5.2 (screening), 5.3.5.1 (evidence+rob), 5.3.5.2 (evidence),
      // 5.3.5.3 (meta-analysis), 5.4 (evidence) = 6 complete
      expect(complete).toHaveLength(6);
    });
  });
});
