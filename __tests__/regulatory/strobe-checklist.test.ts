import { describe, it, expect } from "vitest";
import {
  STROBE_CHECKLIST,
  STROBE_ITEM_COUNT,
  getStrobeItemsForStudyType,
  getStrobeSections,
  getStrobeItemCount,
  type StrobeStudyType,
} from "@/lib/regulatory/strobe-checklist";

describe("STROBE_CHECKLIST", () => {
  it("has items including study-type variants", () => {
    expect(STROBE_CHECKLIST.length).toBeGreaterThanOrEqual(22);
    expect(STROBE_ITEM_COUNT).toBe(STROBE_CHECKLIST.length);
  });

  it("every item has required fields", () => {
    for (const item of STROBE_CHECKLIST) {
      expect(item.id).toBeTruthy();
      expect(item.section).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(Array.isArray(item.appliesTo)).toBe(true);
    }
  });

  it("has unique item IDs", () => {
    const ids = STROBE_CHECKLIST.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has items with PICO mappings", () => {
    const withMapping = STROBE_CHECKLIST.filter((item) => item.picoMapping);
    expect(withMapping.length).toBeGreaterThanOrEqual(4);
  });

  it("has study-type-specific items for items 6, 12, 14, 15", () => {
    const variantItems = STROBE_CHECKLIST.filter(
      (item) => item.appliesTo.length > 0,
    );
    expect(variantItems.length).toBeGreaterThanOrEqual(5);
  });
});

describe("getStrobeItemsForStudyType", () => {
  const studyTypes: StrobeStudyType[] = [
    "cohort",
    "case-control",
    "cross-sectional",
  ];

  it("returns items for each study type", () => {
    for (const type of studyTypes) {
      const items = getStrobeItemsForStudyType(type);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it("excludes items that do not apply to the study type", () => {
    const cohortItems = getStrobeItemsForStudyType("cohort");
    const caseControlOnly = STROBE_CHECKLIST.filter(
      (item) =>
        item.appliesTo.length > 0 &&
        item.appliesTo.includes("case-control") &&
        !item.appliesTo.includes("cohort"),
    );
    for (const excluded of caseControlOnly) {
      expect(cohortItems.find((i) => i.id === excluded.id)).toBeUndefined();
    }
  });

  it("includes universal items (empty appliesTo) in all study types", () => {
    const universalItems = STROBE_CHECKLIST.filter(
      (item) => item.appliesTo.length === 0,
    );
    for (const type of studyTypes) {
      const items = getStrobeItemsForStudyType(type);
      for (const universal of universalItems) {
        expect(items.find((i) => i.id === universal.id)).toBeDefined();
      }
    }
  });

  it("cohort has follow-up-specific items", () => {
    const cohortItems = getStrobeItemsForStudyType("cohort");
    const cohortSpecific = cohortItems.filter((i) => i.id.includes("cohort"));
    expect(cohortSpecific.length).toBeGreaterThan(0);
  });
});

describe("getStrobeSections", () => {
  it("returns unique section names", () => {
    const sections = getStrobeSections();
    expect(new Set(sections).size).toBe(sections.length);
  });

  it("starts with Title and Abstract", () => {
    const sections = getStrobeSections();
    expect(sections[0]).toBe("Title and Abstract");
  });
});

describe("getStrobeItemCount", () => {
  it("returns correct count for each study type", () => {
    const studyTypes: StrobeStudyType[] = [
      "cohort",
      "case-control",
      "cross-sectional",
    ];
    for (const type of studyTypes) {
      const count = getStrobeItemCount(type);
      const items = getStrobeItemsForStudyType(type);
      expect(count).toBe(items.length);
    }
  });
});
