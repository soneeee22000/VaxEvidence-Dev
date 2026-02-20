# Release Notes

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
