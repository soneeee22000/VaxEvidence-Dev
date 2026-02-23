# VaxEvidence

A Real-World Evidence (RWE) platform for vaccine research scientists. Enables collaborative creation of regulatory-ready study protocols (PICO-based), PRISMA-compliant systematic reviews, risk-of-bias assessment, meta-analysis, regulatory submissions (FDA IND, eCTD, SDTM), and real-time team collaboration. Built for FDA/EMA compliance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, CSS variables (OKLCH), dark mode default
- **UI Components:** shadcn/ui (New York style) + Radix UI + Lucide icons
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage) with `@supabase/ssr`
- **Data Fetching:** @tanstack/react-query v5 (caching, pagination, optimistic updates)
- **Forms:** react-hook-form + Zod validation
- **Real-time:** yjs (CRDT) + Supabase Realtime (Broadcast + Presence)
- **AI:** Vercel AI SDK v6, OpenAI, Google AI
- **Exports:** jsPDF, @react-pdf/renderer, docx, papaparse, exceljs, citation-js, archiver
- **Charts:** recharts (dashboards) + custom SVG (forest plots)
- **Monitoring:** @sentry/nextjs v10 (error tracking, source maps)
- **Testing:** vitest (~1,400 unit + 60 integration + 51 benchmark tests), Playwright (63 E2E tests)
- **Animations:** framer-motion
- **Package Manager:** pnpm

## Getting Started

```bash
pnpm install
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm start            # Start production server
pnpm test             # Run unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm typecheck        # TypeScript strict check
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=             # Required (production)
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Required (production)
SUPABASE_SERVICE_ROLE_KEY=            # Required (production, server-only)
SUPABASE_URL=                         # Optional fallback (server-only)
NCBI_API_KEY=                         # Optional (PubMed higher rate limits)
NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET= # Optional (defaults to "datasets")
NEXT_PUBLIC_DEBUG_LOG_ENDPOINT=       # Optional (debug logging)
IP_HASH_SALT=                         # Optional (waitlist IP anonymization)
```

## Core Workflow

1. **Create** protocols and define research questions using PICO framework
2. **Import** evidence from PubMed, ClinicalTrials.gov, or add manually
3. **Screen** studies through a PRISMA-compliant 4-stage pipeline with duplicate detection
4. **Assess** risk of bias using RoB 2 (RCTs) or ROBINS-I (observational) tools
5. **Analyze** with meta-analysis forest plots (effect sizes, confidence intervals, subgroups)
6. **Collaborate** in real-time with Yjs CRDT editing, presence indicators, and @mention notifications
7. **Export** regulatory-ready packages: FDA IND, eCTD Module 5, SDTM templates, or standard PDF/Word/CSV

## Features

### Protocol Builder

- PICO-based protocol design (Population, Intervention, Comparator, Outcomes)
- Protocol templates for common study types
- Version history with diff viewer
- Status tracking: draft, in_review, final
- Link evidence and datasets to protocols

### Evidence Library

- 4 evidence types: academic, regulatory, dataset, note
- PubMed search and one-click import (NCBI E-utilities)
- DOI/PMID quick import (CrossRef)
- ClinicalTrials.gov search and import
- Auto-tagging from title/abstract keywords
- Server-side pagination, search, and advanced filtering

### Systematic Review (PRISMA)

- 4-stage screening pipeline: identification, screening, eligibility, included
- Duplicate detection (DOI, PMID, fuzzy title matching via Dice coefficient)
- Per-study include/exclude decisions with exclusion reasons
- PRISMA flow diagram with live counts
- PRISMA PDF export

### Risk-of-Bias Assessment

- RoB 2 tool for randomized controlled trials (5 domains)
- ROBINS-I tool for observational studies (7 domains)
- Traffic-light summary visualization
- Per-domain judgment with justification

### Meta-Analysis

- Study-level effect size data entry
- Custom SVG forest plots with CI whiskers
- Subgroup analysis support
- Pooled effect size calculation

### Real-Time Collaboration

- Yjs CRDT for conflict-free concurrent editing
- Supabase Broadcast transport (no WebSocket server needed)
- Presence indicators and field-level cursors
- Threaded comments with @mention notifications
- Review workflows (request, approve, reject, request changes)
- Activity feed with automatic logging

### Regulatory Compliance

- **CONSORT 2010** checklist (37 sub-items) for RCT reporting
- **STROBE** checklist (~40 items, 3 study-type variants) for observational studies
- **ICH E6(R2) GCP** compliance tracker (68 items across 3 categories)
- Interactive checklist UI with progress tracking

### Regulatory Exports

