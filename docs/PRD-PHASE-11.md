# PRD — Phase 11: Regulatory Submission Packages

## Problem Statement

Vaccine researchers spend **weeks manually assembling** regulatory submission documents for FDA (IND/BLA) and EMA (eCTD) filings. They copy-paste protocol data into templates, manually cross-reference evidence, and track reporting checklists in spreadsheets. A single IND submission can cost **$50K+ in regulatory consulting fees** just for document preparation.

VaxEvidence already holds all the raw materials — PICO protocols, evidence libraries, screening decisions, risk-of-bias assessments, meta-analysis data, and audit trails. Phase 11 transforms this data into **regulatory-ready submission packages** with one click.

## Target Users

- **Regulatory Affairs Specialists** at pharma/biotech companies preparing FDA/EMA filings
- **Principal Investigators** at academic medical centers submitting sponsor-investigator INDs
- **Clinical Research Organizations (CROs)** preparing submission packages for sponsors

## Core User Flow

> A researcher finalizes a protocol in VaxEvidence, links all supporting evidence, completes screening and risk-of-bias assessments, then clicks **"Generate FDA IND Package"** from the protocol detail page. The system auto-populates all available sections from existing data, marks incomplete sections, and exports a structured PDF + Word package ready for regulatory review.

---

## User Stories

### Story 1: FDA IND Package Generation (Sessions 1-2)

**As a** regulatory affairs specialist,
**I want to** generate a structured FDA IND submission package from my protocol,
**So that** I can submit to FDA without manually assembling documents.

**Acceptance Criteria:**

- **Given** a protocol with status "final" and linked evidence,
  **When** I click "Generate IND Package" from the protocol export menu,
  **Then** the system generates a PDF + Word document with all 10 IND sections (21 CFR 312.23).

- **Given** the protocol has PICO fields populated,
  **When** the IND package is generated,
  **Then** sections (a)(3) Introductory Statement, (a)(5) Clinical Protocol, and (a)(8) Previous Human Experience are auto-populated from protocol + evidence data.

- **Given** some IND sections lack sufficient data (e.g., CMC, Toxicology),
  **When** the package is generated,
  **Then** those sections contain structured template headers with `[TO BE COMPLETED]` placeholders and guidance text explaining what's needed.

- **Given** the protocol has linked evidence items,
  **When** the IND package is generated,
  **Then** Section (a)(8) Previous Human Experience contains a formatted evidence summary table with citations.

**Implementation Details:**

IND package sections and auto-population mapping:

| IND Section | Title                                                 | Auto-Populate From                                         |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Cover page  | Form FDA-1571 fields                                  | Protocol metadata (title, status, dates, ID)               |
| (a)(2)      | Table of Contents                                     | Auto-generated from document structure                     |
| (a)(3)      | Introductory Statement & General Investigational Plan | Protocol: study_question, design, population, intervention |
| (a)(4)      | Investigator's Brochure outline                       | Template with evidence summary                             |
| (a)(5)      | Clinical Protocol                                     | Full PICO fields + study design + outcomes                 |
| (a)(6)      | Chemistry, Manufacturing, and Controls                | Template only (no CMC data in VaxEvidence)                 |
| (a)(7)      | Pharmacology and Toxicology                           | Template only                                              |
| (a)(8)      | Previous Human Experience                             | Evidence library items (academic papers, regulatory docs)  |
| (a)(9)      | Additional Information                                | Template only                                              |
| (a)(10)     | Relevant Information                                  | Risk-of-bias summary, meta-analysis summary if available   |

**Tasks:**

1. Create `lib/export/ind-package-generator.ts` — PDF generation with jsPDF
2. Create `lib/export/ind-word-generator.ts` — Word generation with docx
3. Create `lib/regulatory/ind-sections.ts` — Section definitions, labels, guidance text
4. Create API route `app/api/export/protocol/[id]/ind/route.ts` (PDF)
5. Create API route `app/api/export/protocol/[id]/ind/word/route.ts` (Word)
6. Add "IND Package" option to protocol export menu in `components/export/`
7. Create `components/regulatory/ind-package-dialog.tsx` — Pre-generation dialog showing section completeness

