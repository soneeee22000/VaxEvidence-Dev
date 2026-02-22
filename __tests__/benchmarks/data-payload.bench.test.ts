/**
 * Performance benchmarks for data payload sizes and serialization.
 *
 * Measures JSON payload sizes at different scales to quantify
 * the impact of unbounded queries on network transfer.
 */

import { describe, it, expect } from "vitest";
import {
  benchmarkSync,
  generateEvidenceItems,
  generateScreeningDecisions,
  generateActivityLogs,
  payloadSizeKB,
} from "./helpers";
import { randomUUID } from "crypto";

describe("Data Payload Size Benchmarks", () => {
  describe("Evidence items payload", () => {
    const SCALES = [100, 500, 1_000, 5_000, 10_000];

    for (const n of SCALES) {
      it(`measures payload for ${n.toLocaleString()} evidence items`, () => {
        const items = generateEvidenceItems(n);
        const fullPayloadKB = payloadSizeKB(items);

        // Paginated payload (page of 20)
        const paginatedKB = payloadSizeKB(items.slice(0, 20));

        // Tags-only payload (getUniqueTags pattern)
        const tagsOnly = items.map((item) => ({ tags: item.tags }));
        const tagsPayloadKB = payloadSizeKB(tagsOnly);

        console.log(
          `  [n=${n}] Full: ${fullPayloadKB} KB | ` +
            `Page(20): ${paginatedKB} KB | ` +
            `Tags-only: ${tagsPayloadKB} KB`,
        );

        // Full payload grows linearly
        if (n >= 1_000) {
          expect(fullPayloadKB).toBeGreaterThan(100);
        }
      });
    }
  });

  describe("Screening decisions with evidence JOIN", () => {
    const SCALES = [100, 500, 1_000, 5_000];

    for (const n of SCALES) {
      it(`measures payload for ${n.toLocaleString()} screening decisions`, () => {
        const decisions = generateScreeningDecisions(n);
        const fullPayloadKB = payloadSizeKB(decisions);

        // Without embedded evidence (what we'd get with select("stage,decision"))
        const minimalData = decisions.map((d) => ({
          id: d.id,
          stage: d.stage,
          decision: d.decision,
          evidence_id: d.evidence_id,
        }));
        const minimalKB = payloadSizeKB(minimalData);

        console.log(
          `  [n=${n}] With evidence JOIN: ${fullPayloadKB} KB | ` +
            `Minimal (no join): ${minimalKB} KB | ` +
            `Ratio: ${(fullPayloadKB / minimalKB).toFixed(1)}x`,
        );
      });
    }
  });

  describe("Linked evidence (unbounded JOIN)", () => {
    it("measures payload for protocol with many linked studies", () => {
      const protocolId = randomUUID();
      const SCALES = [50, 200, 500, 1_000, 2_000];

      for (const n of SCALES) {
        const links = Array.from({ length: n }, (_, i) => ({
          id: randomUUID(),
          protocol_id: protocolId,
          evidence_id: randomUUID(),
          note: i % 3 === 0 ? `Note for link ${i}` : null,
          linked_at: new Date().toISOString(),
          evidence_items: generateEvidenceItems(1)[0],
        }));

        const sizeKB = payloadSizeKB(links);
        console.log(`  [n=${n} linked studies] ${sizeKB} KB`);

        // At 2000 linked studies, payload should be significant
        if (n >= 1_000) {
          expect(sizeKB).toBeGreaterThan(500);
        }
      }
    });
  });

  describe("JSON serialization performance", () => {
    const SCALES = [1_000, 5_000, 10_000];

    for (const n of SCALES) {
      it(`serializes ${n.toLocaleString()} evidence items`, () => {
        const items = generateEvidenceItems(n);

        const { durationMs, result } = benchmarkSync(
          `JSON.stringify (n=${n})`,
          n,
          () => JSON.stringify(items),
        );

        const sizeKB = Math.round((result.length / 1024) * 10) / 10;
        console.log(
          `  [n=${n}] Serialize: ${durationMs}ms | Size: ${sizeKB} KB`,
        );

        // Serialization should be fast
        expect(durationMs).toBeLessThan(1_000);
      });

      it(`deserializes ${n.toLocaleString()} evidence items`, () => {
        const items = generateEvidenceItems(n);
        const json = JSON.stringify(items);

        const { durationMs } = benchmarkSync(`JSON.parse (n=${n})`, n, () =>
          JSON.parse(json),
        );

        console.log(`  [n=${n}] Deserialize: ${durationMs}ms`);
        expect(durationMs).toBeLessThan(1_000);
      });
    }
  });

  describe("Workspace export payload estimation", () => {
    it("estimates full workspace export sizes", () => {
      const scenarios = [
        { protocols: 5, evidencePerProtocol: 50, label: "Small team" },
        { protocols: 20, evidencePerProtocol: 200, label: "Medium team" },
        { protocols: 50, evidencePerProtocol: 500, label: "Large org" },
        { protocols: 100, evidencePerProtocol: 1000, label: "Enterprise" },
      ];

      for (const scenario of scenarios) {
        const totalEvidence = scenario.protocols * scenario.evidencePerProtocol;
        const evidence = generateEvidenceItems(Math.min(totalEvidence, 10_000));
        const protocols = Array.from(
          { length: scenario.protocols },
          (_, i) => ({
            id: randomUUID(),
            title: `Protocol ${i}`,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        );

        const evidenceSizeKB = payloadSizeKB(evidence);
        const protocolSizeKB = payloadSizeKB(protocols);
        const totalEstimatedMB =
          Math.round(((evidenceSizeKB + protocolSizeKB) / 1024) * 10) / 10;

        console.log(
          `  ${scenario.label}: ${scenario.protocols} protocols × ` +
            `${scenario.evidencePerProtocol} evidence = ~${totalEstimatedMB} MB JSON`,
        );
      }
    });
  });
});
