# VaxEvidence — Performance Benchmark Report

_Generated: 2026-02-23_

---

## Methodology

Benchmarks measure **client-side processing** and **payload sizes** for all performance-critical data paths. Tests run via vitest on Node.js with synthetic data generators that produce realistic evidence items, screening decisions, and activity logs at scales of 100 to 10,000 items.

Database query latency is not measured directly (requires live Supabase instance) — instead we measure payload sizes to quantify the network transfer cost of unbounded queries, and profile client-side algorithms for CPU bottlenecks.

Run benchmarks: `pnpm vitest run __tests__/benchmarks/`

---

## Results Summary

### 1. Duplicate Detection (Critical Path — O(n²) Fuzzy Matching)

The `detectDuplicates()` algorithm in `lib/screening/duplicate-detection.ts` has three passes:

- **Pass 1**: DOI exact match — O(n) via Map
- **Pass 2**: External ID exact match — O(n) via Map
- **Pass 3**: Fuzzy title similarity (Dice coefficient ≥ 0.85) — **O(n²)**

| Scale | Mixed (with dups) | Worst Case (all unique) | Comparisons |
| ----: | ----------------: | ----------------------: | ----------: |
|   100 |              15ms |                     1ms |       4,950 |
|   500 |              55ms |                     5ms |     124,750 |
| 1,000 |              93ms |                    11ms |     499,500 |
| 2,000 |             194ms |                    20ms |   1,999,000 |
| 5,000 |             473ms |                       — |           — |

**Best case** (all DOI matches, fuzzy pass skipped): 5,000 items in **3ms**.

**Verdict**: Performs well up to 5K items (~500ms). The O(n²) fuzzy pass scales better than expected because the `assigned` Set short-circuits already-grouped items. At 10K+ items in a browser (with GC pressure), expect 2-5s blocking the main thread. Consider a Web Worker for >2K items.

---

### 2. CSV Generation

All CSV generators use `.map()` → `.join("\n")` — full in-memory construction.

|  Scale | Evidence CSV | Activity CSV | Output Size |
| -----: | -----------: | -----------: | ----------: |
|    100 |          2ms |        0.5ms |       46 KB |
|  1,000 |          5ms |          4ms |      464 KB |
|  5,000 |         26ms |         21ms |      2.3 MB |
| 10,000 |         66ms |         43ms |      4.7 MB |

**Verdict**: CSV generation is fast and not a bottleneck. Even 10K items complete in <100ms. Memory amplification is ~0.65x (CSV is smaller than JSON input). No need for streaming unless scale exceeds 50K+ items.

---

### 3. Screening Counts Aggregation

`getScreeningCounts()` fetches ALL screening decisions and counts them in JS.

|  Scale | JS Loop (current) | SQL GROUP BY (optimal) |             Payload: Current → Optimal |
| -----: | ----------------: | ---------------------: | -------------------------------------: |
|    100 |             0.1ms |                  0.4ms |                                      — |
|  1,000 |             0.2ms |                  0.4ms |    44 KB → 0.1 KB (**439x reduction**) |
|  5,000 |             0.7ms |                  2.3ms | 220 KB → 0.1 KB (**2,197x reduction**) |
| 10,000 |               7ms |                  2.9ms | 440 KB → 0.1 KB (**4,395x reduction**) |

**Verdict**: The JS aggregation itself is fast (7ms for 10K rows). The real problem is **payload size** — transferring 440KB of raw rows when a SQL `GROUP BY` would return 0.1KB. At 10K decisions, this wastes 99.98% of bandwidth. The aggregation should be pushed to the database.

---

### 4. Data Payload Sizes (Network Transfer)

#### Evidence Items

|  Scale | Full Payload | Paginated (20) | Tags-only (getUniqueTags) |
| -----: | -----------: | -------------: | ------------------------: |
|    100 |        71 KB |          14 KB |                      4 KB |
|  1,000 |       719 KB |          14 KB |                     44 KB |
|  5,000 |       3.5 MB |          14 KB |                    222 KB |
| 10,000 |       7.1 MB |          14 KB |                    444 KB |

**Pagination works well** — page payload stays constant at 14KB regardless of total items. The `getUniqueTags()` full-table scan is the remaining issue: 444KB at 10K items.

#### Screening Decisions (with Evidence JOIN)

| Scale | With JOIN | Minimal (no join) | Ratio |
| ----: | --------: | ----------------: | ----: |
|   100 |     75 KB |             14 KB |  5.4x |
| 1,000 |    750 KB |            139 KB |  5.4x |
| 5,000 |    3.8 MB |            693 KB |  5.4x |

