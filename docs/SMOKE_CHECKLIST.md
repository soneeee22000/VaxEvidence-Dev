# MVP Smoke Checklist

Use this checklist to validate the end-to-end MVP workflow after deployments.

## Setup

- [ ] Set `.env.local` with Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Set `NCBI_API_KEY` (optional but recommended for PubMed).
- [ ] Apply all migrations in `supabase/migrations/` in order.
- [ ] Run `pnpm build` — should complete without errors.

## Authentication

- [ ] Landing page loads at `/`.
- [ ] Clicking "Sign In" redirects to `/auth`.
- [ ] Login with email OTP works and redirects to `/app`.
- [ ] Unauthenticated access to `/app/*` redirects to `/auth`.
- [ ] Sign out works and redirects to landing page.

## Protocols

- [ ] Create a new protocol with PICO fields.
- [ ] Edit an existing protocol; changes persist after reload.
- [ ] Delete a protocol from the dashboard.
- [ ] Protocol status transitions (draft, in_review, final) work.
- [ ] Protocol templates load and pre-fill PICO fields.

## Evidence Library + Scientific Databases

- [ ] PubMed search returns results for a query (e.g., "COVID-19 vaccine efficacy").
- [ ] Import a PubMed result; confirm title, authors, journal, DOI/PMID fields populated.
- [ ] DOI quick import with a valid DOI populates preview and imports successfully.
- [ ] PMID quick import with a valid PMID imports successfully.
- [ ] ClinicalTrials search returns results and imports an evidence item.
- [ ] Auto-tagging adds sensible tags based on title/abstract keywords.
- [ ] Evidence Library list loads and filters work (type, tags, search).
- [ ] Evidence creation/editing still works for manual entries.
- [ ] Link evidence items to a protocol.

## Datasets

- [ ] Upload a CSV file; preview shows first 50 rows.
- [ ] Dataset metadata (type, size, date range) is correct.
- [ ] Link a dataset to a protocol.
- [ ] Dataset search and filtering works.

## Collaboration

- [ ] Add a comment on a protocol; verify it appears.
- [ ] Edit and delete own comments.
- [ ] Request a review on a protocol.
- [ ] Approve/reject/request changes on a review.
- [ ] Activity feed shows recent actions.

## Reporting & Export

- [ ] Export protocol as PDF (professional template) — downloads `.pdf`.
- [ ] Export protocol as Word — downloads `.docx`.
- [ ] Export bibliography in APA format — downloads `.txt`.
- [ ] Export bibliography in BibTeX format — downloads `.bib`.
- [ ] Export activity log as CSV — downloads `.csv` (empty CSV with headers if no logs).
- [ ] Export activity log as PDF — downloads `.pdf` (valid PDF even if no logs).
- [ ] Export workspace as ZIP — downloads `.zip` with protocols, evidence, datasets.
- [ ] All export routes return 401 when not authenticated (test with cleared cookies).

## Regression Checks

- [ ] Dashboard loads without errors.
- [ ] Activity page loads without errors.
- [ ] Dark mode toggle works.
- [ ] Mobile responsive layout renders correctly.
- [ ] No console errors on any page.
