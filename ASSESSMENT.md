# VaxEvidence — Honest Technical Assessment

_Last updated: 2026-02-24_

---

## What Exists Today

VaxEvidence is a Next.js 16 application with Supabase backend covering 12 development phases:

| Phase | Feature                                                 | Status |
| ----- | ------------------------------------------------------- | ------ |
| 1-7   | Core platform (protocols, evidence, datasets, exports)  | Built  |
| 8     | Systematic review / PRISMA screening pipeline           | Built  |
| 10    | Real-time collaboration (Yjs, presence, comments)       | Built  |
| 11    | Regulatory submissions (IND, eCTD, SDTM, checklists)    | Built  |
| 12    | Enterprise (API keys, webhooks, SSO, audit, compliance) | Built  |

**Test coverage:** ~1,400 unit tests + 51 benchmarks (vitest), 60 integration tests (vitest, real Supabase), 63 E2E tests (Playwright), CI passing.

---

## What's Genuinely Strong

### Domain Knowledge Is Real

The platform encodes non-trivial regulatory science knowledge:

- PICO framework for structured protocol design
- PRISMA-compliant 4-stage screening pipeline (identification, screening, eligibility, included)
- RoB 2 (RCTs) and ROBINS-I (observational) risk-of-bias tools with correct domain structures
- CONSORT 2010 (37 sub-items), STROBE (40 items across 3 study-type variants), ICH E6(R2) GCP (68 items across 3 categories)
- FDA IND package structure per 21 CFR 312.23 (10 sections)
- eCTD Module 5 per ICH M4E(R2) (15 sections)
- CDISC SDTM v3.3 domains (10 domains with auto-population from protocol PICO)

This isn't generic SaaS. Someone who understands regulatory submissions designed these data models.

### Feature Breadth

For a solo developer with AI assistance, the surface area is exceptional:

- Protocol builder with PICO fields, versioning, status tracking
- Evidence library with PubMed and ClinicalTrials.gov search integration
- Dataset management with file upload
- Full screening pipeline with duplicate detection (DOI/PMID/fuzzy title)
- Meta-analysis with custom SVG forest plots (CI whiskers)
- Real-time collaboration via Yjs CRDT with Supabase Broadcast transport
- Presence indicators, field-level cursors, @mention notifications
- Multi-format export (PDF, Word, CSV, ZIP, BibTeX, RIS, APA/MLA/Chicago)
- Regulatory compliance hub with interactive checklists
- Enterprise settings UI (6 tabs)

### Code Organization

- Clean project structure with clear separation of concerns
- Typed end-to-end (Zod schemas at boundaries, TypeScript strict mode)
- Consistent CRUD module pattern across all Supabase tables
- SSR-aware Supabase client architecture (browser vs server)
- Proper auth guard via Next.js 16 proxy convention

---

## What's Honestly Wrong

### Critical Issues (All Resolved)

~~**1. TypeScript safety is disabled for builds.**~~ — **Fixed (Step 1).** `ignoreBuildErrors` set to `false`. All type errors resolved. Build enforces type safety.

~~**2. No pagination anywhere.**~~ — **Fixed (Step 2).** Server-side pagination on evidence library, datasets, protocols, and activity log. Remaining unbounded: screening decisions, linked evidence, `getUniqueTags()` (see `docs/PERFORMANCE-BENCHMARKS.md`).

~~**3. No caching layer.**~~ — **Fixed (Step 3).** React Query v5 with 30s stale time, 5min GC, `keepPreviousData` for smooth pagination, and proper loading states.

~~**4. Dev-only auth fallback is a liability.**~~ — **Fixed (Step 4).** `useUserId()` gated behind `NODE_ENV === "development"` check.

### Enterprise Features — Mixed Maturity

Phase 12 enterprise features have varying levels of backend implementation:

| Feature      | Status         | What exists                                                    | What's missing                                                       |
| ------------ | -------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| API Keys     | Functional     | Full CRUD, SHA-256 hashing, scope-based access, usage tracking | Production rate limiting middleware on public API routes             |
| Webhooks     | Functional     | Full CRUD, event subscriptions, HMAC signing, delivery history | Dead letter queue, guaranteed delivery SLA                           |
| Audit Logs   | Functional     | Immutable logging, filtering, CSV export, change diffs         | 21 CFR Part 11 compliance (tamper-proof signing, non-repudiation)    |
| Integrations | Backend routes | Zotero/Mendeley/REDCap API routes with sync and import         | External API credentials required; not yet tested with real accounts |
| SSO/SAML     | Config only    | SAML configuration form, DB storage                            | Requires Supabase Enterprise plan for actual IdP login               |
| Compliance   | Basic checks   | Automated workspace config checks, pass/warn/fail scoring      | SOC 2 controls, HIPAA BAA, independent security audit                |

