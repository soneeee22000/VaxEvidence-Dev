# VaxEvidence-Dev MVP

VaxEvidence is a collaborative platform for building vaccine research protocols and managing evidence. This repository contains the MVP workflow and the core modules that support it.

## MVP Workflow
1. **Create** protocols and define research questions (PICO).
2. **Collect** evidence and datasets into the Evidence Library.
3. **Collaborate** with comments and reviews on protocols and evidence.
4. **Export** protocols, activity logs, and workspaces for reporting.
5. **Integrate** scientific databases to import external evidence quickly.

## Code Structure
- `app/` - Next.js App Router pages and API routes.
  - `app/api/` - Server-side API routes (export, search, import).
  - `app/app/` - Authenticated application pages (dashboard, evidence, activity).
- `components/` - Reusable UI components and feature modules.
  - `components/evidence/` - Evidence Library UI and external search/import dialogs.
  - `components/export/` - Reporting/export menus and dialogs.
- `lib/` - Shared libraries and domain logic.
  - `lib/api/` - External API clients (PubMed, CrossRef, ClinicalTrials).
  - `lib/export/` - PDF/Word/CSV/ZIP export utilities.
  - `lib/ml/` - Lightweight tagging/categorization helpers.
  - `lib/supabase/` - Supabase client helpers and queries.
  - `lib/validators/` - Zod schemas and validation helpers.
- `supabase/` - SQL migrations.
- `styles/` and `app/globals.css` - Global styles.

## Scientific Database Integration (MVP)
- PubMed search + import (E-utilities API)
- DOI/PMID quick import (CrossRef + PubMed)
- ClinicalTrials.gov search + import
- Auto-tagging from title/abstract keywords

## Reporting & Export (MVP)
- Protocol export to PDF and Word
- Bibliography export (APA/MLA/Chicago/BibTeX/RIS)
- Activity log export (CSV/PDF)
- Workspace bulk export (ZIP with JSON/CSV/PDF)

## Environment Variables
Create `.env.local`:
```
NCBI_API_KEY=your_key_here
OPENAI_API_KEY=optional_key_here
```

## Optional Database Migration
```
supabase/migrations/20260120_add_external_fields_to_evidence.sql
```
Adds `external_id`, `external_source`, and `imported_at` to evidence items.

## Getting Started
```
pnpm install
pnpm dev
```
Default app URL: `http://localhost:3000`

## Docs
- `REPORTING_EXPORT_IMPLEMENTATION.md`
- `SCIENTIFIC_DATABASE_INTEGRATION_MVP.md`
- `SMOKE_CHECKLIST.md`
