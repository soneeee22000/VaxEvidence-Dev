# CLAUDE.md — VaxEvidence

## Project Overview

VaxEvidence is a Real-World Evidence (RWE) platform for vaccine research scientists. It enables collaborative creation of regulatory-ready study protocols (PICO-based), evidence management, dataset handling, PRISMA-compliant systematic reviews, and export/reporting. Built for FDA/EMA compliance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, CSS variables (OKLCH color space), dark mode default
- **UI Components:** shadcn/ui (New York style) + Radix UI primitives + Lucide icons
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage) with `@supabase/ssr` for SSR-aware clients
- **Forms:** react-hook-form + Zod validation
- **Data Fetching:** @tanstack/react-query v5 (caching, pagination, optimistic updates)
- **Exports:** jsPDF, @react-pdf/renderer, docx, papaparse, exceljs, citation-js, archiver
- **Charts:** recharts
- **Animations:** framer-motion
- **Theming:** next-themes (dark mode default)
- **Notifications:** sonner (toast notifications)
- **Real-time:** yjs (CRDT), Supabase Realtime (Broadcast + Presence)
- **AI:** ai SDK v6, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/react
- **Analytics:** @vercel/analytics
- **Monitoring:** @sentry/nextjs v10 (error tracking, source maps)
- **Testing:** vitest (unit), @playwright/test (E2E)
- **Package Manager:** pnpm

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint (flat config, eslint-config-next)
pnpm start            # Start production server
pnpm test             # Run unit tests (vitest)
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with v8 coverage
pnpm test:integration # Run integration tests (vitest, separate config)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm typecheck        # TypeScript check without emit
```

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API routes
│   ├── ai/             # AI research assistant (PICO, synthesis, recommendations)
│   ├── analytics/      # Analytics events
│   ├── auth/           # Auth helpers
│   ├── cron/           # Scheduled jobs
│   ├── evidence/       # Evidence CRUD + /[id] detail
│   ├── export/         # Export routes
│   │   ├── activity/csv/   # Activity log CSV export
│   │   ├── activity/pdf/   # Activity log PDF export
│   │   ├── bibliography/   # Bibliography export (APA/MLA/Chicago/BibTeX/RIS)
│   │   ├── protocol/[id]/  # Protocol PDF/Word + /ind + /ectd + /sdtm + /compliance
│   │   └── workspace/      # Full workspace ZIP export
│   ├── feedback/       # User feedback submission
│   ├── gcp-compliance/ # GCP compliance CRUD
│   ├── health/         # Health check endpoint
│   ├── import/         # Evidence import
│   ├── integrations/   # External integrations CRUD
│   ├── invitations/    # Workspace invitation management
│   ├── meta-analysis/  # Meta-analysis CRUD + /[id] detail
│   ├── protocols/      # Protocol CRUD + versioning
│   ├── reporting-checklist/ # CONSORT/STROBE checklist CRUD
│   ├── risk-of-bias/   # RoB assessment CRUD + /[id] detail
│   ├── screening/      # Screening decisions CRUD + /[id] + /duplicates
│   ├── search/         # PubMed/ClinicalTrials.gov search
│   ├── v1/             # Public REST API (API key auth, Phase 12)
│   ├── waitlist/       # Waitlist signup
│   └── workspaces/     # Workspace management CRUD
├── app/                # Authenticated pages
│   ├── [id]/           # Individual protocol view
│   │   ├── screening/  # Systematic review screening page
│   │   └── regulatory/ # Regulatory compliance hub (CONSORT/STROBE/GCP)
│   ├── activity/       # Activity log page
│   ├── datasets/       # Dataset listing + /new + /[id]
│   ├── evidence/       # Evidence library + /new + /[id]
│   ├── new/            # New protocol creation
│   ├── settings/       # Enterprise settings (6 tabs: general, API keys, webhooks, SSO, audit, compliance)
│   ├── templates/      # Protocol template browser
│   ├── layout.tsx      # Authenticated layout (sidebar + auth guard)
│   └── page.tsx        # Dashboard
├── demo/               # Public demo mode (pre-loaded sample data)
│   ├── [id]/           # Demo protocol view + /screening
│   ├── layout.tsx      # Demo layout
│   └── page.tsx        # Demo dashboard
├── auth/               # Login page
│   └── callback/       # OAuth callback route handler
├── layout.tsx          # Root layout
└── page.tsx            # Landing page

components/
├── ui/                 # ~56 shadcn/ui primitives (DO NOT manually edit)
├── ai/                 # AI assistant panel, PICO generator
├── collaboration/      # Comments, reviews, activity feed, presence avatars, field cursors, notifications
├── datasets/           # Dataset cards, filters, upload
├── demo/               # Demo mode components
├── evidence/           # Evidence cards, filters, import dialogs, PubMed/trial search
├── export/             # Export dialogs and menus (incl. PRISMA PDF, IND, eCTD, SDTM)
├── feedback/           # Feedback widget
├── landing/            # Marketing page sections
├── meta-analysis/      # Forest plot (SVG), data entry table, panel
├── onboarding/         # Guided onboarding flow
├── regulatory/         # IND/eCTD/SDTM preview dialogs, checklist panel, GCP compliance
├── risk-of-bias/       # RoB assessment form, traffic-light summary, domain badge
├── screening/          # Screening pipeline, cards, stats bar, PRISMA diagram, duplicate detector
├── settings/           # Enterprise settings tabs (API keys, webhooks, SSO, audit, compliance, integrations)
├── templates/          # Protocol template selector
├── versioning/         # Protocol version history, diff viewer
├── theme-provider.tsx  # next-themes provider wrapper
└── theme-toggle.tsx    # Dark/light mode toggle

lib/
├── ai/                 # AI service layer (prompts, streaming)
├── analytics/          # Event tracking utilities
├── api/                # External API clients (PubMed, CrossRef, ClinicalTrials.gov)
├── audit/              # Audit log helpers
├── auth/               # Auth context (useAuth, useUserId) from auth-context.tsx
├── collaboration/      # Real-time collaboration (Phase 10)
│   ├── types.ts                     # PresenceState, CollaboratorInfo, COLLAB_FIELDS
│   ├── constants.ts                 # 8 OKLCH collaborator colors, getUserColor() hash
│   ├── supabase-yjs-provider.ts     # Yjs <-> Supabase Broadcast transport
│   ├── yjs-form-bridge.ts           # Yjs Y.Map <-> react-hook-form bidirectional sync
│   ├── presence-context.tsx         # React context: channel, presence, Yjs doc, bridge
│   └── use-realtime-comments.ts     # Hook: postgres_changes on comments table
├── config.ts           # App configuration constants
├── demo/               # Sample data for demo mode (sample-datasets.ts)
├── export/             # PDF/Word/CSV/ZIP generators + bibliography + PRISMA PDF + IND/eCTD/SDTM
├── import/             # Evidence import parsers
├── ml/                 # Auto-tagging via keyword extraction
├── onboarding/         # Onboarding state management
├── query/              # React Query layer (Phase 5)
│   ├── query-client.ts              # QueryClient config (30s stale, 5min GC)
│   ├── query-provider.tsx           # QueryClientProvider + ReactQueryDevtools
│   └── hooks.ts                     # Custom hooks: useEvidenceList, useDatasetList, useProtocolList, etc.
├── regulatory/         # Regulatory definitions (Phase 11)
│   ├── ind-sections.ts              # FDA IND 21 CFR 312.23 (10 sections)
│   ├── consort-checklist.ts         # CONSORT 2010 (37 sub-items)
│   ├── strobe-checklist.ts          # STROBE (~40 items, 3 study-type variants)
│   ├── gcp-principles.ts            # ICH E6(R2) GCP principles (13)
│   ├── gcp-protocol-sections.ts     # GCP protocol sections (20)
│   ├── gcp-essential-documents.ts   # GCP essential documents (35)
│   ├── ectd-module5-structure.ts    # ICH M4E(R2) eCTD Module 5 (15 sections)
│   ├── sdtm-domains.ts             # CDISC SDTM v3.3 (10 domains)
│   └── sdtm-trial-design.ts        # SDTM auto-population from protocol PICO
├── screening/          # Duplicate detection (DOI/PMID/fuzzy title) + PRISMA count computation
├── security/           # Rate limiting, input sanitization
├── storage/            # Supabase Storage helpers
├── supabase/           # Supabase clients + CRUD query modules per table
│   ├── browser.ts      # SSR-aware browser client (@supabase/ssr)
│   ├── server.ts       # Server client (admin + user-session) + getServerUser()
│   ├── middleware.ts    # Auth middleware helpers (session refresh)
│   ├── activity.ts     # Activity log CRUD
│   ├── audit-logs.ts   # Audit log CRUD
│   ├── comments.ts     # Comments CRUD (+ @mention notification creation)
│   ├── datasets.ts     # Datasets CRUD
│   ├── evidence.ts     # Evidence CRUD
│   ├── gcp-compliance.ts    # GCP compliance CRUD
│   ├── integrations.ts      # External integrations CRUD
│   ├── meta-analysis.ts     # Meta-analysis entries CRUD
│   ├── notifications.ts     # Notification CRUD (fetch, unread count, mark read, create)
│   ├── protocols.ts         # Protocols CRUD
│   ├── protocol-versions.ts # Protocol version history CRUD
│   ├── reporting-checklists.ts  # CONSORT/STROBE checklist CRUD
│   ├── reviews.ts           # Reviews CRUD
│   ├── risk-of-bias.ts      # Risk of bias assessments CRUD
│   ├── screening.ts         # Screening decisions CRUD
│   ├── workspace-members.ts # Workspace member management
│   └── workspaces.ts        # Workspace CRUD
├── templates/          # Protocol template definitions
├── types/              # Shared TypeScript types (pagination, etc.)
├── utils/              # Utility modules
│   └── file-parser.ts  # File parsing utilities
├── validators/         # Zod schemas (protocol, evidence, dataset, comment, review, activity, waitlist, screening, risk-of-bias, meta-analysis, notification)
└── utils.ts            # cn() helper (clsx + tailwind-merge)

hooks/                  # use-mobile, use-toast
__tests__/              # Unit + integration tests (vitest, ~1,400 unit + 60 integration)
├── benchmarks/         # Performance benchmarks (4 suites, 51 tests)
├── integration/        # Integration tests against real Supabase (RLS, CRUD, data integrity)
├── api/                # API route tests
├── screening/          # Screening logic tests
├── security/           # Security audit tests
├── supabase/           # CRUD module tests
└── ...                 # 17 sub-directories total
e2e/                    # Playwright E2E tests (63 tests)
supabase/migrations/    # SQL migration files
docs/                   # Project documentation
public/demo/            # Demo mode static assets
proxy.ts                # Auth proxy (Supabase session + route guards, Next.js 16 convention)
```

