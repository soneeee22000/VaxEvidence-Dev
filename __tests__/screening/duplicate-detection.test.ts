import { describe, it, expect } from "vitest";
import { detectDuplicates } from "@/lib/screening/duplicate-detection";
import type { ScreeningDecisionWithEvidence } from "@/lib/validators/screening";

/** Helper to create a minimal screening decision with evidence for testing. */
function makeDecision(
  overrides: Partial<{
    id: string;
    title: string;
    doi: string | null;
    external_id: string | null;
  }> = {},
): ScreeningDecisionWithEvidence {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    id,
    protocol_id: "p-1",
    evidence_id: `ev-${id}`,
    stage: "identification",
    decision: "pending",
    exclusion_reason: null,
    decided_by: null,
    decided_at: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    evidence_items: {
      id: `ev-${id}`,
      title: overrides.title ?? `Study ${id}`,
      type: "academic",
      authors: "Author A",
      doi: overrides.doi ?? null,
      external_id: overrides.external_id ?? null,
      external_source: null,
      description: null,
      tags: null,
    },
  };
}

describe("detectDuplicates", () => {
  describe("empty and single-item inputs", () => {
    it("returns empty array for empty input", () => {
      expect(detectDuplicates([])).toEqual([]);
    });

    it("returns empty array for a single item", () => {
      const decisions = [makeDecision({ id: "1", title: "Single Study" })];
      expect(detectDuplicates(decisions)).toEqual([]);
    });

    it("returns empty array when no duplicates exist", () => {
      const decisions = [
        makeDecision({ id: "1", title: "Alpha Study on COVID" }),
        makeDecision({ id: "2", title: "Beta Trial of Influenza Vaccine" }),
        makeDecision({ id: "3", title: "Gamma Analysis of RSV Data" }),
      ];
      expect(detectDuplicates(decisions)).toEqual([]);
    });
  });

  describe("Pass 1: DOI matching", () => {
    it("groups items with identical DOIs", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1038/s41586-020-2639-4" }),
        makeDecision({ id: "2", doi: "10.1038/s41586-020-2639-4" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("doi");
      expect(groups[0].items).toHaveLength(2);
      expect(groups[0].groupIndex).toBe(0);
    });

    it("matches DOIs case-insensitively", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1038/S41586-020-2639-4" }),
        makeDecision({ id: "2", doi: "10.1038/s41586-020-2639-4" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("doi");
    });

    it("trims whitespace from DOIs before comparing", () => {
      const decisions = [
        makeDecision({ id: "1", doi: " 10.1038/s41586-020-2639-4 " }),
        makeDecision({ id: "2", doi: "10.1038/s41586-020-2639-4" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("doi");
    });

    it("does not group items with different DOIs", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1038/s41586-020-2639-4" }),
        makeDecision({ id: "2", doi: "10.1016/j.cell.2021.01.007" }),
      ];
      expect(detectDuplicates(decisions)).toEqual([]);
    });

    it("ignores items with null DOI", () => {
      const decisions = [
        makeDecision({ id: "1", doi: null }),
        makeDecision({ id: "2", doi: null }),
      ];
      // Null DOIs should not match each other in Pass 1
      // They could still match by title in Pass 3 if titles are similar
      const groups = detectDuplicates(decisions);
      const doiGroups = groups.filter((g) => g.matchType === "doi");
      expect(doiGroups).toHaveLength(0);
    });

    it("groups 3+ items sharing the same DOI", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1038/xyz" }),
        makeDecision({ id: "2", doi: "10.1038/xyz" }),
        makeDecision({ id: "3", doi: "10.1038/xyz" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].items).toHaveLength(3);
    });
  });

  describe("Pass 2: External ID matching", () => {
    it("groups items with identical external_ids", () => {
      const decisions = [
        makeDecision({ id: "1", external_id: "PMID:12345678" }),
        makeDecision({ id: "2", external_id: "PMID:12345678" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("external_id");
    });

    it("matches external_ids case-insensitively", () => {
      const decisions = [
        makeDecision({ id: "1", external_id: "NCT04516746" }),
        makeDecision({ id: "2", external_id: "nct04516746" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("external_id");
    });

    it("skips items already assigned by DOI matching", () => {
      const decisions = [
        makeDecision({
          id: "1",
          doi: "10.1038/xyz",
          external_id: "PMID:111",
        }),
        makeDecision({
          id: "2",
          doi: "10.1038/xyz",
          external_id: "PMID:111",
        }),
      ];
      const groups = detectDuplicates(decisions);

      // Should only have 1 DOI group, not also an external_id group
      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("doi");
    });

    it("ignores items with null external_id", () => {
      const decisions = [
        makeDecision({ id: "1", external_id: null }),
        makeDecision({ id: "2", external_id: null }),
      ];
      const groups = detectDuplicates(decisions);
      const extIdGroups = groups.filter((g) => g.matchType === "external_id");
      expect(extIdGroups).toHaveLength(0);
    });
  });

  describe("Pass 3: Fuzzy title similarity (Dice coefficient)", () => {
    it("groups items with very similar titles", () => {
      const decisions = [
        makeDecision({
          id: "1",
          title:
            "Effectiveness of mRNA COVID-19 Vaccines in Preventing Infection",
        }),
        makeDecision({
          id: "2",
          title:
            "Effectiveness of mRNA COVID-19 Vaccines in Preventing Infections",
        }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("title_similarity");
    });

    it("does not group items with dissimilar titles", () => {
      const decisions = [
        makeDecision({
          id: "1",
          title: "COVID-19 Vaccine Effectiveness in the Elderly Population",
        }),
        makeDecision({
          id: "2",
          title: "Influenza Prevention Strategies for Children Under Five",
        }),
      ];
      expect(detectDuplicates(decisions)).toEqual([]);
    });

    it("handles identical titles as duplicates", () => {
      const decisions = [
        makeDecision({ id: "1", title: "Exactly The Same Title" }),
        makeDecision({ id: "2", title: "Exactly The Same Title" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("title_similarity");
    });

    it("handles special characters in titles", () => {
      const decisions = [
        makeDecision({
          id: "1",
          title: "BNT162b2 (Pfizer–BioNTech) COVID-19 Vaccine: Efficacy",
        }),
        makeDecision({
          id: "2",
          title: "BNT162b2 (Pfizer-BioNTech) COVID-19 Vaccine: Efficacy",
        }),
      ];
      const groups = detectDuplicates(decisions);

      // Special chars are stripped in normalization, so these should match
      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("title_similarity");
    });

    it("skips items already grouped by DOI or external_id", () => {
      const decisions = [
        makeDecision({
          id: "1",
          doi: "10.1038/xyz",
          title: "Duplicate Study Title Here",
        }),
        makeDecision({
          id: "2",
          doi: "10.1038/xyz",
          title: "Duplicate Study Title Here",
        }),
        makeDecision({ id: "3", title: "Unique Study About Something Else" }),
      ];
      const groups = detectDuplicates(decisions);

      // DOI group only; item 3 is unique so no title group
      expect(groups).toHaveLength(1);
      expect(groups[0].matchType).toBe("doi");
    });

    it("does not match empty titles", () => {
      const decisions = [
        makeDecision({ id: "1", title: "" }),
        makeDecision({ id: "2", title: "" }),
      ];
      // Dice similarity of empty strings returns 0
      const groups = detectDuplicates(decisions);
      expect(groups).toEqual([]);
    });
  });

  describe("multi-pass integration", () => {
    it("produces separate groups from different match types", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1038/aaa" }),
        makeDecision({ id: "2", doi: "10.1038/aaa" }),
        makeDecision({ id: "3", external_id: "PMID:999" }),
        makeDecision({ id: "4", external_id: "PMID:999" }),
        makeDecision({
          id: "5",
          title:
            "A comprehensive study on the safety of adjuvanted influenza vaccines",
        }),
        makeDecision({
          id: "6",
          title:
            "A comprehensive study on the safety of adjuvanted influenza vaccine",
        }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(3);
      expect(groups[0].matchType).toBe("doi");
      expect(groups[0].groupIndex).toBe(0);
      expect(groups[1].matchType).toBe("external_id");
      expect(groups[1].groupIndex).toBe(1);
      expect(groups[2].matchType).toBe("title_similarity");
      expect(groups[2].groupIndex).toBe(2);
    });

    it("assigns incrementing groupIndex across all passes", () => {
      const decisions = [
        makeDecision({ id: "1", doi: "10.1/a" }),
        makeDecision({ id: "2", doi: "10.1/a" }),
        makeDecision({ id: "3", doi: "10.1/b" }),
        makeDecision({ id: "4", doi: "10.1/b" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(2);
      expect(groups[0].groupIndex).toBe(0);
      expect(groups[1].groupIndex).toBe(1);
    });

    it("prioritizes DOI match over external_id for same items", () => {
      // Items 1 & 2 share both DOI and external_id — should appear in DOI group only
      const decisions = [
        makeDecision({
          id: "1",
          doi: "10.1038/xyz",
          external_id: "PMID:111",
        }),
        makeDecision({
          id: "2",
          doi: "10.1038/xyz",
          external_id: "PMID:111",
        }),
        makeDecision({ id: "3", external_id: "PMID:222" }),
        makeDecision({ id: "4", external_id: "PMID:222" }),
      ];
      const groups = detectDuplicates(decisions);

      expect(groups).toHaveLength(2);
      expect(groups[0].matchType).toBe("doi");
      expect(groups[0].items).toHaveLength(2);
      expect(groups[1].matchType).toBe("external_id");
      expect(groups[1].items).toHaveLength(2);
    });
  });
});
