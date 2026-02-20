# VaxEvidence

A Real-World Evidence (RWE) platform for vaccine research scientists. Enables collaborative creation of regulatory-ready study protocols (PICO-based), evidence management, dataset handling, and export/reporting. Built for FDA/EMA compliance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, CSS variables (OKLCH), dark mode default
- **UI Components:** shadcn/ui (New York style) + Radix UI + Lucide icons
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage) with `@supabase/ssr`
- **Forms:** react-hook-form + Zod validation
- **Exports:** jsPDF, @react-pdf/renderer, docx, papaparse, xlsx, citation-js
- **Charts:** recharts
- **Animations:** framer-motion, lottie-react
- **Theming:** next-themes (dark mode default)
- **Notifications:** sonner
- **Package Manager:** pnpm

## Getting Started

```bash
pnpm install
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm start        # Start production server
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

## MVP Workflow

1. **Create** protocols and define research questions (PICO)
2. **Collect** evidence and datasets into the Evidence Library
3. **Collaborate** with comments and reviews on protocols and evidence
4. **Export** protocols, activity logs, and workspaces for reporting
5. **Integrate** scientific databases (PubMed, ClinicalTrials.gov) to import evidence

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API routes (evidence, export, search, import, waitlist)
├── app/                # Authenticated pages (dashboard, evidence, datasets, etc.)
├── auth/               # Login + OAuth callback
├── layout.tsx          # Root layout
└── page.tsx            # Landing page

components/
├── ui/                 # ~56 shadcn/ui primitives
├── collaboration/      # Comments, reviews, activity feed
├── datasets/           # Dataset cards, filters, upload
├── evidence/           # Evidence cards, filters, import, search
├── export/             # Export dialogs and menus
├── landing/            # Marketing page sections
└── templates/          # Protocol template selector

lib/
├── api/                # External API clients (PubMed, CrossRef, ClinicalTrials.gov)
├── auth/               # Auth context (useAuth, useUserId)
├── demo/               # Sample data for demo mode
├── export/             # PDF/Word/CSV/ZIP generators + bibliography
├── ml/                 # Auto-tagging via keyword extraction
├── supabase/           # Supabase clients + CRUD modules per table
├── templates/          # Protocol template definitions
├── validators/         # Zod schemas
└── utils.ts            # cn() helper

hooks/                  # use-mobile, use-toast
supabase/migrations/    # SQL migration files
docs/                   # Project documentation
proxy.ts                # Auth proxy (Supabase session + route guards)
```

## Scientific Database Integration

- PubMed search + import (E-utilities API)
- DOI/PMID quick import (CrossRef + PubMed)
- ClinicalTrials.gov search + import
- Auto-tagging from title/abstract keywords

## Reporting & Export

- Protocol export to PDF and Word
- Bibliography export (APA/MLA/Chicago/BibTeX/RIS)
- Activity log export (CSV/PDF)
- Workspace bulk export (ZIP with JSON/CSV/PDF)

## Documentation

See [`docs/`](docs/) for detailed documentation:

- `SMOKE_CHECKLIST.md` — Manual QA checklist
- `MVP_FEATURES.md` — Feature specifications
- `REPORTING_EXPORT_IMPLEMENTATION.md` — Export system details
- `SCIENTIFIC_DATABASE_INTEGRATION_MVP.md` — Database integration specs
- `template-integration-guide.md` — Protocol template guide
