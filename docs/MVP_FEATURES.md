# VaxEvidence MVP: Vision, Features and Workflow

## Core Mission and Goals
Our mission is to **accelerate vaccine research and evidence-based policy making** by providing a unified, collaborative platform for protocol design and evidence management. We aim to:
- **Centralize** the research lifecycle from initial question to final report.
- **Streamline** evidence gathering with automated scientific database integrations.
- **Enable** secure, threaded collaboration for multi-disciplinary research teams.
- **Produce** professional, compliance-ready documentation for regulatory stakeholders.

## Visioned Product-Market Fit (PMF)
VaxEvidence achieves PMF by addressing the specific pain points of vaccine researchers, policy advisors, and regulators:
- **Researchers:** Eliminates manual data entry and fragmented collaboration (email/Word).
- **Regulators:** Provides clear, versioned, and audited protocols with direct links to supporting evidence.
- **Organizations:** Standardizes protocol quality and maintains a persistent, searchable knowledge base.

**The "PMF Gap":** While we have built a powerful foundation, reaching full PMF requires:
1. **Administrative and Team Controls:** Enabling institutional-wide adoption and workspace management.
2. **Audit Trails:** Satisfying formal regulatory requirements (e.g., FDA 21 CFR Part 11).
3. **Advanced Analytics:** Providing unique insights (gap analysis, safety signals) that generic tools cannot offer.

---

## Current Technical Implementation (Built MVP)

### 1. Foundation and Security
- **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Storage).
- **Authentication:** Email OTP-based secure sign-in/up with protected route middleware.
- **Security:** Row-Level Security (RLS) on all database tables ensures data isolation and secure team sharing.

### 2. Protocol Builder (PICO Framework)
- **Feature:** Create, edit, and manage study protocols using the **PICO** (Population, Intervention, Comparator, Outcomes) framework.
- **Workflow:** Researchers define study parameters, track status (Draft, In Review, Final), and link protocols to relevant evidence items and datasets.

### 3. Evidence Library and Scientific Integrations
- **Multi-Type Support:** Manage Academic Papers, Regulatory Documents, Datasets, and Notes.
- **PubMed Integration:** Search 30M+ articles directly within the app; one-click import with full metadata (Title, Authors, Abstract, DOI).
- **DOI/PMID Import:** Quick-import by pasting identifiers via CrossRef and NCBI APIs.
- **ClinicalTrials.gov:** Search and import vaccine trial data (NCT numbers, sponsors, phases, status).
- **Auto-Tagging:** Keyword-based tagging and categorization automatically applied on import.

### 4. Dataset Upload and Analysis
- **Storage:** Integrated with Supabase Storage for secure management of CSV/Excel research data.
- **Preview:** Instant data preview (first 50 rows) and metadata management (size, date range, headers).
- **Integration:** Link raw datasets directly to protocol contexts for a complete research package.

### 5. Collaboration and Review System
- **Threaded Comments:** In-line discussions on protocols, evidence items, and datasets.
- **Review Workflows:** Formal "Request -> Approve / Reject / Request Changes" flow with notification badges.
- **Activity Feed:** Real-time logging of all actions (edits, comments, reviews) using database triggers and a dedicated activity page.

### 6. Reporting and Export System
- **Protocol Export:** Professional PDF and Word documents with automated formatting and branding.
- **Bibliographies:** Generate citations in APA, MLA, BibTeX, and RIS formats for research manuscripts.
- **Activity Logs:** Compliance-ready CSV/PDF logs of all system activity for audit purposes.
- **Bulk Workspace Export:** ZIP archives containing all user data (JSON/CSV/PDF) for full data portability.

---

## The MVP Workflow
1. **BUILD:** Start with a protocol, defining the research question via the PICO framework.
2. **GATHER:** Use PubMed and ClinicalTrials integrations to populate the Evidence Library with minimal effort.
3. **ANALYZE:** Upload raw datasets and link them to the protocol context.
4. **COLLABORATE:** Invite team members to comment and formally approve the research design.
5. **EXPORT:** Generate the final protocol report and bibliography for regulatory submission or publication.

---

## Future Work and Roadmap

### Phase 3: Admin Dashboard and Team Management
- Institutional user roles (Admin, Researcher, Reviewer, Viewer).
- Team-based workspaces and member invitation system.
- Usage analytics and organization-level dashboards.

### Phase 4: Audit Trails and Compliance
- Tamper-proof logs for regulatory compliance (FDA/EMA standards).
- Full version history and "Time Machine" rollback for protocols.
- Digital signatures and timestamping for approvals.

### Phase 5: Advanced Analytics and AI Insights
- AI-powered summaries of research papers and evidence gap analysis.
- Citation network visualizations and safety signal detection.
- Automated protocol quality scoring against standard checklists (e.g., CONSORT).

### Phase 6: Real-time Collaboration
- Google Docs style live editing and presence indicators for protocol building.
- WebSocket-based real-time notification system.
