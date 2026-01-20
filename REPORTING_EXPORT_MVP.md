# Reporting & Export MVP

## Overview

Build a production-ready reporting and export system that allows researchers to generate professional PDF/Word reports of protocols, export evidence bibliographies, and create compliance-ready documentation.

## Why Build This Now?

- **Completes the core workflow**: Protocol → Evidence → Datasets → Report
- **Critical for stakeholders**: Regulators and reviewers need formatted documents
- **Demonstrates professionalism**: Shows the platform is production-ready
- **Enables sharing**: Researchers can share their work outside the platform

---

## Features to Build

### 1. Protocol Report Export (PDF/Word)

**Description**: Export a complete protocol with all linked evidence and datasets as a formatted PDF or Word document.

**Includes:**
- Protocol metadata (title, study question, population, etc.)
- Linked evidence with citations
- Linked datasets with file information
- Comments and review history (optional)
- Auto-generated table of contents
- Professional formatting with logos and headers

**Use Case**: Researcher completes a protocol and needs to share it with their IRB (Institutional Review Board) for approval.

---

### 2. Evidence Bibliography Export

**Description**: Export all evidence linked to a protocol as a formatted bibliography.

**Formats:**
- BibTeX (for LaTeX users)
- RIS (for reference managers like Zotero, Mendeley)
- CSV (for Excel)
- Formatted text (APA, MLA, Chicago styles)

**Use Case**: Researcher writing a manuscript needs to cite all evidence used in their protocol.

---

### 3. Dataset Summary Report

**Description**: Export dataset metadata and preview data as a formatted report.

**Includes:**
- Dataset metadata (type, size, date range)
- Data preview (first 50 rows)
- Summary statistics
- Visualizations (charts from the preview)
- File download link

**Use Case**: Data analyst needs to share dataset information with collaborators.

---

### 4. Activity Audit Log Export

**Description**: Export activity logs for compliance and audit purposes.

**Formats:**
- PDF (formatted report with timestamps)
- CSV (for analysis in Excel)
- JSON (for programmatic access)

**Includes:**
- All comments, reviews, and changes
- User attribution and timestamps
- Protocol version history

**Use Case**: Compliance officer needs to audit who reviewed and approved a protocol.

---

### 5. Bulk Export (Workspace Export)

**Description**: Export all protocols, evidence, and datasets for a user as a complete archive.

**Formats:**
- ZIP archive with PDFs
- JSON export (for data portability)
- Excel workbook (all data in spreadsheet format)

**Use Case**: Researcher switching institutions needs to export their entire workspace.

---

## Implementation Plan

### Phase 1: PDF Generation Infrastructure

**Libraries to Use:**
- **React-PDF** or **jsPDF** - Generate PDFs in browser/server
- **Puppeteer** (optional) - Server-side rendering for complex layouts
- **PDFKit** (Node.js) - More control over PDF generation

**Tasks:**
1. Choose PDF generation library (React-PDF recommended for React integration)
2. Create PDF templates for protocols, evidence, datasets
3. Add "Export as PDF" buttons to detail pages
4. Implement server-side PDF generation API route

---

### Phase 2: Word Document Export

**Libraries to Use:**
- **docx** (npm package) - Generate .docx files
- **docx-templates** - Template-based Word generation

**Tasks:**
1. Create Word document templates
2. Implement server-side Word generation API route
3. Add "Export as Word" buttons to detail pages

---

### Phase 3: Bibliography Export

**Libraries to Use:**
- **citation-js** - Format citations in multiple styles
- **bibtex-parse** - Generate BibTeX files

**Tasks:**
1. Create bibliography formatter for evidence items
2. Support APA, MLA, Chicago, BibTeX, RIS formats
3. Add "Export Bibliography" button to protocol pages
4. Generate properly formatted citations with DOI links

---

### Phase 4: Activity Log Export

**Tasks:**
1. Create activity log PDF template
2. Add CSV export for activity logs
3. Implement date range filtering for exports
4. Add user-specific activity export

---

### Phase 5: Bulk Export & Archive

**Tasks:**
1. Create ZIP archive generator
2. Export all protocols as PDFs in archive
3. Include JSON data export for portability
4. Add progress indicator for large exports

---

## Technical Architecture

```
User clicks "Export"
    ↓
Frontend sends request to API route
    ↓
API route fetches data from Supabase
    ↓
Server generates PDF/Word/CSV using library
    ↓
File returned to user as download
    ↓
Optional: Store in Supabase Storage for later access
```

---

## Database Schema Changes

**New Table: `exports`**

