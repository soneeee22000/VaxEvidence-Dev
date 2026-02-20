# VaxEvidence Product Roadmap

## Vision

Build the **most powerful platform** for vaccine researchers to design protocols, gather evidence, collaborate with teams, and produce regulatory-ready reports. Target: FDA/EMA-compliant workflow used by pharma, biotech, and academic research teams worldwide.

---

## COMPLETED FEATURES (MVP v2.0)

### 1. Foundation

- [x] Marketing landing page with waitlist
- [x] Supabase authentication (email OTP + OAuth)
- [x] Protected routes with proxy middleware (Next.js 16)
- [x] Dev mode with fallback UUID for rapid development
- [x] shadcn/ui component library (~56 primitives)
- [x] Dark mode default with theme toggle
- [x] Responsive design (mobile, tablet, desktop)

### 2. Protocol Builder

- [x] Create, edit, delete study protocols
- [x] PICO framework (Population, Intervention, Comparator, Outcomes)
- [x] Protocol status tracking (draft, in_review, final)
- [x] Protocol templates library
- [x] Dashboard with protocol cards
- [x] Supabase-backed with RLS security

### 3. Evidence Library

- [x] 4 evidence types (academic, regulatory, dataset, note)
- [x] Type-specific forms (authors/DOI for academic, etc.)
- [x] Advanced search and filtering
- [x] Tags and auto-categorization (keyword extraction)
- [x] Link evidence to protocols

### 4. Scientific Database Integration

- [x] PubMed search (NCBI E-utilities API)
- [x] One-click PubMed import with full metadata
- [x] DOI quick import (CrossRef API)
- [x] PMID quick import
- [x] ClinicalTrials.gov search and import
- [x] Auto-tagging from title/abstract keywords

### 5. Dataset Upload & Analysis

- [x] File upload (CSV, Excel) with Supabase Storage
- [x] Data preview (first 50 rows)
- [x] Basic visualizations (recharts)
- [x] Metadata management (type, size, date range)
- [x] Link datasets to protocols
- [x] Search and filtering

### 6. Collaboration & Review System

- [x] Threaded comments on protocols, evidence, datasets
- [x] Review workflows (request, approve, reject, request changes)
- [x] Activity feed with auto-logging
- [x] Review notification badges in navigation
- [x] Edit/delete own comments
- [x] RLS security on all collaboration data

### 7. Reporting & Export

- [x] Protocol export as PDF (3 template styles: professional, academic, regulatory)
- [x] Protocol export as Word (.docx)
- [x] Bibliography export (APA, MLA, Chicago, BibTeX, RIS)
- [x] Activity audit log export (CSV and PDF)
- [x] Workspace bulk export (ZIP archive with JSON/CSV/PDF)
- [x] Server-side export with admin client (auth-gated)

**Database**: 9+ tables, RLS enabled on all tables, 6 migrations applied

---

## NEXT UP: Planned Features

### Phase 3: Multi-Tenant Teams & RBAC (Next to Build)

**Status**: Not Yet Started

**Why**: Without teams, no organization will pay. This is the #1 blocker for monetization.

**Features**:

- Workspaces with invite-by-email
- User roles: Admin, Lead Researcher, Reviewer, View-only
- Per-workspace data isolation
- Team member management UI
- Role-based access on protocols, evidence, datasets

---

### Phase 4: Protocol Versioning & Audit Trail

**Status**: Not Yet Started

**Why**: Required for 21 CFR Part 11 compliance. No regulated company will adopt without this.

**Features**:

- Immutable version history for every protocol edit
- Side-by-side diff view between versions
- Digital signatures on finalized protocols
- Compliance reports (21 CFR Part 11 ready)
- Tamper-proof audit logs with timestamps

---

### Phase 5: Pagination, Search & Performance

**Status**: Not Yet Started

**Why**: Current architecture loads all items at once. Breaks at 500+ records.

**Features**:

- Server-side pagination on evidence library, datasets, protocols
- Full-text search using PostgreSQL `tsvector`
- Debounced search with instant results
- Caching layer (React Query or SWR)
- Infinite scroll or paginated tables

---

### Phase 6: Test Suite & CI Pipeline

**Status**: Not Yet Started

**Why**: Zero tests currently. Technical debt compounds with every feature.