## Architecture & Patterns

### Authentication

- **Supabase Auth:** OAuth/passwordless via `@supabase/ssr`, session refresh in `lib/supabase/middleware.ts`
- **Route protection:** `proxy.ts` guards `/app/*` routes using Supabase session check, redirects unauthenticated to `/auth` (Next.js 16 convention)
- **OAuth callback:** `app/auth/callback/route.ts` handles OAuth code exchange
- **Client auth:** `useAuth()` and `useUserId()` hooks from `lib/auth/auth-context.tsx`, using `lib/supabase/browser.ts`
- **Dev fallback:** `useUserId()` returns a hardcoded UUID (`550e8400-...`) when no session exists (dev convenience only)

### Data Layer

- Direct Supabase queries in `lib/supabase/*.ts` (one module per table)
- Evidence CRUD uses API route proxy (`/api/evidence`) with service role to bypass RLS
- Export API routes use `getSupabaseAdmin()` with inline queries (not browser CRUD modules)
- Server-side: `getSupabaseAdmin()` (service role), `createServerSupabaseClient()` (user session), `getServerUser()` (auth helper) from `lib/supabase/server.ts`
- Client-side: `createClient()` from `lib/supabase/browser.ts` (SSR-aware)
- Supabase query pattern: `const { data, error } = await supabase.from('table').select('*')`
- Return pattern: `{ data, error: null }` or `{ data: null, error: { message } }`

