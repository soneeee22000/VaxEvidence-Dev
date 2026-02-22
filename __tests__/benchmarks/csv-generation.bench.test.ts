/**
 * Performance benchmarks for CSV generation.
 *
 * All CSV generators use .map() → .join("\n") — no streaming.
 * At large scales, the entire CSV string is built in memory.
 * This tests how that scales with 100 to 10,000 items.
 */

import { describe, it, expect } from "vitest";
import {
  generateEvidenceCSV,
  generateActivityCSV,
  generateProtocolsCSV,
  generateDatasetsCSV,
} from "@/lib/export/csv-generator";
import {
  benchmarkSync,
  generateEvidenceItems,
  generateActivityLogs,
  payloadSizeKB,
} from "./helpers";
import { randomUUID } from "crypto";

describe("CSV Generation Performance", () => {
  const SCALES = [100, 500, 1_000, 5_000, 10_000];

  describe("Evidence CSV", () => {
    for (const n of SCALES) {
      it(`generates CSV for ${n.toLocaleString()} evidence items`, () => {
        const items = generateEvidenceItems(n);

        const { durationMs, memoryDeltaMB, result } = benchmarkSync(
          `generateEvidenceCSV (n=${n})`,
          n,
          () => generateEvidenceCSV(items),
        );

        const csvSizeKB = Math.round((result.length / 1024) * 10) / 10;
        const lineCount = result.split("\n").length;

        console.log(
          `  [n=${n}] ${durationMs}ms | ${memoryDeltaMB}MB | ` +
            `${csvSizeKB} KB | ${lineCount} lines`,
        );

        // Verify structure
        expect(lineCount).toBe(n + 1); // header + n rows
        expect(result).toContain("ID");
        expect(result).toContain("Title");

        // Performance: CSV generation should be fast even at 10K
        expect(durationMs).toBeLessThan(5_000);
      });
    }
  });

  describe("Activity CSV", () => {
    for (const n of SCALES) {
      it(`generates CSV for ${n.toLocaleString()} activity entries`, () => {
        const logs = generateActivityLogs(n);

        const { durationMs, memoryDeltaMB, result } = benchmarkSync(
          `generateActivityCSV (n=${n})`,
          n,
          () => generateActivityCSV(logs),
        );

        const csvSizeKB = Math.round((result.length / 1024) * 10) / 10;

        console.log(
          `  [n=${n}] ${durationMs}ms | ${memoryDeltaMB}MB | ${csvSizeKB} KB`,
        );

        expect(durationMs).toBeLessThan(5_000);
      });
    }
  });

  describe("Protocol CSV", () => {
    it("generates CSV for 1,000 protocols", () => {
      const protocols = Array.from({ length: 1_000 }, (_, i) => ({
        id: randomUUID(),
        title: `Protocol ${i}: Vaccine Efficacy Study`,
        status: "active",
        study_question: `What is the efficacy of vaccine ${i}?`,
        population: `Adults aged ${20 + (i % 50)}-${40 + (i % 30)}`,
        comparator: "Placebo",
        outcomes: "Seroconversion rate",
        design: "Randomized controlled trial",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { durationMs, result } = benchmarkSync(
        "generateProtocolsCSV (n=1000)",
        1_000,
        () => generateProtocolsCSV(protocols),
      );

      const csvSizeKB = Math.round((result.length / 1024) * 10) / 10;
      console.log(`  [n=1000] ${durationMs}ms | ${csvSizeKB} KB`);
      expect(durationMs).toBeLessThan(2_000);
    });
  });

  describe("Memory overhead at scale", () => {
    it("measures memory for 10K evidence CSV in-memory", () => {
      const items = generateEvidenceItems(10_000);
      const inputSizeKB = payloadSizeKB(items);

      const { memoryDeltaMB, result } = benchmarkSync(
        "Memory: 10K evidence CSV",
        10_000,
        () => generateEvidenceCSV(items),
      );

      const outputSizeKB = Math.round((result.length / 1024) * 10) / 10;

      console.log(`  Input JSON: ${inputSizeKB} KB`);
      console.log(`  Output CSV: ${outputSizeKB} KB`);
      console.log(`  Memory delta: ${memoryDeltaMB} MB`);
      console.log(
        `  Amplification: ${(outputSizeKB / inputSizeKB).toFixed(2)}x`,
      );
    });
  });
});
