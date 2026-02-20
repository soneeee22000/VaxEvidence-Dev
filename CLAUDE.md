# CLAUDE.md — VaxEvidence

## Project Overview

VaxEvidence is a Real-World Evidence (RWE) platform for vaccine research scientists. It enables collaborative creation of regulatory-ready study protocols (PICO-based), evidence management, dataset handling, and export/reporting. Built for FDA/EMA compliance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, CSS variables (OKLCH color space), dark mode default
- **UI Components:** shadcn/ui (New York style) + Radix UI primitives + Lucide icons
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage) with `@supabase/ssr` for SSR-aware clients
- **Forms:** react-hook-form + Zod validation
- **Exports:** jsPDF, @react-pdf/renderer, docx, papaparse, xlsx, citation-js, archiver
- **Charts:** recharts
- **Animations:** framer-motion, lottie-react
- **Theming:** next-themes (dark mode default)
- **Notifications:** sonner (toast notifications)
- **Analytics:** @vercel/analytics
- **Package Manager:** pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint (flat config, eslint-config-next)
pnpm start        # Start production server
```

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API routes
│   ├── evidence/       # Evidence CRUD + /[id] detail
│   ├── export/         # Export routes
│   │   ├── activity/csv/   # Activity log CSV export
│   │   ├── activity/pdf/   # Activity log PDF export
│   │   ├── bibliography/   # Bibliography export (APA/MLA/Chicago/BibTeX/RIS)
│   │   ├── protocol/[id]/  # Protocol PDF export + /word sub-route
│   │   └── workspace/      # Full workspace ZIP export
│   ├── import/         # Evidence import
│   ├── search/         # PubMed/ClinicalTrials.gov search
│   └── waitlist/       # Waitlist signup
├── app/                # Authenticated pages
│   ├── [id]/           # Individual protocol view
│   ├── activity/       # Activity log page
│   ├── datasets/       # Dataset listing + /new + /[id]
│   ├── evidence/       # Evidence library + /new + /[id]
│   ├── new/            # New protocol creation
│   ├── templates/      # Protocol template browser
│   ├── layout.tsx      # Authenticated layout (sidebar + auth guard)
│   └── page.tsx        # Dashboard
├── auth/               # Login page
│   └── callback/       # OAuth callback route handler
├── layout.tsx          # Root layout
└── page.tsx            # Landing page

components/
├── ui/                 # ~56 shadcn/ui primitives (DO NOT manually edit)
├── collaboration/      # Comments, reviews, activity feed
├── datasets/           # Dataset cards, filters, upload
├── evidence/           # Evidence cards, filters, import dialogs, PubMed/trial search
├── export/             # Export dialogs and menus
├── landing/            # Marketing page sections
├── templates/          # Protocol template selector
├── theme-provider.tsx  # next-themes provider wrapper
└── theme-toggle.tsx    # Dark/light mode toggle

lib/
├── api/                # External API clients (PubMed, CrossRef, ClinicalTrials.gov)
├── auth/               # Auth context (useAuth, useUserId) from auth-context.tsx
├── demo/               # Sample data for demo mode (sample-datasets.ts)
├── export/             # PDF/Word/CSV/ZIP generators + bibliography (APA/MLA/Chicago/BibTeX/RIS)
├── ml/                 # Auto-tagging via keyword extraction
├── supabase/           # Supabase clients + CRUD query modules per table
│   ├── browser.ts      # SSR-aware browser client (@supabase/ssr)
│   ├── server.ts       # Server client (admin + user-session) + getServerUser()
│   ├── middleware.ts    # Auth middleware helpers (session refresh)
│   ├── activity.ts     # Activity log CRUD
│   ├── comments.ts     # Comments CRUD
│   ├── datasets.ts     # Datasets CRUD
│   ├── evidence.ts     # Evidence CRUD
│   ├── protocols.ts    # Protocols CRUD
│   └── reviews.ts      # Reviews CRUD
├── templates/          # Protocol template definitions
├── utils/              # Utility modules
│   └── file-parser.ts  # File parsing utilities
├── validators/         # Zod schemas (protocol, evidence, dataset, comment, review, activity, waitlist)
└── utils.ts            # cn() helper (clsx + tailwind-merge)

hooks/                  # use-mobile, use-toast
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

- `next.config.mjs` has `ignoreBuildErrors: true` — TS errors won't block builds
- Images are unoptimized (`images: { unoptimized: true }`)
- No pagination yet — evidence library loads all items
- No caching layer (no React Query/SWR) — direct Supabase queries
- No test suite currently in place
