/**
 * Performance benchmark helpers: data generators, timing utilities, and memory tracking.
 */

import { randomUUID } from "crypto";

// =============================================================================
// TIMING UTILITIES
// =============================================================================

export interface BenchmarkResult {
  name: string;
  scale: number;
  durationMs: number;
  memoryDeltaMB: number;
  opsPerSecond: number;
  payloadSizeKB?: number;
}

/**
 * Measure execution time and memory delta for an async function.
 */
export async function benchmark<T>(
  name: string,
  scale: number,
  fn: () => Promise<T>,
): Promise<BenchmarkResult & { result: T }> {
  // Force GC if available (run with --expose-gc)
  if (global.gc) global.gc();

  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  const result = await fn();

  const durationMs = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed;
  const memoryDeltaMB = (memAfter - memBefore) / (1024 * 1024);
  const opsPerSecond = scale / (durationMs / 1000);

  return {
    name,
    scale,
    durationMs: Math.round(durationMs * 100) / 100,
    memoryDeltaMB: Math.round(memoryDeltaMB * 100) / 100,
    opsPerSecond: Math.round(opsPerSecond),
    result,
  };
}

/**
 * Measure execution time and memory delta for a synchronous function.
 */
export function benchmarkSync<T>(
  name: string,
  scale: number,
  fn: () => T,
): BenchmarkResult & { result: T } {
  if (global.gc) global.gc();

  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  const result = fn();

  const durationMs = performance.now() - start;
  const memAfter = process.memoryUsage().heapUsed;
  const memoryDeltaMB = (memAfter - memBefore) / (1024 * 1024);
  const opsPerSecond = scale / (durationMs / 1000);

  return {
    name,
    scale,
    durationMs: Math.round(durationMs * 100) / 100,
    memoryDeltaMB: Math.round(memoryDeltaMB * 100) / 100,
    opsPerSecond: Math.round(opsPerSecond),
    result,
  };
}

/**
 * Print a table of benchmark results.
 */
export function printResults(results: BenchmarkResult[]): void {
  console.log("\n" + "=".repeat(100));
  console.log(
    "| %-40s | %8s | %10s | %10s | %12s |",
    "Benchmark",
    "Scale",
    "Time (ms)",
    "Mem (MB)",
    "Payload (KB)",
  );
  console.log("|" + "-".repeat(42) + "|" + ("-".repeat(10) + "|").repeat(4));
  for (const r of results) {
    console.log(
      `| %-40s | %8d | %10.2f | %10.2f | %12s |`,
      r.name.slice(0, 40),
      r.scale,
      r.durationMs,
      r.memoryDeltaMB,
      r.payloadSizeKB?.toFixed(1) ?? "-",
    );
  }
  console.log("=".repeat(100) + "\n");
}

// =============================================================================
// DATA GENERATORS
// =============================================================================

const SAMPLE_TITLES = [
  "Efficacy of mRNA COVID-19 Vaccines in Immunocompromised Patients",
  "Safety and Immunogenicity of BNT162b2 Booster in Older Adults",
  "Real-World Effectiveness of Influenza Vaccination in Pregnant Women",
  "Comparative Effectiveness of HPV Vaccines: A Systematic Review",
  "Long-term Safety of Adjuvanted Recombinant Zoster Vaccine",
  "Immunological Response to Measles-Mumps-Rubella Revaccination",
  "Adverse Events Following Rotavirus Vaccination in Infants",
  "Cost-Effectiveness Analysis of Pneumococcal Conjugate Vaccine",
  "Serological Response to Hepatitis B Booster in Healthcare Workers",
  "Population-Level Impact of Meningococcal B Vaccination Programs",
];

const SAMPLE_AUTHORS = [
  "Smith J, Wang L, Johnson M",
  "Brown A, Davis K, Miller R",
  "Wilson T, Anderson S, Thomas P",
  "Taylor N, Jackson E, White C",
  "Harris B, Martin D, Garcia F",
];