---

### Story 2: CONSORT/STROBE Checklist Enforcement (Session 2-3)

**As a** researcher preparing a manuscript,
**I want to** track CONSORT (RCT) or STROBE (observational) checklist compliance,
**So that** my submission meets reporting guideline requirements.

**Acceptance Criteria:**

- **Given** a protocol with design type "RCT",
  **When** I open the regulatory checklist page,
  **Then** I see the CONSORT 2010 checklist (25 items with sub-items, ~37 total).

- **Given** a protocol with design type "cohort", "case-control", or "cross-sectional",
  **When** I open the regulatory checklist page,
  **Then** I see the STROBE checklist (22 items) with study-type-specific variants for items 6, 12, 14, 15.

- **Given** the protocol has PICO fields populated,
  **When** the checklist loads,
  **Then** items mappable from PICO are pre-filled:
  - Objectives (CONSORT 2b / STROBE 3) ← study_question
  - Participants/Eligibility (CONSORT 4a / STROBE 6) ← population
  - Interventions (CONSORT 5) ← intervention + comparator
  - Outcomes (CONSORT 6a / STROBE 7) ← outcomes
  - Study design (CONSORT 3a / STROBE 4) ← design

- **Given** I complete checklist items and save,
  **When** I return later,
  **Then** my progress is persisted and a completion percentage is shown.

- **Given** a completed checklist,
  **When** I click "Export Checklist",
  **Then** a PDF/Word is generated with all items, statuses, and notes.

**Implementation Details:**

New database table: `reporting_checklists`

```sql
CREATE TABLE reporting_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('consort', 'strobe_cohort', 'strobe_case_control', 'strobe_cross_sectional')),
  items JSONB NOT NULL DEFAULT '{}',
  -- items structure: { "1a": { "status": "complete"|"incomplete"|"na", "notes": "...", "manuscript_ref": "p.3, para 2" } }
  completion_pct NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(protocol_id, checklist_type)
);
```

**Tasks:**

1. Create migration for `reporting_checklists` table with RLS
2. Create `lib/regulatory/consort-checklist.ts` — Full 25-item CONSORT definition with sub-items
3. Create `lib/regulatory/strobe-checklist.ts` — Full 22-item STROBE definition with variants
4. Create `lib/supabase/reporting-checklists.ts` — CRUD module
5. Create `lib/validators/reporting-checklist.ts` — Zod schema
6. Create `components/regulatory/checklist-page.tsx` — Interactive checklist UI
7. Create `components/regulatory/checklist-item.tsx` — Individual item with status toggle, notes, manuscript ref
8. Create `components/regulatory/checklist-progress.tsx` — Completion progress bar
9. Create API route `app/api/reporting-checklist/route.ts` — CRUD endpoints
10. Create `lib/export/checklist-pdf-generator.ts` — Checklist export
11. Add "Reporting Checklists" tab/section to protocol detail page
12. Add Zod query key factories for reporting checklists

---

### Story 3: ICH E6(R2) GCP Compliance Tracker (Session 3)

**As a** clinical research coordinator,
**I want to** track GCP compliance requirements for my protocol,
**So that** I can demonstrate adherence to ICH E6(R2) during audits.

**Acceptance Criteria:**

- **Given** a protocol,
  **When** I open the GCP compliance section,
  **Then** I see 3 compliance modules:
  1. **13 GCP Principles** — Yes/No/Partial checklist with justification fields
  2. **Protocol Section Mapping** (ICH 6.1-6.16) — Shows which GCP protocol sections are addressed by the VaxEvidence protocol data, with completeness indicators
  3. **Essential Documents Tracker** (ICH Section 8) — Checklist of ~50 documents needed before/during/after trial with upload status

- **Given** the protocol has PICO and design fields,
  **When** the GCP Protocol Mapping loads,
  **Then** sections 6.3 (Objectives), 6.5 (Subject Selection), 6.6 (Treatment), 6.7 (Efficacy Assessment), 6.8 (Safety Assessment) show auto-populated content from PICO.

