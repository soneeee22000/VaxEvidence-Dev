# VaxEvidence

A Real-World Evidence (RWE) platform for vaccine research scientists. Enables collaborative creation of regulatory-ready study protocols (PICO-based), evidence management, dataset handling, and export/reporting. Built for FDA/EMA compliance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, CSS variables (OKLCH), dark mode default
- **UI Components:** shadcn/ui (New York style) + Radix UI + Lucide icons
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage) with `@supabase/ssr`
- **Forms:** react-hook-form + Zod validation
- **Exports:** jsPDF, @react-pdf/renderer, docx, papaparse, xlsx, citation-js, archiver
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

## Core Workflow

1. **Create** protocols and define research questions using PICO framework
2. **Import** evidence from PubMed, ClinicalTrials.gov, or add manually
3. **Organize** datasets with upload, preview, and visualization
4. **Collaborate** with threaded comments, reviews, and activity tracking
5. **Export** protocols (PDF/Word), bibliographies (APA/BibTeX/RIS), activity logs, and full workspace archives

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
├── evidence/           # Evidence cards, filters, import, PubMed/trial search
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

## Features

### Protocol Builder

- PICO-based protocol design (Population, Intervention, Comparator, Outcomes)
- Protocol templates for common study types
- Status tracking: draft, in_review, final
- Link evidence and datasets to protocols

### Evidence Library

- 4 evidence types: academic, regulatory, dataset, note
- PubMed search and one-click import (NCBI E-utilities)
- DOI/PMID quick import (CrossRef)
- ClinicalTrials.gov search and import
- Auto-tagging from title/abstract keywords
- Advanced filtering by type, tags, date

### Dataset Management

- CSV/Excel upload with Supabase Storage
- Data preview (first 50 rows) and basic charts
- Link datasets to protocols

### Collaboration

- Threaded comments on protocols, evidence, datasets
- Review workflows (request, approve, reject, request changes)
- Activity feed with automatic logging

### Reporting & Export

- Protocol export as PDF (professional, academic, regulatory templates)
- Protocol export as Word (.docx)
- Bibliography export (APA, MLA, Chicago, BibTeX, RIS)
- Activity audit log export (CSV and PDF)
- Workspace bulk export (ZIP archive)

## Documentation

See [`docs/`](docs/) for detailed documentation:

- `SMOKE_CHECKLIST.md` — Manual QA checklist
- `MVP_FEATURES.md` — Feature specifications
- `REPORTING_EXPORT_IMPLEMENTATION.md` — Export system details
- `SCIENTIFIC_DATABASE_INTEGRATION_MVP.md` — Database integration specs
- `template-integration-guide.md` — Protocol template guide

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full product roadmap. Next priorities:

1. Multi-tenant teams & RBAC
2. Protocol versioning & audit trail (21 CFR Part 11)
3. Pagination & performance
4. Test suite & CI pipeline
5. AI research assistant