**Verdict**: The evidence JOIN inflates payload by **5.4x**. For screening counts (which only need stage+decision), the JOIN is entirely wasted.

#### Linked Evidence (Unbounded JOIN)

| Linked Studies | Payload |
| -------------: | ------: |
|             50 |   46 KB |
|            200 |  183 KB |
|            500 |  458 KB |
|          1,000 |  915 KB |
|          2,000 |  1.8 MB |

**Verdict**: Linear growth (~0.9KB per linked study). A protocol with 2,000 linked studies transfers 1.8MB on every load. Needs pagination.

#### Workspace Export (Full Data Estimation)

| Scenario    | Protocols × Evidence | Estimated JSON |
| :---------- | -------------------: | -------------: |
| Small team  |               5 × 50 |        ~0.2 MB |
| Medium team |             20 × 200 |        ~2.8 MB |
| Large org   |             50 × 500 |        ~7.1 MB |
| Enterprise  |          100 × 1,000 |       ~7.1 MB+ |

---

### 5. JSON Serialization

|  Scale | Serialize | Deserialize | Payload |
| -----: | --------: | ----------: | ------: |
|  1,000 |       5ms |         2ms |  719 KB |
|  5,000 |      16ms |         8ms |  3.5 MB |
| 10,000 |      36ms |        18ms |  7.1 MB |

**Verdict**: Serialization is not a bottleneck. V8's JSON implementation handles 10K objects in <40ms.

---

## Identified Bottlenecks (Ranked by Impact)

### P0 — Critical (blocks scale to 1,000+ items)

1. **Screening decisions: unbounded fetch**
   - `fetchScreeningDecisions()` has no pagination
   - Every screening action invalidates cache → re-fetches all decisions
   - At 2K studies: 1.5MB per fetch, multiple times per session
   - **Fix**: Add server-side pagination; load decisions per-stage

2. **getScreeningCounts(): client-side aggregation of unbounded data**
   - Transfers 440KB to count 16 numbers at 10K decisions
   - **Fix**: Create a Supabase RPC function with `GROUP BY stage, decision`

3. **getUniqueTags(): full-table scan**
   - Fetches tags column for every evidence item (444KB at 10K)
   - **Fix**: Create a `DISTINCT unnest(tags)` RPC function, or maintain a `tags` lookup table

### P1 — Important (degrades UX at 2,000+ items)

4. **Linked evidence: unbounded JOIN**
   - `getLinkedEvidence()` fetches all linked studies with full evidence data
   - Called on screening page init AND multiple export routes
   - **Fix**: Add pagination; for exports, use cursor-based streaming

5. **Workspace ZIP export: sequential waterfall**
   - 4 sequential queries per protocol in a `for` loop
   - 20 protocols = 80 sequential Supabase round-trips
   - **Fix**: Use `Promise.all()` to parallelize per-protocol fetches

6. **Duplicate detection: O(n²) in browser**
   - Blocks main thread at 2K+ items (~200ms)
   - At 5K items: ~500ms blocking
   - **Fix**: Move to Web Worker; or pre-compute title bigrams at insert time

### P2 — Nice to Have

7. **Activity CSV export: silent truncation at 1,000 rows**
   - Users aren't warned about data loss
   - **Fix**: Return `X-Total-Count` header and warn in UI

8. **Batch screening init: single large upsert**
   - `batchInitScreeningDecisions()` sends all rows in one request
   - May hit PostgREST body size limits at 5K+ items
   - **Fix**: Chunk into batches of 500

9. **Export generators: no streaming**
   - CSV/PDF built fully in memory before response
   - Fine up to 10K items; problematic at 50K+
   - **Fix**: Use `ReadableStream` for CSV exports

---

## Recommended Database Indexes

Based on the query patterns found in the codebase:

```sql
-- Evidence pagination (already exists via RLS, but verify these):
CREATE INDEX IF NOT EXISTS idx_evidence_items_updated_at ON evidence_items (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_items_tags ON evidence_items USING GIN (tags);

-- Screening counts optimization
CREATE INDEX IF NOT EXISTS idx_screening_stage_decision ON screening_decisions (protocol_id, stage, decision);

-- Linked evidence pagination
CREATE INDEX IF NOT EXISTS idx_protocol_evidence_links_protocol ON protocol_evidence_links (protocol_id, linked_at DESC);
```

---

## How to Run

```bash
# Run all benchmarks
pnpm vitest run __tests__/benchmarks/

# Run specific benchmark
pnpm vitest run __tests__/benchmarks/duplicate-detection.bench.test.ts

# Run with verbose output
pnpm vitest run __tests__/benchmarks/ --reporter=verbose
```