- **Given** I update GCP compliance items,
  **When** I save,
  **Then** an overall GCP compliance score is computed and displayed.

**Implementation Details:**

New database table: `gcp_compliance`

```sql
CREATE TABLE gcp_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  principles JSONB NOT NULL DEFAULT '{}',
  -- { "principle_1": { "status": "yes"|"no"|"partial", "justification": "..." }, ... }
  protocol_sections JSONB NOT NULL DEFAULT '{}',
  -- { "6.1": { "status": "complete"|"incomplete"|"na", "notes": "..." }, ... }
  essential_documents JSONB NOT NULL DEFAULT '{}',
  -- { "irb_approval": { "status": "uploaded"|"pending"|"na", "file_name": "...", "date": "..." }, ... }
  compliance_score NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(protocol_id)
);
```

**Tasks:**

1. Create migration for `gcp_compliance` table with RLS
2. Create `lib/regulatory/gcp-principles.ts` — 13 GCP principle definitions
3. Create `lib/regulatory/gcp-protocol-sections.ts` — ICH 6.1-6.16 section definitions with PICO mapping
4. Create `lib/regulatory/gcp-essential-documents.ts` — ~50 document checklist (before/during/after trial)
5. Create `lib/supabase/gcp-compliance.ts` — CRUD module
6. Create `lib/validators/gcp-compliance.ts` — Zod schema
7. Create `components/regulatory/gcp-principles-panel.tsx` — 13-principle checklist
8. Create `components/regulatory/gcp-protocol-mapping.tsx` — Section mapping with auto-populate
9. Create `components/regulatory/gcp-documents-tracker.tsx` — Essential documents checklist
10. Create `components/regulatory/gcp-compliance-score.tsx` — Overall score display
11. Create API route `app/api/gcp-compliance/route.ts`
12. Add "GCP Compliance" tab to protocol regulatory section

---

### Story 4: eCTD Module 5 Structure & Clinical Study Report Template (Session 4)

**As a** regulatory affairs specialist preparing an EMA submission,
**I want to** generate an eCTD Module 5-structured Clinical Study Report outline,
**So that** I have the correct document structure for European submissions.

**Acceptance Criteria:**

- **Given** a protocol with completed systematic review data,
  **When** I click "Generate eCTD Module 5 Outline",
  **Then** the system generates a structured document following the eCTD Module 5 hierarchy (5.1 through 5.4).

- **Given** the protocol has screening decisions and meta-analysis data,
  **When** the Module 5 document is generated,
  **Then** Section 5.2 (Tabular Listing of Clinical Studies) is auto-populated from screening pipeline data (included studies with metadata).

- **Given** the protocol has risk-of-bias assessments,
  **When** the document is generated,
  **Then** the Clinical Study Report sections include RoB summary tables.

- **Given** the protocol has meta-analysis entries,
  **When** the document is generated,
  **Then** Section 5.3.5.3 (Analyses of Data from More Than One Study) includes summary statistics.

**Implementation Details:**

| eCTD Section                      | Auto-Populate From                                     |
| --------------------------------- | ------------------------------------------------------ |
| 5.2 Tabular Listing               | Screening pipeline → included studies                  |
| 5.3.5.1 Controlled Studies        | Evidence items (type=academic, RCTs) with PICO mapping |
| 5.3.5.2 Uncontrolled Studies      | Evidence items (observational)                         |
| 5.3.5.3 Multi-Study Analysis      | Meta-analysis entries + forest plot summary            |
| 5.4 Literature References         | Evidence library → bibliography                        |
| Clinical Study Report (per study) | Protocol PICO + RoB assessment + screening status      |

**Tasks:**

