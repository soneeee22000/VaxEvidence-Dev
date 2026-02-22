/**
 * Performance benchmarks for screening count aggregation.
 *
 * getScreeningCounts() fetches all screening decisions and aggregates in JS.
 * This benchmark compares the JS aggregation approach against what a
 * SQL GROUP BY would return, measuring the overhead of client-side counting.
 */

import { describe, it, expect } from "vitest";
import { benchmarkSync, generateScreeningDecisions } from "./helpers";
import type {
  ScreeningStageCounts,
  ScreeningStage,
} from "@/lib/validators/screening";

/**
 * Simulate the current JS aggregation from getScreeningCounts().
 * This is what actually runs — loop over all rows and bucket them.
 */
function jsAggregation(
  data: Array<{ stage: string; decision: string }>,
): ScreeningStageCounts {
  const emptyCounts = () => ({
    total: 0,
    pending: 0,
    include: 0,
    exclude: 0,
    duplicate: 0,
  });

  const counts: ScreeningStageCounts = {
    identification: emptyCounts(),
    screening: emptyCounts(),
    eligibility: emptyCounts(),
    included: emptyCounts(),
  };

  for (const row of data) {
    const stage = row.stage as ScreeningStage;
    const decision = row.decision as string;
    if (counts[stage]) {
      counts[stage].total++;
      if (decision in counts[stage]) {
        (counts[stage] as Record<string, number>)[decision]++;
      }
    }
  }

  return counts;
}

/**
 * Simulate what SQL GROUP BY stage, decision would return.
 * Database does the aggregation — client just reads the result.
 */
function sqlGroupBySimulation(
  data: Array<{ stage: string; decision: string }>,
): ScreeningStageCounts {
  // Step 1: Simulate what the DB returns (grouped counts)
  const grouped = new Map<string, number>();
  for (const row of data) {
    const key = `${row.stage}:${row.decision}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  // Step 2: Reconstruct from grouped result (this is what client code would do)
  const emptyCounts = () => ({
    total: 0,
    pending: 0,
    include: 0,
    exclude: 0,
    duplicate: 0,
  });

  const counts: ScreeningStageCounts = {
    identification: emptyCounts(),
    screening: emptyCounts(),
    eligibility: emptyCounts(),
    included: emptyCounts(),
  };

  for (const [key, count] of grouped) {
    const [stage, decision] = key.split(":");
    if (counts[stage as ScreeningStage]) {
      counts[stage as ScreeningStage].total += count;
      if (decision in counts[stage as ScreeningStage]) {
        (counts[stage as ScreeningStage] as Record<string, number>)[decision] +=
          count;
      }
    }
  }

  return counts;
}

describe("Screening Counts Aggregation Performance", () => {
  const SCALES = [100, 500, 1_000, 5_000, 10_000];

  describe("Current approach: JS loop over all rows", () => {
    for (const n of SCALES) {
      it(`aggregates ${n.toLocaleString()} decisions`, () => {
        const decisions = generateScreeningDecisions(n);
        const data = decisions.map((d) => ({
          stage: d.stage,
          decision: d.decision,
        }));

        const { durationMs, result } = benchmarkSync(
          `JS aggregation (n=${n})`,
          n,
          () => jsAggregation(data),
        );

        // Verify correctness
        const totalCounted = Object.values(result).reduce(
          (sum, stage) => sum + stage.total,
          0,
        );
        expect(totalCounted).toBe(n);

        console.log(`  [JS n=${n}] ${durationMs}ms`);

        // JS aggregation should be fast regardless
        expect(durationMs).toBeLessThan(100);
      });
    }
  });

  describe("Optimal approach: SQL GROUP BY simulation", () => {
    for (const n of SCALES) {
      it(`aggregates ${n.toLocaleString()} decisions`, () => {
        const decisions = generateScreeningDecisions(n);
        const data = decisions.map((d) => ({
          stage: d.stage,
          decision: d.decision,
        }));

        const { durationMs, result } = benchmarkSync(
          `SQL GROUP BY (n=${n})`,
          n,
          () => sqlGroupBySimulation(data),
        );

        const totalCounted = Object.values(result).reduce(
          (sum, stage) => sum + stage.total,
          0,
        );
        expect(totalCounted).toBe(n);

        console.log(`  [SQL n=${n}] ${durationMs}ms`);
      });
    }
  });

  describe("Network payload comparison", () => {
    it("compares payload sizes: all rows vs grouped counts", () => {
      for (const n of [1_000, 5_000, 10_000]) {
        const decisions = generateScreeningDecisions(n);
        const allRows = decisions.map((d) => ({
          stage: d.stage,
          decision: d.decision,
        }));

        // What we transfer today: all rows
        const currentPayloadKB =
          Math.round((JSON.stringify(allRows).length / 1024) * 10) / 10;

        // What we'd transfer with GROUP BY: ~16 rows (4 stages × 4 decisions)
        const grouped: Record<string, number> = {};
        for (const row of allRows) {
          const key = `${row.stage}:${row.decision}`;
          grouped[key] = (grouped[key] ?? 0) + 1;
        }
        const optimalPayloadKB =
          Math.round(
            (JSON.stringify(Object.entries(grouped)).length / 1024) * 10,
          ) / 10;

        console.log(
          `  [n=${n}] Current: ${currentPayloadKB} KB → Optimal: ${optimalPayloadKB} KB ` +
            `(${Math.round(currentPayloadKB / optimalPayloadKB)}x reduction)`,
        );

        // The grouped payload should be dramatically smaller
        expect(optimalPayloadKB).toBeLessThan(currentPayloadKB);
      }
    });
  });
});
