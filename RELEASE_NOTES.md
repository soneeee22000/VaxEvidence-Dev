# Release Notes

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