**Features**:

- Unit tests for CRUD modules and validators (vitest)
- Integration tests for all API routes
- E2E tests for critical flows (Playwright)
- GitHub Actions CI pipeline (lint + test + build)
- Minimum 80% coverage on critical paths

---

### Phase 7: AI Research Assistant

**Status**: Not Yet Started

**Why**: The differentiator. No competitor has AI-powered protocol design + evidence synthesis.

**Features**:

- Auto-generate PICO from a research question
- Summarize linked evidence into literature review drafts
- Evidence gap analysis ("You have 12 RCTs but no safety data from X population")
- Smart paper recommendations based on protocol context
- Auto-categorize and quality-score imported papers

---

### Phase 8: Systematic Review Workflow (PRISMA)

**Status**: Not Yet Started

**Why**: This is what researchers actually do for publications. Covidence charges $240-$6K/yr for this.

**Features**:

- PRISMA flow diagram (auto-generated from screening data)
- Screening pipeline: Identify, Screen, Eligibility, Included
- Duplicate detection across imported papers
- Risk of Bias assessment tools (RoB 2, ROBINS-I)
- Forest plots for meta-analysis

---

### Phase 9: Billing & Monetization

**Status**: Not Yet Started

**Why**: Start charging money.

**Features**:

- Stripe integration for subscriptions
- Tiered pricing: Free (1 workspace), Pro ($X/mo), Enterprise (custom)
- Usage limits per tier (protocols, evidence items, exports)
- Billing dashboard and invoice history

---

### Phase 10: Real-Time Collaboration

**Status**: Not Yet Started

**Why**: Modern UX expectation for team tools.

**Features**:

- Live cursors and presence indicators
- Simultaneous protocol editing (Yjs/CRDT)
- @mentions in comments with email notifications
- Supabase Realtime for instant updates
- Slack/Teams webhook integration

---

### Phase 11: Regulatory Submission Packages

**Status**: Not Yet Started

**Why**: This alone is worth $50K+/year per pharma company.

**Features**:

- One-click FDA IND/BLA package generation
- EMA dossier format (eCTD Module 5)
- Auto-populate ICH E6(R2) GCP sections
- CONSORT/STROBE checklist enforcement
- CDISC/SDTM dataset format support

---

### Phase 12: Enterprise & Integrations

**Status**: Not Yet Started

**Why**: Enterprise procurement requirements.

**Features**:

- SSO (SAML/OIDC) for enterprise IT
- Zotero/Mendeley two-way sync
- REDCap data import (clinical trial data)
- Public REST API with API keys and webhooks
- Data residency options (US, EU, APAC)
- SOC 2 Type II / HIPAA compliance

---

## Recommended Build Order

| Priority | Phase | Feature                   | Why Now                       |
| -------- | ----- | ------------------------- | ----------------------------- |
| 1        | 3     | Teams & RBAC              | Can't monetize without it     |
| 2        | 4     | Versioning & Audit Trail  | FDA compliance requirement    |
| 3        | 5     | Pagination & Performance  | Breaks at scale               |
| 4        | 6     | Test Suite & CI           | Technical debt is compounding |
| 5        | 7     | AI Research Assistant     | Core differentiator           |
| 6        | 9     | Billing (Stripe)          | Start generating revenue      |
| 7        | 8     | PRISMA Workflow           | Publication-grade features    |
| 8        | 10    | Real-Time Collaboration   | Modern team UX                |
| 9        | 11    | Regulatory Packages       | Enterprise sales unlock       |
| 10       | 12    | Enterprise & Integrations | Scale to large orgs           |

---

## Competitive Landscape

| Competitor        | Price       | What They Do       | VaxEvidence Advantage                      |
| ----------------- | ----------- | ------------------ | ------------------------------------------ |
| Covidence         | $240-$6K/yr | Systematic review  | AI + protocol builder + exports            |
| DistillerSR       | Enterprise  | Evidence synthesis | 10x cheaper, modern UX                     |
| SWIFT-Review      | Free        | Text mining        | Full end-to-end workflow                   |
| RevMan (Cochrane) | Free        | Meta-analysis      | Protocol design + evidence + collaboration |

**None of them** combine protocol design + evidence management + AI + regulatory export in one platform.

---

_Last Updated: February 20, 2026_
