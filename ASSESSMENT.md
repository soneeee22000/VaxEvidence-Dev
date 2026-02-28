# VaxEvidence — Honest Technical Assessment

_Last updated: 2026-02-28_

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

**Codebase:** ~23K lines of component code, 102 app route/page files, 23 Supabase migrations (1,575 lines SQL), 30+ database tables.

**Test coverage:** 1,462 unit tests + 51 benchmarks (vitest), 60 integration tests (vitest, real Supabase), 63 E2E tests (Playwright). CI passing.

**Zero real users.** No one outside of development has used this product.

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

This isn't generic SaaS. The data models reflect someone who understands regulatory submissions.

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

### Code Quality

- Clean project structure with clear separation of concerns
- Typed end-to-end (Zod schemas at boundaries, TypeScript strict mode)
- Consistent CRUD module pattern across all Supabase tables
- SSR-aware Supabase client architecture (browser vs server)
- Proper auth guard via Next.js 16 proxy convention
- Consistent design system (OKLCH tokens, no hardcoded Tailwind colors, no gradient slop)
- `ignoreBuildErrors: false` — build enforces type safety

---

## What's Honestly Wrong

### The Biggest Problem: No Users

Every "Done" checkmark in this repo is developer-validated, not user-validated. Nobody has:

- Created a real protocol for an actual study
- Imported real evidence from PubMed and screened it
- Exported a regulatory package and compared it to what they actually need
- Used collaboration features with a real teammate
- Hit a real workflow pain point that would drive product decisions

Until someone outside development uses this, it's a demo — no matter how many features it has.

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

API Keys, Webhooks, and Audit Logs are production-functional. SSO requires an Enterprise Supabase subscription. Integrations have never touched a real Zotero/Mendeley/REDCap account. Compliance is a configuration checklist, not a certification.

### Regulatory Exports Are Templates, Not Compliance

The IND, eCTD, and SDTM generators produce well-structured documents with correct section hierarchies. But:

- **IND packages** auto-populate from protocol metadata. Real IND submissions require actual CMC data, toxicology reports, clinical investigator CVs, and IRB approval documents that don't exist in VaxEvidence.
- **eCTD Module 5** generates section placeholders. Real eCTD submissions require validated PDF/A documents, XML backbone files, and conformance to regional gateway specifications.
- **SDTM templates** provide correct domain structures but contain placeholder data. Real SDTM datasets require mapping from actual clinical data sources through a validated transformation process.

These exports are useful as starting points and organizational tools. No regulatory affairs team would submit them to the FDA as-is.

### Security Is Partially Hardened

A security audit addressed the most critical application-level issues:

- Overly permissive `(true)` RLS policies replaced with ownership-scoped policies across 9 tables
- Ownership checks added to all export and AI routes; auth guards on search/import proxies
- IP-based sliding-window rate limiting on AI (10/min), export (5/min), and SSO (5/min) routes
- Zod validators added to export route bodies; vulnerable deps patched (xlsx removed, jspdf/next upgraded)
- Security headers applied to all API routes

**Still outstanding:**

- No penetration testing performed
- No SOC 2 Type II certification
- No HIPAA compliance assessment
- CORS configuration not verified for production
- No secrets rotation strategy

### Collaboration Has Scaling Limits

- Yjs CRDT with Supabase Broadcast works for 2-5 concurrent editors
- No dedicated WebSocket infrastructure (Broadcast has message size limits and no persistence)
- No conflict resolution UI for concurrent edits beyond last-writer-wins
- No offline support or edit queuing

### AI Features Are Uncalibrated

- PICO generator, synthesis, gap analysis, and paper recommendations all work mechanically
- No evaluation of output quality against domain expert expectations
- No feedback loop to improve prompts based on researcher reactions
- Quality depends entirely on the underlying LLM — no fine-tuning, no guardrails for hallucinated citations

---

## What the Test Numbers Actually Mean

### Unit Tests (1,462)

The majority test:

- Component rendering (does it mount without crashing?)
- Mock data flow (given mock X, does function return Y?)
- Utility functions (date formatting, string manipulation)
- Validator schemas (does Zod accept/reject correctly?)

What's NOT tested:

- Auth flow edge cases (expired tokens, concurrent sessions)
- Export output correctness (do generated PDFs match regulatory specs?)
- Cross-feature integration (create protocol -> add evidence -> screen -> export)
- AI output quality or consistency

### Integration Tests (60)

Connect to a real Supabase instance and verify:

- RLS policy enforcement across all tables (31 tests: cross-user isolation, ownership scoping)
- CRUD lifecycle correctness (14 tests: protocols, evidence, screening upsert, cascade delete)
- Data integrity constraints (15 tests: unique constraints, FK cascades, check constraints, NOT NULL)