1. Create `lib/regulatory/ectd-module5-structure.ts` — Full Module 5 hierarchy definition
2. Create `lib/export/ectd-pdf-generator.ts` — eCTD Module 5 PDF generation
3. Create `lib/export/ectd-word-generator.ts` — eCTD Module 5 Word generation
4. Create API route `app/api/export/protocol/[id]/ectd/route.ts`
5. Create API route `app/api/export/protocol/[id]/ectd/word/route.ts`
6. Add "eCTD Module 5" option to export menu
7. Create `components/regulatory/ectd-preview-dialog.tsx` — Preview sections before export

---

### Story 5: CDISC/SDTM Dataset Templates (Session 5)

**As a** data manager,
**I want to** generate CDISC/SDTM-compliant dataset templates from my protocol,
**So that** my clinical data is structured for FDA submission from day one.

**Acceptance Criteria:**

- **Given** a protocol with PICO fields,
  **When** I click "Generate SDTM Templates",
  **Then** the system generates CSV templates for Trial Design domains:
  - TS (Trial Summary) — auto-populated from protocol metadata
  - TA (Trial Arms) — from PICO intervention/comparator
  - TE (Trial Elements) — from study design
  - TI (Trial Inclusion/Exclusion) — from PICO population
  - TV (Trial Visits) — template with standard visit structure

- **Given** the generated templates,
  **When** I download them,
  **Then** each CSV has correct SDTM variable names, types, and required columns per CDISC v3.3 specification.

- **Given** the protocol is vaccine-related,
  **When** templates are generated,
  **Then** vaccine-specific domains are included: IS (Immunogenicity Specimen), FA (Findings About — solicited reactions).

- **Given** I download the SDTM package,
  **When** I open the ZIP,
  **Then** it contains: CSV templates per domain, a `define.csv` data dictionary, and a `README.txt` mapping guide.

**Implementation Details:**

| SDTM Domain                    | Auto-Populate From                                          |
| ------------------------------ | ----------------------------------------------------------- |
| TS (Trial Summary)             | Protocol: title, study_question, design, status, dates      |
| TA (Trial Arms)                | PICO: intervention, comparator → 2+ arms                    |
| TE (Trial Elements)            | Design: screening, treatment, follow-up elements            |
| TI (Trial Inclusion/Exclusion) | PICO: population criteria (parsed into individual criteria) |
| TV (Trial Visits)              | Template: Screening, Baseline, Treatment visits, Follow-up  |
| DM (Demographics)              | Empty template with correct columns                         |
| AE (Adverse Events)            | Empty template with correct columns                         |
| EX (Exposure)                  | Empty template with correct columns                         |
| IS (Immunogenicity)            | Empty template with vaccine-specific columns                |
| LB (Laboratory)                | Empty template with correct columns                         |

**Tasks:**

1. Create `lib/regulatory/sdtm-domains.ts` — Domain definitions with variable specs
2. Create `lib/regulatory/sdtm-trial-design.ts` — Trial design domain auto-population logic
3. Create `lib/export/sdtm-csv-generator.ts` — CSV generation per domain
4. Create `lib/export/sdtm-package-generator.ts` — ZIP bundle with all templates + define + README
5. Create API route `app/api/export/protocol/[id]/sdtm/route.ts`
6. Add "SDTM Templates" option to export menu
7. Create `components/regulatory/sdtm-preview-dialog.tsx` — Domain selection + preview

---

## Technical Architecture

### New Directory Structure

