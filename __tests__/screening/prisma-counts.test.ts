import { describe, it, expect } from "vitest";
import {
  computePrismaCounts,
  type PrismaFlowData,
} from "@/lib/screening/prisma-counts";
import type { ScreeningStageCounts } from "@/lib/validators/screening";

/** Helper to create a stage counts object with all zeros. */
function emptyCounts(): ScreeningStageCounts {
  const zero = () => ({
    total: 0,
    pending: 0,
    include: 0,
    exclude: 0,
    duplicate: 0,
  });
  return {
    identification: zero(),
    screening: zero(),
    eligibility: zero(),
    included: zero(),
  };
}

describe("computePrismaCounts", () => {
  it("returns all zeros for empty counts", () => {
    const result = computePrismaCounts(emptyCounts());
    expect(result).toEqual({
      identified: 0,
      duplicatesRemoved: 0,
      screened: 0,
      screeningExcluded: 0,
      eligibilityAssessed: 0,
      eligibilityExcluded: 0,
      included: 0,
    });
  });

  it("maps identification totals correctly", () => {
    const counts = emptyCounts();
    counts.identification = {
      total: 100,
      pending: 50,
      include: 30,
      exclude: 10,
      duplicate: 10,
    };
    const result = computePrismaCounts(counts);

    expect(result.identified).toBe(100);
    expect(result.duplicatesRemoved).toBe(10);
  });

  it("maps screening stage correctly", () => {
    const counts = emptyCounts();
    counts.screening = {
      total: 80,
      pending: 20,
      include: 50,
      exclude: 10,
      duplicate: 0,
    };
    const result = computePrismaCounts(counts);

    expect(result.screened).toBe(80);
    expect(result.screeningExcluded).toBe(10);
  });

  it("maps eligibility stage correctly", () => {
    const counts = emptyCounts();
    counts.eligibility = {
      total: 50,
      pending: 5,
      include: 35,
      exclude: 10,
      duplicate: 0,
    };
    const result = computePrismaCounts(counts);

    expect(result.eligibilityAssessed).toBe(50);
    expect(result.eligibilityExcluded).toBe(10);
  });

  describe("included fallback logic", () => {
    it("uses eligibility.include when included.total is 0", () => {
      const counts = emptyCounts();
      counts.eligibility = {
        total: 40,
        pending: 0,
        include: 25,
        exclude: 15,
        duplicate: 0,
      };
      counts.included = {
        total: 0,
        pending: 0,
        include: 0,
        exclude: 0,
        duplicate: 0,
      };
      const result = computePrismaCounts(counts);

      expect(result.included).toBe(25);
    });

    it("uses included.include + included.pending when included.total > 0", () => {
      const counts = emptyCounts();
      counts.eligibility = {
        total: 40,
        pending: 0,
        include: 25,
        exclude: 15,
        duplicate: 0,
      };
      counts.included = {
        total: 20,
        pending: 5,
        include: 15,
        exclude: 0,
        duplicate: 0,
      };
      const result = computePrismaCounts(counts);

      // inc.total > 0 → inc.include + inc.pending = 15 + 5 = 20
      expect(result.included).toBe(20);
    });

    it("returns 0 included when both included.total and eligibility.include are 0", () => {
      const counts = emptyCounts();
      const result = computePrismaCounts(counts);

      expect(result.included).toBe(0);
    });
  });

  it("computes a complete PRISMA pipeline correctly", () => {
    const counts: ScreeningStageCounts = {
      identification: {
        total: 500,
        pending: 0,
        include: 400,
        exclude: 50,
        duplicate: 50,
      },
      screening: {
        total: 400,
        pending: 0,
        include: 200,
        exclude: 200,
        duplicate: 0,
      },
      eligibility: {
        total: 200,
        pending: 0,
        include: 80,
        exclude: 120,
        duplicate: 0,
      },
      included: {
        total: 80,
        pending: 10,
        include: 70,
        exclude: 0,
        duplicate: 0,
      },
    };

    const result = computePrismaCounts(counts);

    expect(result).toEqual({
      identified: 500,
      duplicatesRemoved: 50,
      screened: 400,
      screeningExcluded: 200,
      eligibilityAssessed: 200,
      eligibilityExcluded: 120,
      included: 80, // 70 + 10
    });
  });

  it("handles case where only pending items exist in included stage", () => {
    const counts = emptyCounts();
    counts.included = {
      total: 5,
      pending: 5,
      include: 0,
      exclude: 0,
      duplicate: 0,
    };
    const result = computePrismaCounts(counts);

    // inc.total > 0 → inc.include + inc.pending = 0 + 5 = 5
    expect(result.included).toBe(5);
  });

  it("returns correct PrismaFlowData type shape", () => {
    const result: PrismaFlowData = computePrismaCounts(emptyCounts());

    expect(result).toHaveProperty("identified");
    expect(result).toHaveProperty("duplicatesRemoved");
    expect(result).toHaveProperty("screened");
    expect(result).toHaveProperty("screeningExcluded");
    expect(result).toHaveProperty("eligibilityAssessed");
    expect(result).toHaveProperty("eligibilityExcluded");
    expect(result).toHaveProperty("included");
  });
});