### Server vs Client Components

- Server components (default) for data fetching
- `"use client"` directive for interactive components
- `<Suspense>` boundaries required for components using `useSearchParams()`

### Form Pattern

```typescript
const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {...} })
```

## Coding Conventions

### File Naming

- Pages/layouts: `page.tsx`, `layout.tsx` (Next.js convention)
- Components: `kebab-case.tsx` (e.g., `evidence-card.tsx`)
- Client component extractions: `PascalCase.tsx` (e.g., `NewProtocolClient.tsx`)
- Lib modules: `kebab-case.ts`
- Validators: `singular.ts` (e.g., `protocol.ts`)

### Imports

Use `@/*` absolute imports. Order: external libs → UI components → feature components → lib → types → icons (lucide-react last).

### Styling

- Tailwind utility classes only — no CSS modules or styled-components
- Use `cn()` from `@/lib/utils` for conditional class merging
- Mobile-first responsive: `sm:`, `md:`, `lg:`, `xl:`
- Dark mode is the default theme
- OKLCH color space: dark mode hue 260 (blue-slate), primary hue 168 (teal), dark primary lightness 0.60
- Landing page visual system uses custom CSS classes in `globals.css`: `.glass-card` (translucent + backdrop-blur + border glow hover), `.glow-card` (gradient border shimmer via pseudo-element), `.dot-grid` (subtle dot pattern background), `.text-glow` (teal gradient text)