```
lib/
├── regulatory/                      # Regulatory framework definitions (NEW)
│   ├── ind-sections.ts              # IND (a)(1)-(a)(10) section definitions
│   ├── ectd-module5-structure.ts    # eCTD Module 5 hierarchy
│   ├── consort-checklist.ts         # CONSORT 2010 items (37 sub-items)
│   ├── strobe-checklist.ts          # STROBE items (22 items, 3 variants)
│   ├── gcp-principles.ts           # ICH E6(R2) 13 principles
│   ├── gcp-protocol-sections.ts    # ICH 6.1-6.16 protocol sections
│   ├── gcp-essential-documents.ts  # ~50 essential documents
│   ├── sdtm-domains.ts             # SDTM domain/variable definitions
│   └── sdtm-trial-design.ts        # Trial design auto-population

lib/export/
│   ├── ind-package-generator.ts     # IND PDF (jsPDF)
│   ├── ind-word-generator.ts        # IND Word (docx)
│   ├── ectd-pdf-generator.ts        # eCTD Module 5 PDF
│   ├── ectd-word-generator.ts       # eCTD Module 5 Word
│   ├── checklist-pdf-generator.ts   # CONSORT/STROBE checklist PDF
│   ├── sdtm-csv-generator.ts       # SDTM CSV per domain
│   └── sdtm-package-generator.ts   # SDTM ZIP bundle

lib/supabase/
│   ├── reporting-checklists.ts      # Reporting checklist CRUD
│   └── gcp-compliance.ts           # GCP compliance CRUD

lib/validators/
│   ├── reporting-checklist.ts       # Zod schema
│   └── gcp-compliance.ts           # Zod schema

components/regulatory/               # All regulatory UI components (NEW)
│   ├── regulatory-hub.tsx           # Main regulatory tab content
│   ├── ind-package-dialog.tsx       # IND pre-generation dialog
│   ├── ectd-preview-dialog.tsx      # eCTD preview dialog
│   ├── checklist-page.tsx           # CONSORT/STROBE interactive checklist
│   ├── checklist-item.tsx           # Single checklist item
│   ├── checklist-progress.tsx       # Completion progress bar
│   ├── gcp-principles-panel.tsx     # 13 GCP principles
│   ├── gcp-protocol-mapping.tsx     # ICH 6.1-6.16 mapping
│   ├── gcp-documents-tracker.tsx    # Essential documents
│   ├── gcp-compliance-score.tsx     # Overall GCP score
│   ├── sdtm-preview-dialog.tsx      # SDTM domain selection
│   └── section-completeness.tsx     # Reusable completeness indicator

app/api/export/protocol/[id]/
│   ├── ind/route.ts                 # IND PDF export
│   ├── ind/word/route.ts            # IND Word export
│   ├── ectd/route.ts               # eCTD PDF export
│   ├── ectd/word/route.ts          # eCTD Word export
│   └── sdtm/route.ts               # SDTM ZIP export

app/api/
│   ├── reporting-checklist/route.ts # Checklist CRUD
│   └── gcp-compliance/route.ts      # GCP compliance CRUD

app/app/[id]/regulatory/             # Regulatory page (NEW)
│   └── page.tsx                     # Regulatory hub page
```

### Data Flow

```
Protocol (PICO) ──┐
Evidence Library ──┤
Screening Data ────┤──→ Regulatory Data Aggregator ──→ PDF/Word Generator ──→ Download
RoB Assessments ───┤                                        ↑
Meta-Analysis ─────┤                              Template Definitions
Activity Logs ─────┘                            (lib/regulatory/*.ts)
```

### Reuse from Existing Infrastructure

| Existing Pattern                       | Reused In                              |
| -------------------------------------- | -------------------------------------- |
| `generateProtocolPDF()` page layout    | IND/eCTD PDF generators                |
| `generateProtocolWord()` structure     | IND/eCTD Word generators               |
| `generateWorkspaceArchive()` ZIP       | SDTM package bundling                  |
| `generateBibliography()` citations     | eCTD Section 5.4 literature references |
| `generateComplianceReport()` structure | GCP compliance report export           |
| Export API route auth pattern          | All new API routes                     |
| `checkPageBreak()` helper              | All PDF generators                     |
| Export dialog pattern                  | All regulatory dialogs                 |

---

## Database Changes

### New Tables

1. **`reporting_checklists`** — CONSORT/STROBE checklist progress (Story 2)
2. **`gcp_compliance`** — GCP compliance tracking (Story 3)

### RLS Policies

Both tables follow the existing open-policy pattern:

- SELECT: authenticated users
- INSERT: authenticated users
- UPDATE: authenticated users
- DELETE: authenticated users

(Future: restrict to protocol owner/team members when RBAC is enforced)

---

## Edge Cases

