# Release Notes

## 2026-02-22

### Added — Phase 10: Real-Time Collaboration

- **Live Presence**: Stacked collaborator avatar circles in the protocol header showing who's currently viewing. Deterministic OKLCH color assignment per user with email tooltips.
- **Field-Level Cursors**: Colored `ring-2` border and floating name pill around PICO form fields when another user is editing that field. All 8 protocol fields wrapped with `FieldPresenceIndicator`.
- **Yjs CRDT Protocol Editing**: Simultaneous editing of PICO fields across browser tabs/users using Yjs `Y.Map<string>` with field-level last-writer-wins. Custom `SupabaseYjsProvider` transports Yjs updates via Supabase Broadcast (base64 encoded). `YjsFormBridge` provides bidirectional sync between Yjs and react-hook-form with origin tracking to prevent infinite loops.
- **Late Joiner Sync**: New users broadcast `request-sync`; connected peers respond with full Yjs state via `sync-response`. Form values update automatically.
- **Save Conflict Handling**: After save, broadcaster sends `protocol-saved` event. Other clients reload from DB, re-init Yjs doc, and show toast: "Protocol saved by [user]".
- **Real-Time Comment Sync**: Comments appear instantly for all viewers via `postgres_changes` subscription on the `comments` table, replacing manual refresh.
- **In-App Notifications**: Bell icon in the app header with unread count badge. Popover dropdown showing notification list with mark-as-read and mark-all-read. Real-time unread count updates via `postgres_changes` on `notifications` table. Toast on new @mention.
- **@Mention Autocomplete**: Typing `@` in comment input triggers a user suggestion dropdown (fetched from `profiles` table). Keyboard navigation (arrows, Enter/Tab, Escape). Mentioned users receive in-app notifications.
- **Notification CRUD**: `fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`, `createNotification` in `lib/supabase/notifications.ts`.
- **React Query Keys**: Added `queryKeys.notifications` with `all`, `byUser`, and `unreadCount` factories.

### Database

- 1 new migration:
  - `20260222_create_notifications.sql` — notifications table with `user_id`, `type`, `title`, `body`, `resource_type`, `resource_id`, `protocol_id`, `is_read`, `created_by`. RLS: users SELECT/UPDATE own, any authenticated INSERT. Indexed on `(user_id, is_read, created_at DESC)`. Added to `supabase_realtime` publication.

### Architecture

- Single Supabase Realtime channel per protocol (`protocol:{id}`) carries Presence, Broadcast (Yjs updates, field focus/blur, save events), and postgres_changes (comments).
- Only `yjs` added as new dependency — transport uses existing `@supabase/supabase-js` Realtime.
- `PresenceBridge` pattern connects `usePresence()` context to parent component refs without restructuring the component tree.

---

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