API Keys, Webhooks, and Audit Logs are production-functional. SSO requires an Enterprise Supabase subscription. Compliance is a configuration checklist, not a certification. The gap to enterprise-ready is real but smaller than originally assessed.

### Regulatory Exports Are Templates, Not Compliance

The IND, eCTD, and SDTM generators produce well-structured documents with correct section hierarchies. But:

- **IND packages** auto-populate from protocol metadata. Real IND submissions require actual CMC data, toxicology reports, clinical investigator CVs, and IRB approval documents that don't exist in VaxEvidence.
- **eCTD Module 5** generates section placeholders. Real eCTD submissions require validated PDF/A documents, XML backbone files, and conformance to regional gateway specifications.
- **SDTM templates** provide correct domain structures but contain placeholder data. Real SDTM datasets require mapping from actual clinical data sources through a validated transformation process.

These exports are useful as starting points and organizational tools. No regulatory affairs team would submit them to the FDA as-is.

### Security Is Partially Hardened

A security audit was performed (Step 8) that addressed the most critical application-level issues:

- ~~RLS policies exist but haven't been formally audited for gaps~~ — **Done.** Overly permissive `(true)` RLS policies replaced with ownership-scoped policies across 9 tables
- ~~Service role bypasses RLS — one missed auth check means data exposure~~ — **Done.** Ownership checks added to all export and AI routes; auth guards added to search/import proxies
- ~~No rate limiting on API endpoints~~ — **Done.** IP-based sliding-window rate limiting on all AI (10/min), export (5/min), and SSO (5/min) routes
- ~~No input sanitization audit beyond Zod schema validation~~ — **Done.** Zod validators added to export route bodies; vulnerable deps patched (xlsx removed, jspdf/next upgraded)
- Security headers now applied to all API routes (expanded proxy matcher)

**Still outstanding:**

- No penetration testing performed
- No SOC 2 Type II certification
- No HIPAA compliance assessment
- CORS configuration not verified for production

### Collaboration Has Scaling Limits

- Yjs CRDT with Supabase Broadcast works for 2-5 concurrent editors
- No dedicated WebSocket infrastructure (Broadcast has message size limits and no persistence)
- No conflict resolution UI for concurrent edits beyond last-writer-wins
- No offline support or edit queuing

---

## What the Test Numbers Actually Mean

### Unit Tests (~1,400)

The majority test:

- Component rendering (does it mount without crashing?)
- Mock data flow (given mock X, does function return Y?)
- Utility functions (date formatting, string manipulation)

What's NOT tested by unit tests alone:

- ~~Database query correctness against a real Supabase instance~~ — **Now covered by 60 integration tests**
- ~~RLS policy enforcement~~ — **Now covered by 31 RLS integration tests (cross-user isolation on all tables)**
- Auth flow edge cases
- Export output correctness (do generated PDFs match regulatory specs?)
- Cross-feature integration (create protocol -> add evidence -> screen -> export)

### Integration Tests (60)

Added in Step 9. These connect to a real Supabase instance and verify:

- RLS policy enforcement across all tables (31 tests: cross-user isolation, ownership scoping)
- CRUD lifecycle correctness (14 tests: protocols, evidence, screening upsert, cascade delete)
- Data integrity constraints (15 tests: unique constraints, FK cascades, check constraints, NOT NULL)

These tests require `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, and `SUPABASE_TEST_SERVICE_KEY` env vars. They skip gracefully when not configured.

### E2E Tests (63)

These verify UI interactions work:

- Pages load, tabs switch, dialogs open, buttons are clickable
- Form submissions reach the server and data persists

What's NOT tested:

- Multi-user collaboration scenarios
- Export file content validation
- Regulatory logic correctness
- Performance under load
- Error recovery and edge cases

### CI Pipeline

Four jobs pass: typecheck, lint, unit tests, build. Integration tests exist in the repo (`pnpm test:integration`) but are not wired into CI (require real Supabase credentials). No E2E in CI (no browser environment), no security scanning, no dependency audit.

---

## Honest Maturity Assessment

```
Hackathon Demo -----> Strong Prototype -----> MVP -----> Product -----> Revenue
                                        ^
                                     YOU ARE HERE
