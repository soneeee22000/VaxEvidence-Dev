# Release Notes

## 2026-02-21

### Added — Phase 8: Systematic Review Workflow (PRISMA)

- **Screening Pipeline**: 4-stage PRISMA workflow (Identification, Screening, Eligibility, Included) with tabbed UI, include/exclude/duplicate decisions, exclusion reason categories, and batch advance to next stage.
- **Duplicate Detection**: Automated detection via exact DOI match, exact PMID/external ID match, and fuzzy title similarity (Dice coefficient >= 0.85). Interactive dialog to select which item to keep per group.
- **Risk of Bias Assessment**: RoB 2 (5 domains for RCTs) and ROBINS-I (7 domains for observational studies) with per-domain judgment + justification. Traffic-light summary table across all included studies.
- **PRISMA 2020 Flow Diagram**: Auto-generated from screening data with Tailwind CSS boxes and connecting arrows. Shows counts at each stage with exclusion sidebars.
- **Forest Plots**: Custom SVG forest plot with CI whiskers, point estimates scaled by weight, null effect reference line, and log/linear scale toggle. Editable data entry table for study-level effect sizes.
- **Meta-Analysis Data Entry**: Add/remove study entries with effect size, confidence intervals, weight, and subgroup fields.
- **PRISMA PDF Export**: One-click PDF generation of the PRISMA flow diagram via jsPDF, available from the protocol export menu.
- **Protocol Detail Integration**: "Systematic Review" card on protocol detail page linking to the screening workflow.
- **API Routes**: Full CRUD for screening decisions (`/api/screening`), risk of bias assessments (`/api/risk-of-bias`), meta-analysis entries (`/api/meta-analysis`), and duplicate detection (`/api/screening/duplicates`).
- **React Query Keys**: Added `screening`, `riskOfBias`, and `metaAnalysis` query key factories.

### Database

- 3 new migrations:
  - `20260222_screening_decisions.sql` — screening decisions with unique constraint on (protocol_id, evidence_id, stage)
  - `20260223_risk_of_bias.sql` — RoB assessments with JSONB domains and unique constraint on (protocol_id, evidence_id, tool)
  - `20260224_meta_analysis_entries.sql` — meta-analysis entries for forest plot data
- All tables have RLS enabled with open policies (same pattern as existing tables).

---

## 2026-02-20

### Fixed

- Export API routes now use server-side Supabase admin client instead of browser client. All 6 export routes (`/api/export/protocol/[id]`, `/api/export/protocol/[id]/word`, `/api/export/workspace`, `/api/export/bibliography`, `/api/export/activity/csv`, `/api/export/activity/pdf`) were failing because browser client (`@supabase/ssr`) has no cookie access in API route context.
- Corrected junction table names: `protocol_evidence_links` and `protocol_dataset_links` (previously using wrong names `protocol_evidence` and `protocol_datasets`).
- Activity log PDF export now handles empty results gracefully (generates a valid PDF with headers) instead of returning 404.
- All export routes now have `getServerUser()` auth checks (return 401 if unauthenticated).
- Auth: replaced redundant `getUser()` calls with `AuthProvider` context.
- Comprehensive bug fixes for data layer, exports, toasts, and reviews.

### Added

- Production readiness improvements: auth hardening, RLS policies, toast notifications, PICO enhancements, dark mode polish, export system.
- Complete RLS policies migration for all tables including `protocol_dataset_links` and `activity_logs`.
- Review email display in collaboration UI.

### Changed

- Renamed `middleware.ts` to `proxy.ts` (Next.js 16 convention).
- Updated dependencies for Next.js 16 compatibility.

---

## 2026-01-20

### Added

- Scientific Database Integration MVP: PubMed search/import, DOI/PMID quick import (CrossRef), and ClinicalTrials.gov search/import.
- Evidence import dialog with previews and auto-tagging based on keywords.
- Server-side API routes for external searches and imports.
- Evidence validation updates for external identifiers.

### Database

- Optional migration: `supabase/migrations/20260120_add_external_fields_to_evidence.sql`
  adds `external_id`, `external_source`, and `imported_at` fields.

### Configuration

- `NCBI_API_KEY` (optional, for higher PubMed rate limits).