```sql
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  export_type TEXT, -- 'protocol_pdf', 'bibliography', 'activity_log'
  resource_id UUID, -- ID of protocol/dataset/etc
  file_path TEXT, -- Supabase Storage path
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ -- Auto-delete after 7 days
);
```

**Purpose**: Track export history and allow users to re-download recent exports.

---

## UI/UX Design

### Export Menu (Dropdown on Detail Pages)

```
[Export ▼]
  - Export as PDF
  - Export as Word
  - Export Bibliography (for protocols)
  - Export Activity Log
```

### Export Modal

When user clicks "Export as PDF":

```
┌─────────────────────────────────────┐
│  Export Protocol as PDF             │
├─────────────────────────────────────┤
│                                     │
│  Include:                           │
│  ☑ Linked Evidence                 │
│  ☑ Linked Datasets                 │
│  ☑ Comments                        │
│  ☑ Review History                  │
│                                     │
│  Template Style:                    │
│  ○ Professional                     │
│  ○ Academic                         │
│  ○ Regulatory Submission            │
│                                     │
│  [Cancel]  [Generate PDF]           │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Setup PDF Generation

**File**: `lib/export/pdf.ts`

```typescript
import { jsPDF } from 'jspdf'

export async function generateProtocolPDF(protocolId: string) {
  // Fetch protocol data
  // Generate PDF
  // Return as blob
}
```

### 2. Create API Routes

**File**: `app/api/export/protocol/[id]/route.ts`

```typescript
export async function GET(request: Request, { params }) {
  const protocolId = params.id
  const pdf = await generateProtocolPDF(protocolId)
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="protocol-${protocolId}.pdf"`
    }
  })
}
```

### 3. Add Export Buttons

Update protocol, evidence, and dataset detail pages with export buttons.

### 4. Create PDF Templates

Design professional-looking PDF templates with:
- Logo and branding
- Table of contents
- Section headers
- Proper formatting for evidence citations
- Page numbers and footers

### 5. Implement Bibliography Export

**File**: `lib/export/bibliography.ts`

```typescript
import Cite from 'citation-js'

export function generateBibliography(evidenceItems: EvidenceItem[], format: 'bibtex' | 'apa' | 'mla') {
  const citations = evidenceItems.map(item => ({
    type: 'article-journal',
    title: item.title,
    author: item.authors?.split(',').map(name => ({ family: name.trim() })),
    DOI: item.doi,
    // ... other fields
  }))
  
  const cite = new Cite(citations)
  return cite.format(format)
}
```

---

## Testing Checklist

- [ ] Export protocol as PDF
- [ ] Export protocol as Word document
- [ ] Export evidence bibliography in BibTeX format
- [ ] Export evidence bibliography in APA format
- [ ] Export activity log as PDF
- [ ] Export activity log as CSV
- [ ] Bulk export entire workspace
- [ ] Verify PDFs open correctly in Adobe Reader
- [ ] Verify Word documents open in Microsoft Word
- [ ] Test large protocols (100+ evidence items)
- [ ] Test export with special characters in titles
- [ ] Verify file downloads work on mobile devices

---

## Future Enhancements (Post-MVP)

- **Custom Templates**: Let users create their own export templates
- **Scheduled Exports**: Auto-generate weekly/monthly reports
- **Email Delivery**: Send exports directly to email
- **Cloud Storage Integration**: Export to Google Drive, Dropbox
- **Version Comparison**: Export diff reports between protocol versions
- **Collaborative Editing**: Export with tracked changes (Word)
- **Watermarks**: Add "DRAFT" or "CONFIDENTIAL" watermarks
- **Digital Signatures**: Sign PDFs for regulatory compliance

---

## Estimated Timeline

- **Phase 1** (PDF Generation): 2-3 days
- **Phase 2** (Word Export): 1-2 days
- **Phase 3** (Bibliography): 1 day
- **Phase 4** (Activity Log): 1 day
- **Phase 5** (Bulk Export): 1-2 days

**Total**: ~7-10 days for complete implementation

---

## Dependencies

```bash
pnpm add jspdf docx citation-js
pnpm add @react-pdf/renderer  # Alternative: react-pdf
pnpm add archiver  # For ZIP exports
```

---

## Success Metrics

- **Adoption**: 80% of users export at least one protocol
- **Format Preference**: Track which formats are most popular
- **File Sizes**: Monitor export file sizes (keep under 10MB)
- **Performance**: Export generation completes in < 5 seconds
- **Quality**: Zero formatting errors in generated PDFs

---

This feature completes the "Create → Collaborate → Export" workflow, making VaxEvidence a **production-ready platform** for vaccine research teams.
