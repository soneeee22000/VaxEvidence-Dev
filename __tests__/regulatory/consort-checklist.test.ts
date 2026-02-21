import { describe, it, expect } from "vitest";
import {
  CONSORT_CHECKLIST,
  CONSORT_ITEM_COUNT,
  getConsortSections,
  type ConsortItem,
} from "@/lib/regulatory/consort-checklist";

describe("CONSORT_CHECKLIST", () => {
  it("has the expected number of items (37 sub-items)", () => {
    expect(CONSORT_CHECKLIST.length).toBe(37);
    expect(CONSORT_ITEM_COUNT).toBe(37);
  });

  it("every item has required fields", () => {
    for (const item of CONSORT_CHECKLIST) {
      expect(item.id).toBeTruthy();
      expect(item.section).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });

  it("has unique item IDs", () => {
    const ids = CONSORT_CHECKLIST.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has items with PICO mappings for key fields", () => {
    const withMapping = CONSORT_CHECKLIST.filter((item) => item.picoMapping);
    expect(withMapping.length).toBeGreaterThanOrEqual(5);

    const mappedFields = new Set(withMapping.map((item) => item.picoMapping));
    expect(mappedFields.has("study_question")).toBe(true);
    expect(mappedFields.has("population")).toBe(true);
    expect(mappedFields.has("outcomes")).toBe(true);
    expect(mappedFields.has("design")).toBe(true);
  });

  it("covers all expected sections", () => {
    const sections = getConsortSections();
    expect(sections.length).toBeGreaterThanOrEqual(15);
    expect(sections.some((s) => s.includes("Title"))).toBe(true);
    expect(sections.some((s) => s.includes("Introduction"))).toBe(true);
    expect(sections.some((s) => s.includes("Methods"))).toBe(true);
    expect(sections.some((s) => s.includes("Results"))).toBe(true);
    expect(sections.some((s) => s.includes("Discussion"))).toBe(true);
  });
});

describe("getConsortSections", () => {
  it("returns unique section names in order", () => {
    const sections = getConsortSections();
    expect(new Set(sections).size).toBe(sections.length);
  });

  it("first section is Title and Abstract", () => {
    const sections = getConsortSections();
    expect(sections[0]).toBe("Title and Abstract");
  });

  it("last section relates to Other Information", () => {
    const sections = getConsortSections();
    expect(sections[sections.length - 1]).toContain("Other Information");
  });
});
