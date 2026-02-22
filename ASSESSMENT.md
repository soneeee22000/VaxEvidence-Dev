# VaxEvidence — Honest Technical Assessment

_Last updated: 2026-02-22_

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

**Test coverage:** ~1,400 unit tests (vitest), 49 E2E tests (Playwright), CI passing.

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

### Critical Issues

**1. TypeScript safety is disabled for builds.**

```js
// next.config.mjs
ignoreBuildErrors: true;
```

This means type errors don't block production builds. The primary safety net of using TypeScript — catching errors at compile time — is turned off. Any pharma or enterprise buyer doing technical due diligence would flag this immediately. There are also 9 pre-existing lint errors that are simply ignored.

**2. No pagination anywhere.**

The evidence library, screening pipeline, and activity log all load every record. This works with 50 items. At 500 it's slow. At 5,000 the app is unusable. Any real research team would hit this wall within months.

**3. No caching layer.**

No React Query, no SWR, no cache invalidation strategy. Every page navigation re-fetches everything from Supabase. Combined with no pagination, this means:

- Redundant network requests on every interaction
- No optimistic updates (UI waits for server round-trip)
- Poor perceived performance at scale

**4. Dev-only auth fallback is a liability.**

```typescript
// useUserId() returns hardcoded UUID when no session exists
return "550e8400-e29b-41d4-a716-446655440000";
```

If this ever runs in production (and there's no build-time guard preventing it), any unauthenticated user gets access as this hardcoded user.

### Enterprise Features Are UI Shells

The Phase 12 "enterprise" features render settings pages and dialogs. They do NOT:

| Feature      | What exists              | What's missing                                                            |
| ------------ | ------------------------ | ------------------------------------------------------------------------- |
| SSO/SAML     | Config form UI           | Actual IdP integration (Okta, Azure AD, etc.)                             |
| API Keys     | Create/list UI, DB table | Key validation middleware, rate limiting, usage tracking                  |
| Webhooks     | Create/list UI, DB table | Delivery queue, retry logic, signature verification, dead letter handling |
| Audit Logs   | DB table, viewer UI      | 21 CFR Part 11 compliance (tamper-proof, signed, non-repudiation)         |
| Compliance   | Dashboard UI             | SOC 2 controls, HIPAA BAA, actual data residency enforcement              |
| Integrations | Provider cards UI        | Actual OAuth flows, data sync, API connectors                             |

A settings page that renders a SAML form is not SSO. A table that stores audit rows is not 21 CFR Part 11 compliance. These features would need 3-6 months of dedicated work each to be production-real.

### Regulatory Exports Are Templates, Not Compliance

The IND, eCTD, and SDTM generators produce well-structured documents with correct section hierarchies. But:

- **IND packages** auto-populate from protocol metadata. Real IND submissions require actual CMC data, toxicology reports, clinical investigator CVs, and IRB approval documents that don't exist in VaxEvidence.
- **eCTD Module 5** generates section placeholders. Real eCTD submissions require validated PDF/A documents, XML backbone files, and conformance to regional gateway specifications.
- **SDTM templates** provide correct domain structures but contain placeholder data. Real SDTM datasets require mapping from actual clinical data sources through a validated transformation process.

These exports are useful as starting points and organizational tools. No regulatory affairs team would submit them to the FDA as-is.

### Security Is Unaudited

- No penetration testing performed
- No SOC 2 Type II certification
- No HIPAA compliance assessment
- RLS policies exist but haven't been formally audited for gaps
- Service role (`getSupabaseAdmin()`) bypasses RLS in API routes — one missed auth check means data exposure
- No rate limiting on API endpoints
- No input sanitization audit beyond Zod schema validation
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

What's NOT tested:

- Database query correctness against a real Supabase instance
- RLS policy enforcement
- Auth flow edge cases
- Export output correctness (do generated PDFs match regulatory specs?)
- Cross-feature integration (create protocol -> add evidence -> screen -> export)

### E2E Tests (49)

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

Four jobs pass: typecheck, lint, unit tests, build. No integration tests, no E2E in CI (no browser environment), no security scanning, no dependency audit.

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
- No production deployment with monitoring
- No single feature hardened to "works perfectly every time" level
- No performance testing under realistic load
- Security posture is "reasonable for dev" not "ready for health data"

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

1. Pick ONE wedge (systematic review pipeline is the strongest)
2. Remove `ignoreBuildErrors`, fix all type errors, add pagination
3. Get 5 beta users from an academic research group or CRO
4. Iterate on real feedback for 3 months
5. Then decide if there's product-market fit before building more

### As a Product Ready for Enterprise Sales

Not close. The gap between "all features exist as UI" and "one feature works reliably enough that a pharma company will pay $50K/year for it" is 6-12 months of focused hardening, security work, and user research.

---

## Recommended Next Steps (If Pursuing as Product)

1. **Remove `ignoreBuildErrors: true`** and fix all TypeScript errors. Non-negotiable.
2. **Add pagination** to evidence library, screening, and activity log.
3. **Add React Query** for caching, optimistic updates, and proper loading states.
4. **Remove the dev UUID fallback** in `useUserId()` or gate it behind `NODE_ENV`.
5. **Pick one feature** (screening pipeline recommended) and make it bulletproof.
6. **Deploy to production** with monitoring (Vercel + Sentry or similar).
7. **Get 5 real users** and watch them use it. Fix what they struggle with.
8. **Security audit** — at minimum, run `npm audit`, review RLS policies, add rate limiting.
9. **Integration tests** against a real Supabase instance (not just mocks).
10. **Performance benchmarks** — how does it handle 1,000 evidence items? 10,000?

---

## Summary

VaxEvidence demonstrates genuine domain expertise and impressive engineering velocity. The breadth of features built is remarkable for the timeline. But breadth without depth is a demo, not a product. The gap between "this looks like it works" and "a pharmaceutical company would trust this with their regulatory submissions" is where the real work begins.

The foundation is solid. The question is whether to go deep on one feature and find real users, or to keep building breadth that looks impressive but doesn't serve anyone yet.