Require `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, and `SUPABASE_TEST_SERVICE_KEY` env vars. Skip gracefully when not configured.

### E2E Tests (63)

Verify UI interactions work:

- Pages load, tabs switch, dialogs open, buttons are clickable
- Form submissions reach the server and data persists

What's NOT tested:

- Multi-user collaboration scenarios
- Export file content validation
- Regulatory logic correctness
- Performance under load
- Error recovery and edge cases

### CI Pipeline

Four jobs pass: typecheck, lint, unit tests, build. Integration tests exist but are not in CI (require real Supabase credentials). No E2E in CI (no browser environment). No security scanning, no dependency audit automation.

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
- Code quality is high (typed, tested, consistent design system)

**What separates this from MVP:**

- No real users providing feedback (this is the #1 blocker)
- Security posture is "reasonable for dev" not "ready for health data"
- AI features are unvalidated against domain expert expectations
- Integrations (Zotero, Mendeley, REDCap) are untested against real external APIs
- No billing or monetization

**What separates MVP from product:**

- Enterprise security certifications (SOC 2, HIPAA BAA)
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
- Code craft (consistent design system, 1,500+ tests, TypeScript strict)
- Shipping velocity (built with AI assistance in compressed timeline)

Any health-tech or reg-tech company would see this and recognize serious capability.

### As a Startup Foundation

Viable, with ruthless focus. The path:

1. ~~Pick ONE wedge (systematic review pipeline is the strongest)~~ — Done
2. ~~Remove `ignoreBuildErrors`, fix all type errors, add pagination~~ — Done
3. **Get 5 real users from an academic research group or CRO** — NOT done. Landing page and demo mode are ready for outreach, but no users have been acquired yet.
4. Iterate on real feedback for 3 months
5. Then decide if there's product-market fit before building more

### As a Product Ready for Enterprise Sales

Not close. The gap between "all features exist as UI" and "one feature works reliably enough that a pharma company will pay $50K/year for it" is 6-12 months of focused hardening, security work, and user research.

---

## What's Been Done (Technical Hardening)

1. **TypeScript safety enforced.** `ignoreBuildErrors: false`. All type errors resolved. Build rejects bad types.
2. **Server-side pagination.** Evidence library, datasets, protocols, and activity log. Remaining unbounded: screening decisions, linked evidence, `getUniqueTags()`.
3. **React Query caching.** 30s stale time, 5min GC, `keepPreviousData` for smooth pagination.
4. **Dev auth fallback gated.** `useUserId()` hardcoded UUID only fires in `NODE_ENV === "development"`.
5. **Screening pipeline hardened.** Duplicate detection, stage transitions, PRISMA counts all tested.
6. **Production deployment.** Vercel + Sentry (error tracking, source maps).
7. **Security audit.** RLS hardened across 9 tables, ownership checks on all export/AI routes, rate limiting, vulnerable deps patched.
8. **Integration tests.** 60 tests against real Supabase (RLS, CRUD, data integrity).
9. **Performance benchmarks.** 51 benchmarks measuring duplicate detection, CSV generation, payload sizes, screening counts. Report at `docs/PERFORMANCE-BENCHMARKS.md`.
10. **Design system consistency.** Hardcoded Tailwind colors replaced with OKLCH tokens across 20+ files. No gradient slop, no AI-generated color choices.
11. **Onboarding flow redesigned.** First external user bounced after creating one protocol with zero evidence. Reduced overlay from 4 passive steps to 2, added a persistent Getting Started checklist on the dashboard tracking real milestones (protocol, evidence, screening, RoB), and added contextual next-step banners on the protocol page. Analytics events track checklist engagement.

---

## What Needs to Happen Next

1. **Get real users.** Everything else is premature optimization without user feedback. The landing page, demo mode, and waitlist are ready. First external signup (Feb 24) bounced — onboarding was redesigned in response (Feb 28). The missing piece is still outreach volume: reaching more researchers and watching them use it.
2. **Validate AI output quality.** Have a domain expert evaluate PICO generation, synthesis, and gap analysis outputs. Adjust prompts based on what's wrong.
3. **Test integrations against real APIs.** Zotero, Mendeley, and REDCap connectors have never touched real accounts. They might work or they might break on first contact.
4. **Wire integration tests into CI.** They exist but only run locally. Set up a test Supabase project with credentials in GitHub Actions secrets.
5. **Add E2E to CI.** Playwright tests exist but need a CI browser environment.
6. **Billing.** Phase 9 (Stripe) is the only unbuilt phase. Can't charge money without it.

---

## Summary

VaxEvidence demonstrates genuine domain expertise and high code quality. The breadth of features built is remarkable for the timeline, and the recent design system cleanup shows attention to craft beyond just "make it work." The architecture is sound, the test coverage is real, and the regulatory data models reflect actual knowledge of the domain.

But breadth without users is a demo, not a product. The most important thing this project needs isn't another feature, another test suite, or another design polish pass. It needs someone to use it and tell you what's wrong.
