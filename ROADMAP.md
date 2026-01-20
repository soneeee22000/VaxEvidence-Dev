# VaxEvidence Product Roadmap

## Vision

Build the **most powerful platform** for vaccine researchers to design protocols, gather evidence, collaborate with teams, and produce professional reports.

---

## ✅ **COMPLETED FEATURES** (MVP v1.0)

### 1. **Foundation** ✅
- [x] Marketing landing page with waitlist
- [x] Supabase authentication (email OTP)
- [x] Protected routes with middleware
- [x] Dev mode for rapid development
- [x] Beautiful UI with shadcn/ui components
- [x] Dark mode support
- [x] Responsive design (mobile, tablet, desktop)

### 2. **Protocol Builder** ✅
- [x] Create, edit, delete study protocols
- [x] PICO framework (Population, Intervention, Comparator, Outcomes)
- [x] Protocol status tracking (draft, in_review, final)
- [x] Dashboard with protocol cards
- [x] Supabase-backed with RLS security

### 3. **Evidence Library** ✅
- [x] 4 evidence types (academic, regulatory, dataset, note)
- [x] Type-specific forms (authors/DOI for academic, etc.)
- [x] Advanced search and filtering
- [x] Tags and categorization
- [x] Link evidence to protocols
- [x] Seed data (20 realistic evidence items)

### 4. **Dataset Upload & Analysis** ✅
- [x] File upload (CSV, Excel) with Supabase Storage
- [x] Data preview (first 50 rows)
- [x] Basic visualizations (charts)
- [x] Metadata management (type, size, date range)
- [x] Link datasets to protocols
- [x] Search and filtering
- [x] Seed data (8 sample datasets)

### 5. **Collaboration & Review System** ✅ **(Just Shipped!)**
- [x] Threaded comments on protocols, evidence, datasets
- [x] Review workflows (request, approve, reject, request changes)
- [x] Activity feed with auto-logging
- [x] Review notification badges in navigation
- [x] Edit/delete own comments
- [x] RLS security on all collaboration data
- [x] Database triggers for automatic activity logging

**Database**: 9 tables, 60+ seed items, RLS enabled on all tables

---

## 🚀 **PLANNED FEATURES** (Roadmap)

### **Phase 2: Reporting & Export** (Next to Build!)

**Status**: 📋 **Plan Created** → See `REPORTING_EXPORT_MVP.md`

**Why**: Complete the core workflow (Create → Collaborate → Export)

**Features**:
- Export protocols as PDF/Word documents
- Generate evidence bibliographies (BibTeX, APA, MLA)
- Export activity logs for compliance
- Bulk workspace export (ZIP archive)
- Professional PDF templates with branding

**Estimated Timeline**: 7-10 days

**Dependencies**: `jspdf`, `docx`, `citation-js`

---

### **Phase 3: Admin Dashboard & User Management**

**Status**: 📝 Not Yet Planned

**Why**: Enable team management and workspace administration

**Features**:
- User roles (admin, reviewer, researcher, viewer)
- Team/workspace management
- Invite team members
- Usage analytics dashboard
- Audit trail viewer
- Protocol templates library

**Estimated Timeline**: 5-7 days

---

### **Phase 4: Audit Trails & Compliance Logging**

**Status**: 📝 Not Yet Planned

**Why**: Required for regulatory compliance (FDA, EMA submissions)

**Features**:
- Comprehensive audit logs (who changed what, when)
- Protocol version history
- Change tracking and rollback
- Digital signatures on protocols
- Compliance reports (21 CFR Part 11 ready)
- Tamper-proof logs

**Estimated Timeline**: 3-5 days

---

### **Phase 5: PubMed & Scientific Database Integration** 🌟 **(Game-Changer!)**

**Status**: 📋 **Plan Created** → See `SCIENTIFIC_DATABASE_INTEGRATION_MVP.md`

**Why**: Transform from manual library into powerful research platform

**Features**:
- Search PubMed's 30+ million articles
- One-click import with full metadata
- DOI/PMID quick import
- ClinicalTrials.gov integration
- OpenFDA adverse events data
- Auto-categorization and tagging
- Bulk import from search results

**APIs to Integrate**:
- NCBI E-utilities (PubMed) - FREE
- CrossRef API (DOI metadata) - FREE
- ClinicalTrials.gov API - FREE
- OpenFDA API - FREE

**Estimated Timeline**: 7-10 days

**This Feature Saves**: ~5 minutes per paper × 100 papers = **8+ hours saved per researcher**

---

### **Phase 6: Advanced Analytics & Insights**

**Status**: 📝 Not Yet Planned

**Why**: Help researchers analyze evidence and datasets

**Features**:
- Evidence gap analysis
- Dataset correlation analysis
- AI-powered paper summaries
- Citation network visualization
- Risk/benefit analysis tools
- Meta-analysis support

**Estimated Timeline**: 10-14 days

---

### **Phase 7: Real-time Collaboration**

**Status**: 📝 Not Yet Planned

**Why**: Enable truly collaborative protocol building