| Scenario                                              | Handling                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Protocol has no linked evidence                       | IND (a)(8) shows "No previous human experience data linked" with template guidance                                              |
| Protocol has no screening data                        | eCTD 5.2 tabular listing shows placeholder row                                                                                  |
| Protocol design doesn't match checklist type          | Auto-detect: if design contains "RCT"/"randomized" → CONSORT, else → STROBE                                                     |
| User switches checklist type after partial completion | Confirm dialog: "Switching will reset progress. Continue?"                                                                      |
| Very long evidence list (100+ items)                  | Paginate evidence table in IND (a)(8), truncate at 50 per page in PDF                                                           |
| Missing PICO fields                                   | Section shows `[TO BE COMPLETED — requires {field_name}]` with red indicator                                                    |
| Export while protocol is "draft"                      | Warning: "This protocol is in draft status. Regulatory submissions typically require finalized protocols." Allow export anyway. |
| Concurrent checklist edits (real-time)                | Last-write-wins (consistent with Phase 10 pattern). Future: Yjs on checklist items.                                             |

---

## Build Milestones

### Milestone 1: FDA IND Package (Sessions 1-2)

**Quality Gate:** IND PDF + Word export works for a protocol with evidence, all 10 sections present, auto-populated fields correct.

**Deliverables:**

- `lib/regulatory/ind-sections.ts`
- `lib/export/ind-package-generator.ts`
- `lib/export/ind-word-generator.ts`
- API routes for IND PDF + Word
- Export menu integration
- IND package dialog with completeness preview

### Milestone 2: Checklists + GCP (Sessions 2-3)

**Quality Gate:** CONSORT and STROBE checklists persist, auto-populate from PICO, export to PDF. GCP compliance tracker with 13 principles + protocol mapping + essential documents.

**Deliverables:**

- 2 migrations (reporting_checklists, gcp_compliance)
- CONSORT/STROBE definitions + UI
- GCP compliance definitions + UI
- Checklist export
- Regulatory hub page (`/app/[id]/regulatory`)

### Milestone 3: eCTD + SDTM (Sessions 4-5)

**Quality Gate:** eCTD Module 5 PDF/Word exports with auto-populated sections. SDTM ZIP bundle with trial design datasets and empty domain templates.

**Deliverables:**

- eCTD Module 5 structure + generators
- SDTM domain definitions + CSV generators + ZIP bundler
- All API routes
- Full regulatory hub with all 5 features accessible

---

## Out of Scope

- **SAS XPT format** — SDTM exports as CSV (not the FDA-required XPT binary format). XPT generation requires specialized libraries not available in the JS ecosystem. Users can convert CSV → XPT using SAS or R.
- **eCTD XML backbone** — We generate the document content, not the eCTD XML submission structure. That requires specialized eCTD publishing software (e.g., Lorenz docuBridge, EXTEDO).
- **FDA ESG (Electronic Submissions Gateway)** — No direct submission to FDA. Users download packages and submit through their existing channels.
- **Form FDA-1571 / 1572 / 3674** — We don't generate fillable PDF forms. We provide the content that goes into these forms.
- **CDISC ADaM (Analysis Data Model)** — Only SDTM (tabulation) datasets, not ADaM (analysis) datasets.
- **Real CMC/Toxicology data** — These sections are templates only. VaxEvidence doesn't store manufacturing or animal study data.
- **Digital signing of regulatory packages** — Phase 4 digital signatures apply to protocols, not regulatory packages.
- **Multi-language support** — All templates in English only.

---

## Testing Strategy

- **Unit tests** for all regulatory definition files (correct item counts, valid structures)
- **Unit tests** for all generators (given mock data, produces valid PDF/Word/CSV output)
- **Integration tests** for all API routes (auth, data fetching, response format)
- **Manual QA** for PDF/Word visual accuracy against real FDA/EMA templates
- **Edge case tests** for missing data scenarios (empty PICO, no evidence, no screening)

---

_Phase 11 PRD v1.0 — VaxEvidence Regulatory Submission Packages_
