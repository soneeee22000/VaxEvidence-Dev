# MVP Smoke Checklist

Use this checklist to validate the end-to-end MVP workflow after deployments.

## Setup
- [ ] Set `.env.local` with `NCBI_API_KEY` (optional but recommended).
- [ ] Apply `supabase/migrations/20260120_add_external_fields_to_evidence.sql` if tracking external IDs.

## Evidence Library + Scientific Databases
- [ ] PubMed search returns results for a query (e.g., "COVID-19 vaccine efficacy").
- [ ] Import a PubMed result; confirm title, authors, journal, DOI/PMID fields populated.
- [ ] DOI quick import with a valid DOI populates preview and imports successfully.
- [ ] PMID quick import with a valid PMID imports successfully.
- [ ] ClinicalTrials search returns results and imports an evidence item.
- [ ] Auto-tagging adds sensible tags based on title/abstract keywords.
- [ ] Imported items show `external_source` and `external_id` where applicable.

## Protocols + Collaboration
- [ ] Create a new protocol with PICO fields.
- [ ] Link evidence items to the protocol.
- [ ] Add comments and reviews; verify they appear in the protocol view.

## Reporting & Export
- [ ] Export protocol as PDF (professional template).
- [ ] Export protocol as Word.
- [ ] Export bibliography in APA or BibTeX.
- [ ] Export activity log as CSV and PDF.
- [ ] Export workspace as ZIP (complete archive and JSON-only).

## Regression Checks
- [ ] Evidence Library list loads and filters work.
- [ ] Evidence creation/editing still works for manual entries.
- [ ] Dashboard and activity pages load without errors.