**Features**:
- Real-time editing (Google Docs style)
- Live cursors showing who's editing what
- Presence indicators (who's online)
- Real-time comment notifications
- WebSocket-based updates
- Conflict resolution

**Estimated Timeline**: 7-10 days

**Dependencies**: Supabase Realtime, WebSockets

---

## 🎯 **RECOMMENDED BUILD ORDER**

Based on user value and complexity:

### **Immediate Next Steps** (Foundation First)
1. ✅ **Collaboration & Review System** - DONE!
2. 🔨 **Reporting & Export** - Build this next
3. 🔨 **Admin Dashboard** - Essential for teams
4. 🔨 **Audit Trails** - Important for compliance

### **Game-Changers** (After Foundation)
5. 🌟 **PubMed Integration** - Major value add
6. 🌟 **Advanced Analytics** - AI-powered insights
7. 🌟 **Real-time Collaboration** - Modern UX

---

## 📊 **Feature Comparison: Current vs. Vision**

| Feature | Current | With PubMed | With Analytics |
|---------|---------|-------------|----------------|
| Evidence Items | 20 (manual) | Unlimited (PubMed) | + AI summaries |
| Time to Add Paper | 5 min (copy-paste) | 10 sec (click import) | Auto-categorized |
| Citation Export | ❌ | BibTeX/RIS ✅ | + Citation network |
| Clinical Trials | Manual entry | ClinicalTrials.gov ✅ | + Trial comparison |
| Safety Data | Manual | OpenFDA ✅ | + Risk analysis |

---

## 🏆 **Success Metrics**

### Current (MVP v1.0)
- ✅ **6 core features** shipped
- ✅ **9 database tables** with RLS
- ✅ **15 UI components** built
- ✅ **60+ seed items** for testing
- ✅ **2,738 lines of code** in collaboration feature alone

### Goals (MVP v2.0 - After Reporting & Admin)
- 📈 **10 core features** shipped
- 📈 **Export 100+ protocols** as PDFs
- 📈 **5+ team members** per workspace
- 📈 **Full compliance** audit trail

### Goals (MVP v3.0 - With PubMed Integration)
- 🚀 **1,000+ papers** imported per user
- 🚀 **80% time savings** vs. manual entry
- 🚀 **Competitive advantage** over generic tools
- 🚀 **Research-grade** platform ready for publication

---

## 🔮 **Future Vision (Post-MVP)**

### Integration Ecosystem
- Zotero/Mendeley sync
- Google Drive/Dropbox export
- JIRA/Asana integration (for project management)
- Slack/Teams notifications
- REDCap data import (clinical trials)

### AI & Machine Learning
- GPT-powered protocol suggestions
- Automated evidence quality scoring
- Predictive safety signal detection
- Smart paper recommendations
- Auto-generate study sections (Introduction, Methods)

### Regulatory & Compliance
- FDA submission packages
- EMA dossier generation
- CONSORT checklist integration
- ClinicalTrials.gov auto-registration
- Digital signatures and timestamps

### Mobile & Offline
- iOS/Android apps
- Offline mode for field work
- Voice-to-text for comments
- Mobile data collection

---

## 💡 **Strategic Decision: Why Build Reporting Before PubMed?**

### Pros of Reporting First:
✅ **Completes core workflow** (Create → Collaborate → Export)  
✅ **Faster to build** (7 days vs. 10 days)  
✅ **Demonstrates completeness** to stakeholders  
✅ **Required for real-world use** (researchers need PDFs)  
✅ **Builds foundation** for compliance (audit logs → reports)  

### Why PubMed Can Wait:
- Requires external API setup (NCBI key, rate limiting)
- More complex error handling (network issues, API changes)
- Evidence Library is functional with manual entry for now
- Bigger feature, save it for major release

### The Plan:
1. **Build Reporting** → Complete MVP v2.0 (solid foundation)
2. **Then PubMed** → Launch MVP v3.0 (game-changer release)
3. **Market v3.0** as the "Research Platform" upgrade

---

## 📅 **Estimated Timeline**

| Phase | Feature | Duration | Total Time |
|-------|---------|----------|------------|
| ✅ Done | Collaboration & Reviews | - | 0 days |
| 🔨 Next | Reporting & Export | 7-10 days | 10 days |
| 🔨 Phase 3 | Admin Dashboard | 5-7 days | 17 days |
| 🔨 Phase 4 | Audit Trails | 3-5 days | 22 days |
| 🌟 Phase 5 | PubMed Integration | 7-10 days | 32 days |
| 🌟 Phase 6 | Advanced Analytics | 10-14 days | 46 days |
| 🌟 Phase 7 | Real-time Collab | 7-10 days | 56 days |

**Total Time to Full Vision**: ~8-10 weeks of focused development

---

## 🎉 **You're Here: MVP v1.0 Complete!**

**Congratulations!** You've built a fully-functional vaccine research platform with:
- Protocol management
- Evidence library
- Dataset analysis
- Team collaboration
- Review workflows

**Next Up**: Reporting & Export → Make it production-ready for real researchers! 📄

---

*Last Updated: January 20, 2026*