const SAMPLE_JOURNALS = [
  "The Lancet",
  "New England Journal of Medicine",
  "BMJ",
  "JAMA",
  "Nature Medicine",
  "Vaccine",
  "Clinical Infectious Diseases",
];

const SAMPLE_TAGS = [
  "covid-19",
  "mRNA",
  "safety",
  "efficacy",
  "immunogenicity",
  "booster",
  "pediatric",
  "elderly",
  "RCT",
  "observational",
  "meta-analysis",
  "systematic-review",
];

const EVIDENCE_TYPES = ["academic", "regulatory", "dataset", "note"] as const;

const EVIDENCE_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "archived",
] as const;

/**
 * Generate N synthetic evidence items for benchmarking.
 */
export function generateEvidenceItems(count: number): any[] {
  const items = [];
  for (let i = 0; i < count; i++) {
    const titleBase = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
    // Add variation so titles are similar but not identical (for fuzzy matching tests)
    const titleVariant =
      i < SAMPLE_TITLES.length
        ? titleBase
        : `${titleBase} — Study ${Math.floor(i / SAMPLE_TITLES.length)}`;

    items.push({
      id: randomUUID(),
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      type: EVIDENCE_TYPES[i % EVIDENCE_TYPES.length],
      title: titleVariant,
      description:
        `This is a detailed description for evidence item ${i}. `.repeat(3),
      authors: SAMPLE_AUTHORS[i % SAMPLE_AUTHORS.length],
      journal: SAMPLE_JOURNALS[i % SAMPLE_JOURNALS.length],
      doi: i % 3 === 0 ? `10.1000/test.${i}` : null,
      external_id: i % 4 === 0 ? `PMID${10000 + i}` : null,
      external_source: i % 4 === 0 ? "pubmed" : null,
      source_url: `https://example.com/paper/${i}`,
      publication_date: new Date(
        2020 + (i % 5),
        i % 12,
        (i % 28) + 1,
      ).toISOString(),
      tags: SAMPLE_TAGS.slice(0, 2 + (i % 4)),
      status: EVIDENCE_STATUSES[i % EVIDENCE_STATUSES.length],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return items;
}

/**
 * Generate N synthetic screening decisions with embedded evidence for benchmarking.
 */
export function generateScreeningDecisions(
  count: number,
  protocolId: string = randomUUID(),
): any[] {
  const decisions = [];
  const stages = [
    "identification",
    "screening",
    "eligibility",
    "included",
  ] as const;
  const decisionValues = [
    "pending",
    "include",
    "exclude",
    "duplicate",
  ] as const;

  for (let i = 0; i < count; i++) {
    const evidenceId = randomUUID();
    const titleBase = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
    const titleVariant =
      i < SAMPLE_TITLES.length
        ? titleBase
        : `${titleBase} — Study ${Math.floor(i / SAMPLE_TITLES.length)}`;

    decisions.push({
      id: randomUUID(),
      protocol_id: protocolId,
      evidence_id: evidenceId,
      stage: stages[i % stages.length],
      decision: decisionValues[i % decisionValues.length],
      exclusion_reason: i % 5 === 0 ? "Not relevant to PICO" : null,
      decided_by: "550e8400-e29b-41d4-a716-446655440000",
      decided_at: new Date().toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      evidence_items: {
        id: evidenceId,
        title: titleVariant,
        type: EVIDENCE_TYPES[i % EVIDENCE_TYPES.length],
        authors: SAMPLE_AUTHORS[i % SAMPLE_AUTHORS.length],
        doi: i % 3 === 0 ? `10.1000/test.${i}` : null,
        external_id: i % 4 === 0 ? `PMID${10000 + i}` : null,
        external_source: i % 4 === 0 ? "pubmed" : null,
        description: `Description for screening item ${i}.`,
        tags: SAMPLE_TAGS.slice(0, 2 + (i % 4)),
      },
    });
  }
  return decisions;
}

/**
 * Generate screening decisions with intentional duplicates for duplicate detection testing.
 * Creates ~10% duplicate DOIs, ~10% duplicate PMIDs, and ~15% near-duplicate titles.
 */
export function generateScreeningWithDuplicates(
  count: number,
  protocolId: string = randomUUID(),
): any[] {
  const decisions = [];
  const dupDOICount = Math.floor(count * 0.1);
  const dupPMIDCount = Math.floor(count * 0.1);
  const dupTitleCount = Math.floor(count * 0.15);
  const uniqueCount = count - dupDOICount - dupPMIDCount - dupTitleCount;

  // Unique items
  for (let i = 0; i < uniqueCount; i++) {
    decisions.push(
      makeDecision(i, protocolId, {
        doi: `10.1000/unique.${i}`,
        external_id: `PMID_U${i}`,
        title: `Unique Study Title ${i}: ${SAMPLE_TITLES[i % SAMPLE_TITLES.length]}`,
      }),
    );
  }

  // Duplicate DOIs
  for (let i = 0; i < dupDOICount; i++) {
    const dupIndex = i % Math.min(50, uniqueCount);
    decisions.push(
      makeDecision(uniqueCount + i, protocolId, {
        doi: `10.1000/unique.${dupIndex}`,
        external_id: `PMID_DDOI${i}`,
        title: `Different Title for DOI Dup ${i}`,
      }),
    );
  }

  // Duplicate PMIDs
  for (let i = 0; i < dupPMIDCount; i++) {
    const dupIndex = i % Math.min(50, uniqueCount);
    decisions.push(
      makeDecision(uniqueCount + dupDOICount + i, protocolId, {
        doi: `10.1000/diffpmid.${i}`,
        external_id: `PMID_U${dupIndex}`,
        title: `Different Title for PMID Dup ${i}`,
      }),
    );
  }

  // Near-duplicate titles (for fuzzy matching)
  for (let i = 0; i < dupTitleCount; i++) {
    const baseTitle = `Unique Study Title ${i % Math.min(50, uniqueCount)}`;
    // Add minor variations that should still match at 0.85 Dice threshold
    const variants = [
      `${baseTitle} - Additional Data`,
      `${baseTitle}: Updated Results`,
      `${baseTitle} (Revised)`,
    ];
    decisions.push(
      makeDecision(uniqueCount + dupDOICount + dupPMIDCount + i, protocolId, {
        doi: `10.1000/fuzzytitle.${i}`,
        external_id: `PMID_FT${i}`,
        title: variants[i % variants.length],
      }),
    );
  }

  return decisions;
}

function makeDecision(
  index: number,
  protocolId: string,
  overrides: { doi: string; external_id: string; title: string },
): any {
  const evidenceId = randomUUID();
  return {
    id: randomUUID(),
    protocol_id: protocolId,
    evidence_id: evidenceId,
    stage: "identification",
    decision: "pending",
    exclusion_reason: null,
    decided_by: null,
    decided_at: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    evidence_items: {
      id: evidenceId,
      title: overrides.title,
      type: EVIDENCE_TYPES[index % EVIDENCE_TYPES.length],
      authors: SAMPLE_AUTHORS[index % SAMPLE_AUTHORS.length],
      doi: overrides.doi,
      external_id: overrides.external_id,
      external_source: "pubmed",
      description: `Description for item ${index}.`,
      tags: SAMPLE_TAGS.slice(0, 2),
    },
  };
}

/**
 * Generate activity log entries for benchmarking.
 */
export function generateActivityLogs(count: number): any[] {
  const actionTypes = [
    "create",
    "update",
    "delete",
    "export",
    "import",
    "review",
  ];
  const resourceTypes = [
    "protocol",
    "evidence",
    "dataset",
    "screening",
    "comment",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    action_type: actionTypes[i % actionTypes.length],
    resource_type: resourceTypes[i % resourceTypes.length],
    resource_id: randomUUID(),
    description: `User performed ${actionTypes[i % actionTypes.length]} on ${resourceTypes[i % resourceTypes.length]} item`,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
    user: { email: `user${i % 5}@example.com` },
  }));
}

/**
 * Calculate JSON payload size in KB.
 */
export function payloadSizeKB(data: unknown): number {
  return Math.round((JSON.stringify(data).length / 1024) * 10) / 10;
}
