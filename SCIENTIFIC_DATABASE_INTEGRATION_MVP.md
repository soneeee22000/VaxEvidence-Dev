# PubMed & Scientific Database Integration MVP

## Overview

Transform VaxEvidence from a manual evidence library into a **powerful research platform** by integrating with scientific databases. Researchers can search, import, and manage vaccine research papers directly from PubMed, clinical trials, and regulatory databases.

## The Game-Changer

**Current State**: Users manually copy-paste paper information from PubMed into Evidence Library ❌

**Future State**: Users search PubMed within VaxEvidence, click "Import", and instantly add papers with full metadata ✅

---

## Why This Is Critical

1. **Saves Hours of Work**: No more manual data entry
2. **Reduces Errors**: Auto-populated metadata from authoritative sources
3. **Increases Coverage**: Access to 30+ million biomedical papers
4. **Professional Credibility**: Real researchers need real data sources
5. **Competitive Advantage**: Most protocol builders don't have this

---

## Features to Build

### 1. PubMed Search Integration ⭐

**Description**: Search PubMed's 30+ million articles directly from the Evidence Library.

**API**: [NCBI E-utilities API](https://www.ncbi.nlm.nih.gov/books/NBK25501/) (Free!)

**Features:**
- Search by keywords (e.g., "COVID-19 vaccine safety")
- Filter by publication date, journal, author
- Display results with title, authors, abstract, publication date
- "Import" button to add to Evidence Library
- Auto-populate all metadata

**Example Search:**
```
Query: "mRNA vaccine efficacy"
Results: 5,432 papers
Filter: Last 2 years, Clinical Trials
Import → Automatically creates evidence item with:
  - Title, Authors, Journal, DOI
  - Abstract (description)
  - Publication date
  - Tags: ["mRNA vaccine", "efficacy", "clinical trial"]
```

---

### 2. DOI Quick Import 🔗

**Description**: Paste a DOI and instantly import the paper.

**APIs**: 
- [CrossRef API](https://www.crossref.org/documentation/retrieve-metadata/) (Free!)
- [DOI.org](https://dx.doi.org/) resolver

**Use Case**: Researcher has a DOI from a reference list and wants to add it quickly.

**Example:**
```
Input: 10.1056/NEJMoa2035389
↓
Fetch metadata from CrossRef
↓
Create evidence item:
  Title: "Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine"
  Authors: "Polack FP, Thomas SJ, Kitchin N, et al."
  Journal: "New England Journal of Medicine"
  DOI: "10.1056/NEJMoa2035389"
  Publication Date: December 10, 2020
```

---

### 3. PubMed ID (PMID) Import 🆔

**Description**: Import by PubMed ID.

**API**: NCBI E-utilities (Free!)

**Use Case**: Researcher sees a paper cited as "PMID: 33301246" and wants to import it.

**Example:**
```
Input: PMID 33301246
↓
Fetch from PubMed
↓
Create evidence item with full metadata
```

---

### 4. ClinicalTrials.gov Integration 🏥

**Description**: Search and import vaccine clinical trials.

**API**: [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/about-api) (Free!)

**Features:**
- Search vaccine trials by condition, intervention, phase
- Import trial details (NCT number, sponsor, status, results)
- Link to official ClinicalTrials.gov page
- Auto-categorize as "Clinical Trial" evidence type

**Example Search:**
```
Query: "COVID-19 vaccine Phase 3"
Results: 127 trials
Import → Creates evidence item:
  Title: "Study to Describe the Safety, Tolerability, Immunogenicity..."
  Type: Clinical Trial
  Source: NCT04368728
  Sponsor: Pfizer
  Phase: Phase 3
  Status: Completed
```

---

### 5. OpenFDA Adverse Events Integration ⚠️

**Description**: Search FDA adverse event reports for vaccine safety data.

**API**: [OpenFDA API](https://open.fda.gov/apis/drug/event/) (Free!)

**Features:**
- Search VAERS (Vaccine Adverse Event Reporting System) data
- Filter by vaccine name, reaction, demographics
- Import as "Safety" or "Regulatory" evidence
- Link to official FDA reports

**Use Case**: Safety researcher investigating adverse events for a specific vaccine.

---

### 6. Auto-Categorization & Tagging 🏷️

**Description**: Automatically categorize and tag imported papers using AI/ML.

**Implementation:**
- Analyze abstract and title
- Detect if paper is about: safety, efficacy, immunogenicity, Phase 1/2/3, etc.
- Auto-assign tags: ["COVID-19", "mRNA", "efficacy", "RCT"]
- Suggest evidence type (academic, regulatory, clinical trial)

**Libraries:**
- **OpenAI API** (or local model like Hugging Face)
- Simple keyword matching as fallback

---

### 7. Bulk Import from PubMed 📚

**Description**: Import multiple papers at once from a PubMed search.

**Use Case**: Researcher finds 50 relevant papers and wants to import them all.

**Features:**
- Select multiple papers from search results
- Bulk import (up to 50 at a time)
- Progress indicator
- Deduplicate (don't import papers already in library)

---

## Technical Implementation

### Architecture

```
┌─────────────────┐
│  Evidence Lib   │
│  "Search PubMed"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Route      │
│  /api/pubmed    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NCBI E-utils   │
│  API (external) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse & Import │
│  to Supabase    │
└─────────────────┘
```

---

### API Integration Details

#### PubMed E-utilities API

**Base URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`

**Key Endpoints:**
1. **ESearch** - Search for articles
   ```
   GET /esearch.fcgi?db=pubmed&term=covid+vaccine&retmode=json
   ```

2. **ESummary** - Get article summaries
   ```
   GET /esummary.fcgi?db=pubmed&id=33301246&retmode=json
   ```

3. **EFetch** - Get full article details
   ```
   GET /efetch.fcgi?db=pubmed&id=33301246&retmode=xml
   ```

**Rate Limits**: 
- 3 requests/second without API key
- 10 requests/second with free API key
- **Solution**: Get free NCBI API key

---

#### CrossRef API

**Base URL**: `https://api.crossref.org/works/`

**Example**:
```
GET https://api.crossref.org/works/10.1056/NEJMoa2035389
```

**Response**:
```json
{
  "message": {
    "title": ["Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine"],
    "author": [
      {"given": "Fernando P.", "family": "Polack"},
      ...
    ],
    "container-title": ["New England Journal of Medicine"],
    "DOI": "10.1056/nejmoa2035389",
    "published": {"date-parts": [[2020,12,10]]}
  }
}
```

---

#### ClinicalTrials.gov API

**Base URL**: `https://clinicaltrials.gov/api/v2/studies`

**Example Search**:
```
GET https://clinicaltrials.gov/api/v2/studies?query.cond=COVID-19&query.intr=Vaccine&pageSize=25
```

**Response**: JSON with trial details (NCT number, title, sponsor, phase, status)

---

### Database Schema Updates

**No new tables needed!** Evidence items already support all required fields.

**Update `evidence_items` table** (optional):
```sql
ALTER TABLE evidence_items
ADD COLUMN external_id TEXT, -- PMID, DOI, NCT number
ADD COLUMN external_source TEXT, -- 'pubmed', 'crossref', 'clinicaltrials'
ADD COLUMN imported_at TIMESTAMPTZ; -- When it was imported
```

**Benefits**:
- Track where evidence came from
- Prevent duplicate imports
- Enable re-sync with source API

---

## Implementation Plan

### Phase 1: PubMed Search & Import

**Files to Create:**
- `lib/api/pubmed.ts` - PubMed API client
- `app/api/search/pubmed/route.ts` - Server-side API route
- `components/evidence/pubmed-search.tsx` - Search UI component
- `components/evidence/import-dialog.tsx` - Import confirmation modal

**Tasks:**
1. Register for NCBI API key
2. Implement PubMed search (ESearch + ESummary)
3. Build search UI (search bar, results list)
4. Add "Import" button to each search result
5. Parse PubMed data and create evidence item
6. Show success toast with link to new evidence

**Estimated Time**: 3-4 days

---

### Phase 2: DOI & PMID Quick Import

**Files to Create:**
- `lib/api/crossref.ts` - CrossRef API client
- `components/evidence/quick-import.tsx` - DOI/PMID input form

**Tasks:**
1. Implement CrossRef API integration
2. Build quick import UI (paste DOI/PMID)
3. Fetch metadata and auto-populate form
4. Handle errors (DOI not found, invalid format)

**Estimated Time**: 1-2 days

---

### Phase 3: ClinicalTrials.gov Integration

**Files to Create:**
- `lib/api/clinicaltrials.ts` - ClinicalTrials.gov API client
- `components/evidence/trial-search.tsx` - Clinical trial search UI

**Tasks:**
1. Implement ClinicalTrials.gov API
2. Build trial search UI
3. Map trial data to evidence item format
4. Add "Clinical Trial" type-specific fields

**Estimated Time**: 2-3 days

---

### Phase 4: Auto-Categorization & Tagging

**Files to Create:**
- `lib/ml/categorize.ts` - Auto-categorization logic
- Simple keyword-based tagging initially

**Tasks:**
1. Extract keywords from abstract/title
2. Match against known vaccine-related terms
3. Auto-assign tags (COVID-19, mRNA, safety, etc.)
4. Suggest evidence type based on keywords

**Estimated Time**: 1-2 days

---

### Phase 5: OpenFDA & Bulk Import (Optional for MVP)

**Tasks:**
1. Implement OpenFDA API integration
2. Build bulk import UI (select multiple papers)
3. Add deduplication logic
4. Progress indicator for bulk imports

**Estimated Time**: 2-3 days

---

## UI/UX Design

### Evidence Library Page - New "Search External Databases" Section

```
┌─────────────────────────────────────────────┐
│  Evidence Library                           │
├─────────────────────────────────────────────┤
│                                             │
│  [Search evidence...]  [Filters]  [+Add]    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 🔍 Search External Databases          │ │
│  │                                       │ │
│  │ [PubMed] [DOI/PMID] [Clinical Trials]│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Your Evidence (20 items)                   │
│  [Evidence cards...]                        │
└─────────────────────────────────────────────┘
```

---

### PubMed Search Modal

```
┌──────────────────────────────────────────────┐
│  Search PubMed                          [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  [mRNA vaccine efficacy           ] [Search] │
│                                              │
│  Filters:                                    │
│  Publication Date: [Last 5 years ▼]         │
│  Article Type: [All types ▼]                │
│                                              │
│  Results (5,432 found):                      │
│  ┌──────────────────────────────────────┐   │
│  │ ✓ Safety and Efficacy of BNT162b2   │   │
│  │   Polack FP et al., NEJM, 2020       │   │
│  │   [View Abstract] [Import]            │   │
│  ├──────────────────────────────────────┤   │
│  │ □ mRNA-1273 COVID-19 Vaccine         │   │
│  │   Baden LR et al., NEJM, 2021        │   │
│  │   [View Abstract] [Import]            │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Bulk Import Selected (0)]  [Close]         │
└──────────────────────────────────────────────┘
```

---

### DOI Quick Import

```
┌─────────────────────────────────────┐
│  Quick Import by DOI or PMID   [×]  │
├─────────────────────────────────────┤
│                                     │
│  DOI or PubMed ID:                  │
│  [10.1056/NEJMoa2035389      ]      │
│                                     │
│  [Fetch Metadata]                   │
│                                     │
│  Preview:                           │
│  ┌─────────────────────────────┐   │
│  │ Title: Safety and Efficacy  │   │
│  │ Authors: Polack FP, et al.  │   │
│  │ Journal: NEJM               │   │
│  │ Date: Dec 10, 2020          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Cancel]  [Import to Library]      │
└─────────────────────────────────────┘
```

---

## Code Examples

### PubMed API Client

**File**: `lib/api/pubmed.ts`

```typescript
const PUBMED_API_KEY = process.env.NCBI_API_KEY
const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubDate: string
  doi?: string
  abstract?: string
}

export async function searchPubMed(query: string, maxResults = 20): Promise<string[]> {
  const url = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&api_key=${PUBMED_API_KEY}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data.esearchresult.idlist // Array of PMIDs
}

export async function fetchPubMedDetails(pmids: string[]): Promise<PubMedArticle[]> {
  const url = `${BASE_URL}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json&api_key=${PUBMED_API_KEY}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return pmids.map(pmid => {
    const article = data.result[pmid]
    return {
      pmid,
      title: article.title,
      authors: article.authors?.map((a: any) => a.name) || [],
      journal: article.fulljournalname,
      pubDate: article.pubdate,
      doi: article.elocationid?.split(' ')[0],
    }
  })
}

export async function fetchAbstract(pmid: string): Promise<string> {
  const url = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&api_key=${PUBMED_API_KEY}`
  
  const response = await fetch(url)
  const xml = await response.text()
  
  // Parse XML to extract abstract
  const abstractMatch = xml.match(/<AbstractText>(.*?)<\/AbstractText>/s)
  return abstractMatch ? abstractMatch[1] : ''
}
```

---

### API Route

**File**: `app/api/search/pubmed/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { searchPubMed, fetchPubMedDetails } from '@/lib/api/pubmed'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }
  
  try {
    const pmids = await searchPubMed(query, 20)
    const articles = await fetchPubMedDetails(pmids)
    
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('PubMed search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
```

---

### React Component

**File**: `components/evidence/pubmed-search.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubDate: string
  doi?: string
}

export function PubMedSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PubMedArticle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const res = await fetch(`/api/search/pubmed?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.articles)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }
  
  const handleImport = async (article: PubMedArticle) => {
    // Create evidence item in Supabase
    const evidence = {
      type: 'academic',
      title: article.title,
      authors: article.authors.join(', '),
      journal: article.journal,
      doi: article.doi,
      publication_date: article.pubDate,
      external_id: article.pmid,
      external_source: 'pubmed',
      tags: extractTags(article.title), // Auto-categorization
    }
    
    // Call your existing createEvidence function
    await createEvidence(evidence)
    
    toast({ title: 'Success', description: 'Paper imported successfully' })
  }
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Search PubMed
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search PubMed</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="mRNA vaccine efficacy..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((article) => (
                <div key={article.pmid} className="border rounded p-3">
                  <h4 className="font-medium">{article.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {article.authors.slice(0, 3).join(', ')}
                    {article.authors.length > 3 && ', et al.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {article.journal} • {article.pubDate}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline">View Abstract</Button>
                    <Button size="sm" onClick={() => handleImport(article)}>
                      Import
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## Testing Checklist

- [ ] Search PubMed for "COVID-19 vaccine"
- [ ] Import paper from PubMed search results
- [ ] Verify all metadata is correctly populated
- [ ] Import paper by DOI
- [ ] Import paper by PMID
- [ ] Search ClinicalTrials.gov for vaccine trials
- [ ] Import clinical trial
- [ ] Test with invalid DOI (should show error)
- [ ] Test with rate limiting (>3 requests/second)
- [ ] Verify deduplicate works (don't import same paper twice)
- [ ] Test auto-categorization assigns correct tags
- [ ] Bulk import 10 papers at once
- [ ] Test on mobile devices

---

## Environment Variables

**File**: `.env.local`

```bash
# NCBI E-utilities API Key (free, register at https://www.ncbi.nlm.nih.gov/account/)
NCBI_API_KEY=your_api_key_here

# Optional: OpenAI for auto-categorization
OPENAI_API_KEY=your_openai_key_here
```

---

## Dependencies

```bash
pnpm add xml2js  # For parsing PubMed XML responses
pnpm add date-fns  # For date formatting
```

---

## Success Metrics

- **Adoption**: 90% of users use PubMed search at least once
- **Import Volume**: Average 10+ papers imported per user
- **Time Saved**: 5 minutes saved per paper (vs manual entry)
- **Accuracy**: 95%+ metadata accuracy from APIs
- **Performance**: Search results in < 2 seconds

---

## Future Enhancements (Post-MVP)

- **Europe PMC** integration (European biomedical database)
- **Semantic Scholar** (AI-powered paper recommendations)
- **arXiv** (preprints)
- **WHO ICTRP** (International Clinical Trials Registry)
- **Cochrane Library** (systematic reviews)
- **Google Scholar** (broader coverage, but no official API)
- **Full-text PDF import** (extract data from PDFs)
- **Citation network visualization** (see related papers)
- **Auto-update metadata** (refresh paper details monthly)
- **Collaborative filtering** (recommend papers based on what others import)

---

## Competitive Analysis

**Platforms with similar features:**
- Zotero (reference manager, has PubMed import)
- Mendeley (reference manager, has DOI import)
- Covidence (systematic review tool, has database integration)

**VaxEvidence Advantage:**
- **Purpose-built for vaccine research** (not generic reference manager)
- **Integrated with protocols** (link papers directly to study protocols)
- **Collaboration features** (comments, reviews on imported papers)
- **Dataset integration** (papers + data in one platform)

---

This feature transforms VaxEvidence into a **must-have tool** for vaccine researchers, combining the power of PubMed with protocol management and team collaboration.
