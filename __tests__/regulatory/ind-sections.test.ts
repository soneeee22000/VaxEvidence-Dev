import { describe, it, expect } from "vitest";
import {
  IND_SECTIONS,
  getINDSection,
  evaluateINDCompleteness,
  type INDSectionDefinition,
} from "@/lib/regulatory/ind-sections";

// ---------------------------------------------------------------------------
// IND_SECTIONS constant
// ---------------------------------------------------------------------------
describe("IND_SECTIONS", () => {
  it("contains exactly 10 sections", () => {
    expect(IND_SECTIONS).toHaveLength(10);
  });

  it("each section has required properties", () => {
    for (const section of IND_SECTIONS) {
      expect(section.sectionNumber).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.reference).toBeTruthy();
      expect(section.guidance).toBeTruthy();
      expect(Array.isArray(section.autoPopulateFrom)).toBe(true);
      expect(typeof section.templateOnly).toBe("boolean");
    }
  });

  it("has unique section numbers", () => {
    const numbers = IND_SECTIONS.map((s) => s.sectionNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("starts with Cover Sheet and ends with (a)(10)", () => {
    expect(IND_SECTIONS[0].sectionNumber).toBe("Cover");
    expect(IND_SECTIONS[9].sectionNumber).toBe("(a)(10)");
  });

  it("has exactly 3 template-only sections", () => {
    const templateOnly = IND_SECTIONS.filter((s) => s.templateOnly);
    expect(templateOnly).toHaveLength(3);
    expect(templateOnly.map((s) => s.sectionNumber)).toEqual([
      "(a)(6)",
      "(a)(7)",
      "(a)(9)",
    ]);
  });

  it("template-only sections have empty autoPopulateFrom", () => {
    const templateOnly = IND_SECTIONS.filter((s) => s.templateOnly);
    for (const section of templateOnly) {
      expect(section.autoPopulateFrom).toEqual([]);
    }
  });

  it("non-template sections have at least one autoPopulateFrom entry", () => {
    const nonTemplate = IND_SECTIONS.filter((s) => !s.templateOnly);
    for (const section of nonTemplate) {
      expect(section.autoPopulateFrom.length).toBeGreaterThan(0);
    }
  });

  it("all references cite 21 CFR 312.23", () => {
    for (const section of IND_SECTIONS) {
      expect(section.reference).toContain("21 CFR 312.23");
    }
  });
});

// ---------------------------------------------------------------------------
// getINDSection
// ---------------------------------------------------------------------------
describe("getINDSection", () => {
  it("returns the correct section by number", () => {
    const cover = getINDSection("Cover");
    expect(cover.title).toBe("Cover Sheet (Form FDA-1571)");
  });

  it("returns section (a)(5) — Clinical Protocol", () => {
    const section = getINDSection("(a)(5)");
    expect(section.title).toBe("Clinical Protocol(s)");
    expect(section.templateOnly).toBe(false);
  });

  it("returns section (a)(6) — CMC (template-only)", () => {
    const section = getINDSection("(a)(6)");
    expect(section.title).toContain("Chemistry, Manufacturing");
    expect(section.templateOnly).toBe(true);
  });

  it("throws for unknown section number", () => {
    expect(() => getINDSection("(a)(99)")).toThrow(
      "IND section (a)(99) not found",
    );
  });

  it("throws for empty string", () => {
    expect(() => getINDSection("")).toThrow("IND section  not found");
  });

  it("is case-sensitive", () => {
    expect(() => getINDSection("cover")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// evaluateINDCompleteness
// ---------------------------------------------------------------------------
describe("evaluateINDCompleteness", () => {
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

  it("returns 10 section completeness items", () => {
    const result = evaluateINDCompleteness({
      protocol: fullProtocol,
      evidenceCount: 5,
      robCount: 3,
      metaAnalysisCount: 2,
    });
    expect(result).toHaveLength(10);
  });

  it("each item has sectionNumber, title, status, reason", () => {
    const result = evaluateINDCompleteness({
      protocol: fullProtocol,
      evidenceCount: 1,
      robCount: 0,
      metaAnalysisCount: 0,
    });
    for (const item of result) {
      expect(item.sectionNumber).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(["complete", "partial", "template-only"]).toContain(item.status);
      expect(item.reason).toBeTruthy();
    }
  });

  describe("Cover Sheet", () => {
    it("is complete when title exists", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const cover = result.find((r) => r.sectionNumber === "Cover");
      expect(cover?.status).toBe("complete");
    });

    it("is partial when title is missing", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol, title: undefined },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const cover = result.find((r) => r.sectionNumber === "Cover");
      expect(cover?.status).toBe("partial");
    });
  });

  describe("Table of Contents (a)(2)", () => {
    it("is always complete (auto-generated)", () => {
      const result = evaluateINDCompleteness({
        protocol: {},
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const toc = result.find((r) => r.sectionNumber === "(a)(2)");
      expect(toc?.status).toBe("complete");
    });
  });

  describe("Introductory Statement (a)(3)", () => {
    it("is complete with study_question and design", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const intro = result.find((r) => r.sectionNumber === "(a)(3)");
      expect(intro?.status).toBe("complete");
    });

    it("is partial when study_question is missing", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol, study_question: undefined },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const intro = result.find((r) => r.sectionNumber === "(a)(3)");
      expect(intro?.status).toBe("partial");
      expect(intro?.reason).toContain("study question");
    });

    it("is partial when design is missing", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol, design: undefined },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const intro = result.find((r) => r.sectionNumber === "(a)(3)");
      expect(intro?.status).toBe("partial");
      expect(intro?.reason).toContain("study design");
    });
  });

  describe("Investigator's Brochure (a)(4)", () => {
    it("is always partial (requires manual CMC data)", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 10,
        robCount: 5,
        metaAnalysisCount: 3,
      });
      const ib = result.find((r) => r.sectionNumber === "(a)(4)");
      expect(ib?.status).toBe("partial");
    });

    it("mentions evidence count when evidence exists", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 5,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const ib = result.find((r) => r.sectionNumber === "(a)(4)");
      expect(ib?.reason).toContain("5 evidence items");
    });

    it("mentions template when no evidence", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const ib = result.find((r) => r.sectionNumber === "(a)(4)");
      expect(ib?.reason).toContain("template");
    });
  });

  describe("Clinical Protocol (a)(5)", () => {
    it("is complete with full PICO + design", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const cp = result.find((r) => r.sectionNumber === "(a)(5)");
      expect(cp?.status).toBe("complete");
    });

    it("is partial when PICO is incomplete", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol, population: undefined },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const cp = result.find((r) => r.sectionNumber === "(a)(5)");
      expect(cp?.status).toBe("partial");
      expect(cp?.reason).toContain("PICO");
    });

    it("is partial when design is missing", () => {
      const result = evaluateINDCompleteness({
        protocol: { ...fullProtocol, design: undefined },
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const cp = result.find((r) => r.sectionNumber === "(a)(5)");
      expect(cp?.status).toBe("partial");
    });
  });

  describe("template-only sections", () => {
    it("(a)(6) CMC is template-only", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        robCount: 50,
        metaAnalysisCount: 25,
      });
      const cmc = result.find((r) => r.sectionNumber === "(a)(6)");
      expect(cmc?.status).toBe("template-only");
    });

    it("(a)(7) Pharm/Tox is template-only", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        robCount: 50,
        metaAnalysisCount: 25,
      });
      const pt = result.find((r) => r.sectionNumber === "(a)(7)");
      expect(pt?.status).toBe("template-only");
    });

    it("(a)(9) Additional Info is template-only", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 100,
        robCount: 50,
        metaAnalysisCount: 25,
      });
      const ai = result.find((r) => r.sectionNumber === "(a)(9)");
      expect(ai?.status).toBe("template-only");
    });
  });

  describe("Previous Human Experience (a)(8)", () => {
    it("is complete with evidence", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 3,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const phe = result.find((r) => r.sectionNumber === "(a)(8)");
      expect(phe?.status).toBe("complete");
      expect(phe?.reason).toContain("3 evidence items");
    });

    it("is partial with no evidence", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const phe = result.find((r) => r.sectionNumber === "(a)(8)");
      expect(phe?.status).toBe("partial");
    });
  });

  describe("Relevant Information (a)(10)", () => {
    it("is complete with RoB data", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 2,
        metaAnalysisCount: 0,
      });
      const ri = result.find((r) => r.sectionNumber === "(a)(10)");
      expect(ri?.status).toBe("complete");
    });

    it("is complete with meta-analysis data", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 1,
      });
      const ri = result.find((r) => r.sectionNumber === "(a)(10)");
      expect(ri?.status).toBe("complete");
    });

    it("is partial with no systematic review data", () => {
      const result = evaluateINDCompleteness({
        protocol: fullProtocol,
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      const ri = result.find((r) => r.sectionNumber === "(a)(10)");
      expect(ri?.status).toBe("partial");
    });
  });

  describe("empty protocol", () => {
    it("handles completely empty protocol", () => {
      const result = evaluateINDCompleteness({
        protocol: {},
        evidenceCount: 0,
        robCount: 0,
        metaAnalysisCount: 0,
      });
      expect(result).toHaveLength(10);
      // No complete sections except (a)(2) which is auto-generated
      const complete = result.filter((r) => r.status === "complete");
      expect(complete).toHaveLength(1);
      expect(complete[0].sectionNumber).toBe("(a)(2)");
    });
  });
});
