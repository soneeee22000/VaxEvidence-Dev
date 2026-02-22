/**
 * Performance benchmarks for duplicate detection (client-side O(n²) fuzzy matching).
 *
 * The duplicate detection algorithm has three passes:
 *   Pass 1: DOI exact match — O(n) via Map
 *   Pass 2: External ID exact match — O(n) via Map
 *   Pass 3: Fuzzy title similarity (Dice coefficient) — O(n²)
 *
 * Pass 3 is the bottleneck. At n=1000 unmatched items, it runs ~500K comparisons.
 * At n=5000 it runs ~12.5M. This test quantifies the actual wall-clock cost.
 */

import { describe, it, expect } from "vitest";
import { detectDuplicates } from "@/lib/screening/duplicate-detection";
import {
  benchmarkSync,
  generateScreeningDecisions,
  generateScreeningWithDuplicates,
  payloadSizeKB,
} from "./helpers";

describe("Duplicate Detection Performance", () => {
  const SCALES = [100, 500, 1_000, 2_000, 5_000];

  describe("Full pipeline (DOI + PMID + fuzzy title)", () => {
    const results = SCALES.map((n) => {
      return {
        n,
        run: () => {
          const decisions = generateScreeningWithDuplicates(n);
          return benchmarkSync(`detectDuplicates (mixed, n=${n})`, n, () =>
            detectDuplicates(decisions),
          );
        },
      };
    });

    for (const { n, run } of results) {
      it(`handles ${n.toLocaleString()} items with duplicates`, () => {
        const { durationMs, memoryDeltaMB, result } = run();

        // Verify correctness
        expect(result.length).toBeGreaterThan(0);
        const totalDuped = result.reduce((sum, g) => sum + g.items.length, 0);
        expect(totalDuped).toBeGreaterThan(0);

        console.log(
          `  [n=${n}] ${durationMs}ms | ${memoryDeltaMB}MB | ` +
            `${result.length} groups, ${totalDuped} items flagged`,
        );

        // Performance thresholds
        if (n <= 1_000) {
          expect(durationMs).toBeLessThan(5_000); // Should complete in <5s
        }
        if (n <= 500) {
          expect(durationMs).toBeLessThan(1_000); // Should complete in <1s
        }
      });
    }
  });

  describe("Worst case: all unique titles (maximum fuzzy comparisons)", () => {
    const WORST_CASE_SCALES = [100, 500, 1_000, 2_000];

    for (const n of WORST_CASE_SCALES) {
      it(`handles ${n.toLocaleString()} unique-title items`, () => {
        // Generate items with NO DOI/PMID matches and all unique titles
        // This forces every item through the O(n²) fuzzy pass
        const decisions = generateScreeningDecisions(n).map((d, i) => ({
          ...d,
          evidence_items: {
            ...d.evidence_items,
            doi: null,
            external_id: null,
            title: `Completely Unique Research Paper Number ${i} About ${i * 7}`,
          },
        }));

        const { durationMs, memoryDeltaMB } = benchmarkSync(
          `detectDuplicates (worst-case, n=${n})`,
          n,
          () => detectDuplicates(decisions),
        );

        console.log(
          `  [worst-case n=${n}] ${durationMs}ms | ${memoryDeltaMB}MB | ` +
            `${(n * (n - 1)) / 2} comparisons`,
        );

        // Worst case thresholds (all items go through fuzzy pass)
        if (n <= 500) {
          expect(durationMs).toBeLessThan(2_000);
        }
        if (n <= 1_000) {
          expect(durationMs).toBeLessThan(10_000);
        }
      });
    }
  });

  describe("Best case: all DOI matches (no fuzzy pass)", () => {
    it("handles 5,000 items when all have DOI duplicates", () => {
      const n = 5_000;
      const decisions = generateScreeningDecisions(n).map((d, i) => ({
        ...d,
        evidence_items: {
          ...d.evidence_items,
          // Create pairs: items 0,1 share DOI; 2,3 share DOI; etc.
          doi: `10.1000/paired.${Math.floor(i / 2)}`,
        },
      }));

      const { durationMs, result } = benchmarkSync(
        `detectDuplicates (best-case DOI, n=${n})`,
        n,
        () => detectDuplicates(decisions),
      );

      console.log(
        `  [best-case n=${n}] ${durationMs}ms | ` +
          `${result.length} groups (DOI match short-circuits fuzzy)`,
      );

      // DOI-only pass should be nearly instant
      expect(durationMs).toBeLessThan(500);
      expect(result.length).toBe(n / 2);
    });
  });

  describe("Payload size analysis", () => {
    it("reports payload sizes at different scales", () => {
      for (const n of [100, 1_000, 5_000, 10_000]) {
        const decisions = generateScreeningDecisions(n);
        const sizeKB = payloadSizeKB(decisions);
        console.log(`  Screening decisions payload (n=${n}): ${sizeKB} KB`);
      }
    });
  });
});