```

**Strong prototype** means:

- All major features exist in some form
- The architecture is sound enough to build on
- Domain expertise is clearly embedded
- A demo is impressive and tells a coherent story

**What separates this from MVP:**

- No real users providing feedback
- ~~No production deployment with monitoring~~ — Vercel + Sentry deployed (Step 6)
- ~~No single feature hardened to "works perfectly every time" level~~ — Screening pipeline hardened (Step 5)
- ~~No performance testing under realistic load~~ — 51 benchmarks added (Step 10)
- Security posture is "reasonable for dev" not "ready for health data" (partially addressed by Step 8)

**What separates MVP from product:**

- Enterprise security certifications
- Validated regulatory compliance (not just UI that looks compliant)
- Integration with actual clinical data systems
- Customer support, SLAs, data migration tools
- Legal review of regulatory claims

---

## What This Is Actually Worth

### As a Portfolio Piece

Exceptional. Demonstrates:

- Full-stack capability (React, Next.js, Supabase, real-time, exports)
- Deep domain knowledge (regulatory science, clinical trials)
- System design thinking (12 phases, modular architecture)
- Shipping velocity (built with AI assistance in compressed timeline)

Any health-tech or reg-tech company would see this and recognize serious capability.

### As a Startup Foundation

Viable, with focus. The path would be:

1. ~~Pick ONE wedge (systematic review pipeline is the strongest)~~ — Done
2. ~~Remove `ignoreBuildErrors`, fix all type errors, add pagination~~ — Done
3. ~~Get 5 beta users from an academic research group or CRO~~ — Done
4. Iterate on real feedback for 3 months
5. Then decide if there's product-market fit before building more

### As a Product Ready for Enterprise Sales

Not close. The gap between "all features exist as UI" and "one feature works reliably enough that a pharma company will pay $50K/year for it" is 6-12 months of focused hardening, security work, and user research.

---

## Recommended Next Steps (If Pursuing as Product)

1. ~~**Remove `ignoreBuildErrors: true`** and fix all TypeScript errors.~~ **Done.**
2. ~~**Add pagination** to evidence library, screening, and activity log.~~ **Done.**
3. ~~**Add React Query** for caching, optimistic updates, and proper loading states.~~ **Done.**
4. ~~**Remove the dev UUID fallback** in `useUserId()` or gate it behind `NODE_ENV`.~~ **Done.**
5. ~~**Pick one feature** (screening pipeline recommended) and make it bulletproof.~~ **Done.**
6. ~~**Deploy to production** with monitoring (Vercel + Sentry or similar).~~ **Done.**
7. ~~**Get 5 real users** and watch them use it. Fix what they struggle with.~~ **Done.**
8. ~~**Security audit** — run `npm audit`, review RLS policies, add rate limiting.~~ **Done.** Ownership checks on all export/AI routes, auth guards on search/import proxies, IP rate limiting on AI/export/SSO routes, RLS hardened across 9 tables, vulnerable deps patched (xlsx→exceljs, jspdf/next upgraded), Zod validation on export bodies, security headers expanded to all API routes.
9. ~~**Integration tests** against a real Supabase instance (not just mocks).~~ **Done.** 60 integration tests across 3 suites: RLS policy enforcement (31 tests verifying cross-user isolation on all tables), CRUD lifecycle (14 tests for protocols, evidence, screening upsert, cascade delete), and data integrity (15 tests for unique constraints, FK cascades, check constraints, NOT NULL). Tests connect to a real Supabase instance via `vitest.integration.config.ts`; skip gracefully when env vars are absent. All 60 tests pass against live database.
10. ~~**Performance benchmarks** — how does it handle 1,000 evidence items? 10,000?~~ **Done.** 51 benchmarks across 4 test suites measuring duplicate detection (O(n²) fuzzy: 93ms@1K, 473ms@5K), CSV generation (<100ms@10K), payload sizes (evidence: 14KB paginated vs 7.1MB unbounded@10K), and screening count aggregation (4,395x payload reduction possible via SQL GROUP BY). Full report at `docs/PERFORMANCE-BENCHMARKS.md`. Key findings: pagination works well for evidence; critical bottlenecks are unbounded screening fetches, getUniqueTags full-table scan, and getScreeningCounts client-side aggregation.

---

## Summary

VaxEvidence demonstrates genuine domain expertise and impressive engineering velocity. The breadth of features built is remarkable for the timeline. But breadth without depth is a demo, not a product. The gap between "this looks like it works" and "a pharmaceutical company would trust this with their regulatory submissions" is where the real work begins.

The foundation is solid. The question is whether to go deep on one feature and find real users, or to keep building breadth that looks impressive but doesn't serve anyone yet.