### TypeScript

- Strict mode enabled
- Zod schemas for all validation + runtime type checking
- Discriminated unions for evidence types (academic | regulatory | dataset | note)
- Prefer type inference; explicit types at API boundaries

### Error Handling

- Supabase: destructure `{ data, error }`, check error before proceeding
- API routes: try/catch → `NextResponse.json({ error: message }, { status })`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL              # Required (production)
NEXT_PUBLIC_SUPABASE_ANON_KEY         # Required (production)
SUPABASE_SERVICE_ROLE_KEY             # Required (production, server-only)
SUPABASE_URL                          # Optional fallback for NEXT_PUBLIC_SUPABASE_URL (server-only)
NCBI_API_KEY                          # Optional (PubMed higher rate limits)
NEXT_PUBLIC_SUPABASE_DATASETS_BUCKET  # Optional (defaults to "datasets")
NEXT_PUBLIC_DEBUG_LOG_ENDPOINT        # Optional (debug logging)
IP_HASH_SALT                          # Optional (waitlist IP anonymization)
```

## Known Constraints

- Images are unoptimized (`images: { unoptimized: true }`)
- Screening decisions, linked evidence, and `getUniqueTags()` are still unbounded (no pagination) — see `docs/PERFORMANCE-BENCHMARKS.md`
- API keys and webhooks are fully functional (CRUD + delivery + signing). SSO/SAML requires Supabase Enterprise plan (config saved locally, login disabled without it). Integrations (Zotero, Mendeley, REDCap) have backend routes but depend on external API credentials.
- Regulatory exports (IND, eCTD, SDTM) produce structured templates, not submission-ready packages

## Important: Server vs Browser Client in API Routes

Export API routes (`/api/export/*`) use `getSupabaseAdmin()` from `lib/supabase/server.ts` for all database queries. Do NOT use browser CRUD modules (`lib/supabase/*.ts`) in API routes — the browser client (`@supabase/ssr`) relies on cookie-based auth that is unavailable in server-side route handlers. All API routes that need data must:

1. Import `getSupabaseAdmin` and `getServerUser` from `@/lib/supabase/server`
2. Check auth with `getServerUser()` (return 401 if null)
3. Query with `getSupabaseAdmin().from("table")...` (bypasses RLS via service role)

Junction table names: `protocol_evidence_links` (not `protocol_evidence`), `protocol_dataset_links` (not `protocol_datasets`).

## Systematic Review Tables

- `screening_decisions` — per-evidence, per-stage screening decisions. Unique on `(protocol_id, evidence_id, stage)`. Stages: `identification`, `screening`, `eligibility`, `included`. Decisions: `pending`, `include`, `exclude`, `duplicate`.
- `risk_of_bias_assessments` — RoB 2 (RCTs) or ROBINS-I (observational) assessments. Unique on `(protocol_id, evidence_id, tool)`. Domains stored as JSONB: `{ "domain_name": { "judgment": "low", "justification": "..." } }`.
- `meta_analysis_entries` — study-level effect sizes for forest plots. Fields: `study_label`, `effect_size`, `ci_lower`, `ci_upper`, `weight`, `subgroup`.