- **FDA IND Package** (PDF + Word) per 21 CFR 312.23 — 10 sections with protocol auto-population
- **eCTD Module 5** (PDF + Word) per ICH M4E(R2) — 15 sections with screening data integration
- **CDISC SDTM Templates** (ZIP) — 10 domains (v3.3) with auto-population from protocol PICO

### Reporting & Export

- Protocol export as PDF (professional, academic, regulatory templates)
- Protocol export as Word (.docx)
- Bibliography export (APA, MLA, Chicago, BibTeX, RIS)
- Activity audit log export (CSV and PDF)
- Workspace bulk export (ZIP archive)

### AI Research Assistant

- PICO auto-generation from research questions
- Literature synthesis and summary
- Paper recommendations

### Enterprise (UI Shells)

- API key management with create/revoke
- Webhook configuration with event selection
- SSO/SAML configuration form
- Audit log viewer
- Compliance dashboard
- Integration provider cards

### Dataset Management

- CSV/Excel upload with Supabase Storage
- Data preview (first 50 rows) and basic charts
- Link datasets to protocols

## Project Structure

```
app/                    # Next.js App Router
├── api/                # 21 API route groups (evidence, screening, export, ai, v1, etc.)
├── app/                # Authenticated pages (dashboard, evidence, datasets, screening, regulatory, settings)
├── auth/               # Login + OAuth callback
├── layout.tsx          # Root layout
└── page.tsx            # Landing page

components/             # 20 component directories
├── ui/                 # ~56 shadcn/ui primitives
├── ai/                 # AI assistant panel
├── collaboration/      # Comments, reviews, presence, notifications
├── regulatory/         # IND/eCTD/SDTM dialogs, checklists, GCP
├── screening/          # Pipeline, PRISMA diagram, duplicate detector
├── settings/           # Enterprise settings tabs
└── ...                 # + datasets, evidence, export, meta-analysis, risk-of-bias, etc.

lib/                    # 22 library modules
├── query/              # React Query hooks + client config
├── regulatory/         # Regulatory definitions (IND, CONSORT, STROBE, GCP, eCTD, SDTM)
├── collaboration/      # Yjs provider, presence context, form bridge
├── supabase/           # 20 CRUD modules + client setup
├── export/             # PDF/Word/CSV/ZIP + IND/eCTD/SDTM generators
└── ...                 # + ai, analytics, audit, security, screening, validators, etc.

__tests__/              # vitest unit + integration tests (~1,400 unit + 60 integration)
├── benchmarks/         # Performance benchmarks (51 tests)
├── integration/        # Integration tests against real Supabase (RLS, CRUD, data integrity)
└── ...                 # 16 sub-directories (api, screening, security, supabase, etc.)
e2e/                    # Playwright E2E tests (63 tests)
supabase/migrations/    # SQL migration files
docs/                   # Project documentation
proxy.ts                # Auth proxy (Next.js 16 convention)
```

## Testing

```bash
pnpm test                # Unit tests (vitest, ~1,400 tests + 51 benchmarks)
pnpm test:coverage       # Unit tests with v8 coverage
pnpm test:integration    # Integration tests against real Supabase (60 tests)
pnpm test:e2e            # Playwright E2E tests (63 tests)
pnpm vitest run __tests__/benchmarks/  # Performance benchmarks (51 tests)
```

## Documentation

See [`docs/`](docs/) for detailed documentation:

- `PERFORMANCE-BENCHMARKS.md` — Performance benchmark results and optimization recommendations
- `PRD-PHASE-11.md` — Phase 11 (Regulatory) product requirements
- `SMOKE_CHECKLIST.md` — Manual QA checklist
- `MVP_FEATURES.md` — Feature specifications
- `REPORTING_EXPORT_IMPLEMENTATION.md` — Export system details
- `SCIENTIFIC_DATABASE_INTEGRATION_MVP.md` — Database integration specs

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full product roadmap. All 12 development phases are complete:

| Phase | Feature                                                | Status |
| ----- | ------------------------------------------------------ | ------ |
| 1-2   | Core platform (protocols, evidence, datasets, exports) | Done   |
| 3     | Multi-tenant workspaces & RBAC                         | Done   |
| 4     | Protocol versioning & audit trail                      | Done   |
| 5     | Pagination & React Query caching                       | Done   |
| 6     | Test suite & CI pipeline                               | Done   |
| 7     | AI research assistant                                  | Done   |
| 8     | Systematic review / PRISMA screening                   | Done   |
| 10    | Real-time collaboration (Yjs, presence)                | Done   |
| 11    | Regulatory submissions (IND, eCTD, SDTM, checklists)   | Done   |
| 12    | Enterprise (API keys, webhooks, SSO, audit)            | Done   |

**Next:** Phase 9 (Billing / Stripe) is planned but not yet started.
