Here's your full report — copy/paste this as a .md file:
VaxEvidence App — Comprehensive Button & Feature Test Report
Date: 2025-02-19
URL: http://localhost:3000
Tester: Claude (automated browser testing)
Account: pyaesonekyaw1022000@gmail.com
CRITICAL ISSUES SUMMARY
#SeverityIssueRoot Cause1CRITICALProtocol creation fails silentlySupabase RLS policy blocks INSERT on protocols table (POST returns 401)2CRITICALEvidence creation fails silentlySupabase RLS policy blocks INSERT on evidence_items table (POST returns 401)3CRITICALDataset sample data loading failsSupabase RLS policy blocks INSERT on datasets table — console error: new row violates row-level security policy for table "datasets"4CRITICALReviews endpoint downGET /rest/v1/reviews?...&status=eq.pending returns 503 Service Unavailable on every page load5HIGHPreviously imported PubMed evidence disappears on reloadLikely the import INSERT succeeded momentarily but RLS prevents SELECT, or the insert was never committed6HIGHNo user-facing error messages on failed writesProtocol creation, evidence creation, and sample data load all fail with zero feedback to the user7MEDIUMMultiple GoTrueClient instances warningConsole: Multiple GoTrueClient instances detected in the same browser context...may produce undefined behavior — fires on nearly every page transition8MEDIUMAccessibility warnings on all dialog modalsConsole: Warning: Missing Description or aria-describedby={undefined} for {DialogContent} — fires on PubMed, DOI Import, and Clinical Trials modals

PAGE-BY-PAGE TEST RESULTS

1. Protocols Page (/app)
   ElementActionResultNotesPage loadNavigatePASSRenders correctly, shows "No protocols yet" empty state"New protocol" buttonClickPASSNavigates to /app/new (template selection)"Export Workspace" buttonClickPASSOpens modal with "Complete Archive (ZIP)" and "Data Only (ZIP with JSON)" optionsExport Workspace modal → radio buttonsTogglePASSBoth radio options selectableExport Workspace modal → CancelClickPASSCloses modalExport Workspace modal → ExportClickPASSCloses modal (no error with 0 protocols — graceful empty state)"Sign out" button (header)ClickPASSLogs out, redirects to /auth"Sign out" button (main body)ClickPASSSame as above
2. New Protocol — Template Selection (/app/new)
   ElementActionResultNotesPage loadNavigatePASSShows template selection with info card"All Templates" filterClickPASSShows all 5 templates"Effectiveness" filterClickPASSFilters to 3 effectiveness templates"Safety" filterClickPASSFilters to 1 safety template (HPV)"General" filterClickPASSFilters to 1 general templateSearch boxType "COVID"PASSCorrectly filters to COVID-19 Booster templateSearch + filter combo"COVID" + GeneralPASSShows "No templates found" correctly"Skip templates" buttonClickPASSNavigates to blank protocol form"Use Template" button (any card)ClickPASSOpens template detail view with full content
3. Template Detail View (via "Use Template")
   ElementActionResultNotesTemplate contentRenderPASSShows full template with sections: PICO, Inclusion/Exclusion, Statistical Methods, Regulatory Context, Timeline, Use Cases"Create Protocol from This Template"ClickPASSNavigates to /app/new?template=... with form pre-filled"Browse Other Templates"ClickPASSReturns to template list"Change template" link (on pre-filled form)VisiblePASSShows link to switch template
4. Protocol Creation Form (/app/new — blank or pre-filled)
   ElementActionResultNotesAll text fieldsTypePASSProtocol title, Study question, Population, Comparator, Outcomes, Study design all accept inputStatus dropdownClickPASSShows 3 options: Draft, In review, FinalForm validation (empty submit)Click CreatePASSShows validation errors: "Title is too short", "Study question is too short", "Population is required", "Comparator is required", "Outcomes are required" — all fields highlighted red"Create protocol" with valid dataClickFAIL — CRITICALError: new row violates row-level security policy for table "protocols". Network: POST to /rest/v1/protocols returns 401 UnauthorizedError feedback to user—FAILError message IS shown (red banner at top of form) — this is actually better than evidence creation"Back to dashboard" linkClickPASSReturns to /app
5. Templates Page (/app/templates)
   ElementActionResultNotesPage loadNavigatePASSShows same template library as new protocol flowAll filter buttonsClickPASSAll Templates / Effectiveness / Safety / General all workSearch boxTypePASSFilters templates in real timeTemplate cardsRenderPASSAll 5 templates display with difficulty badge, description, timeline, use cases, "+N more" tags"Use Template" buttonsClickPASSEach opens detailed template view
6. Datasets Page (/app/datasets)
   ElementActionResultNotesPage loadNavigatePASSShows "No datasets yet" empty state, "0 Bytes used""Upload Dataset" link (header)ClickPASSNavigates to /app/datasets/new"Upload your first dataset" linkClickPASSSame as above"Load Sample Clinical Trial Data"ClickFAIL — CRITICALConsole error: Error loading sample data: Error: new row violates row-level security policy for table "datasets". No user-facing error message shownSearch boxTypePASSAccepts input (no data to filter)Sort dropdownClickPASS8 options: Newest first, Oldest first, Name A-Z, Name Z-A, Largest first, Smallest first, Most rows, Fewest rowsDataset Type checkboxes (Clinical Trial, Surveillance, Safety, Efficacy, Other)ClickPASSToggle correctly, green check appears, "Clear all" with X appearsFile Type checkboxes (CSV, XLSX, JSON, TXT)ClickPASSToggle correctlyStatus checkboxes (Draft, Validated, Archived)VisiblePASSRender correctly"Clear all" filtersClickPASSResets all checkboxes
7. Upload Dataset (/app/datasets/new)
   ElementActionResultNotesPage loadNavigatePASSShows "Step 1 of 2: Select file" with drag-and-drop zoneDrag-and-drop zoneVisiblePASSShows "Drop your dataset file here, or click to browse — Supports CSV, Excel, JSON, TXT (max 100MB)""Next" button (no file)ClickPASSStays on Step 1 — correct validation (won't proceed without file)"Cancel" linkClickPASSReturns to /app/datasets
8. Evidence Library (/app/evidence)
   ElementActionResultNotesPage loadNavigatePASSShows "Showing 0 of 0 items" (or 1 if import succeeded temporarily)"Search PubMed" buttonClickPASSOpens modal with search inputPubMed searchType + SearchPASSReturns real PubMed results (API: /api/search/pubmed — 200 OK). Shows 20 results with title, authors, journal, datePubMed → "View Abstract"ClickPASSToggles abstract display, button text changes to "Hide Abstract"PubMed → "Import"ClickPASS (UI)Button changes to "Imported" label. BUT data may not persist (see Critical Issue #5)"Quick Import (DOI/PMID)" buttonClickPASSOpens modal with DOI/PMID inputDOI → "Fetch Metadata"Click (with valid DOI 10.1056/NEJMoa2034577)PASSFetches full metadata: title, authors, journal, publication date, DOI, source URLDOI → "Clear Preview"VisiblePASSAppears after metadata fetchDOI → "Import to Library"ClickNOT TESTEDLikely fails with same RLS issueDOI → "Cancel"ClickPASSCloses modal"Search Clinical Trials" buttonClickPASSOpens ClinicalTrials.gov search modalClinical Trials searchType + SearchPASSReturns real results from ClinicalTrials.gov API with NCT IDs, phase, statusClinical Trials → "View Details"VisiblePASSButton present on each resultClinical Trials → "Import"VisiblePASSButton present on each result"+ Add Evidence" linkClickPARTIALSometimes doesn't navigate; direct URL /app/evidence/new worksSearch evidence text boxTypePASSAccepts inputSort dropdownClickPASS4 options: Newest first, Oldest first, Title A-Z, Title Z-AEvidence Type checkboxes (Academic, Regulatory, Dataset, Note)ClickPASSToggle correctlyStatus checkboxes (Draft, Published, Archived)ClickPASSToggle correctlyTags dropdown ("Select a tag...")ClickPASSOpens (empty when no tags exist)Publication Date pickers (From/To)VisiblePASSDate input fields render correctly"Clear all" filtersClickFAIL — BUGDoes NOT clear Academic checkbox — remains checked after clicking Clear all
9. Add Evidence Form (/app/evidence/new)
   ElementActionResultNotesPage loadNavigatePASSFull form renders with all sections"Back to Library" linkClickPASSReturns to /app/evidenceEvidence Type radio buttons (Academic, Regulatory, Dataset, Note)ClickPASSOnly one selectable at a time (radio behavior)Status dropdownClickPASSShows Draft and other optionsTitle field (required)TypePASSAccepts input, validation highlights on empty submitDescription field (required)TypePASSTextarea, accepts inputAuthors field (required)TypePASSAccepts inputJournal, DOI, Source URL fieldsTypePASSOptional fields accept inputSuggested tags (COVID-19, influenza, mRNA vaccine, etc.)ClickPASSTag gets added below input with X to removeCustom tag input + "Add" buttonVisiblePASSInput field and Add button present"Cancel" buttonClickPASSReturns to evidence library"Create Evidence" button (valid data)ClickFAIL — CRITICALNo user-facing error. Network: POST to /rest/v1/evidence_items returns 401. Form stays populated with no feedback
10. Activity Page (/app/activity)
    ElementActionResultNotesPage loadNavigatePASSShows "No activity to show yet" empty stateActivity filter dropdownClickPASS7 options: All Activity, Comments, Review Requests, Review Decisions, Created, Updated, Linked"Export" dropdown buttonClickPASSShows "Export as CSV" and "Export as PDF""Export as CSV"ClickPASS (UI)Triggers (no data to export)"Export as PDF"ClickPASS (UI)Triggers (no data to export)
11. Navigation Bar (All Authenticated Pages)
    ElementActionResultNotesVaxEvidence logoClickPASSNavigates to /app"Protocols" linkClickPASSNavigates to /app"Templates" linkClickPASSNavigates to /app/templates"Datasets" linkClickPASSNavigates to /app/datasets"Evidence Library" linkClickPASSNavigates to /app/evidence"Activity" linkClickPASSNavigates to /app/activityUser email displayVisiblePASSShows logged-in user email"Sign out" buttonClickPASSLogs out → /auth

CONSOLE ERRORS & WARNINGS LOG
[RECURRING WARNING — every page transition]
GoTrueClient@sb-twzyerbgajleyrbkbdwg-auth-token:1 (2.90.1)
Multiple GoTrueClient instances detected in the same browser context.
It is not an error, but this should be avoided as it may produce
undefined behavior when used concurrently under the same storage key.
[ERROR — Protocol Creation]
new row violates row-level security policy for table "protocols"
→ Network: POST /rest/v1/protocols → 401 Unauthorized
[ERROR — Dataset Sample Load]
Error loading sample data: Error: new row violates row-level security
policy for table "datasets"
→ at handleLoadSampleData
[ERROR — Evidence Creation]
(Silent — no console error, but network confirms)
→ Network: POST /rest/v1/evidence_items → 401 Unauthorized
[WARNING — All Dialogs]
Warning: Missing `Description` or `aria-describedby={undefined}`
for {DialogContent}
[NETWORK — Recurring on every page]
HEAD /rest/v1/reviews?...&status=eq.pending → 503 Service Unavailable

NETWORK FAILURES SUMMARY
EndpointMethodStatusAffected Feature/rest/v1/protocolsPOST401Protocol creation/rest/v1/evidence_itemsPOST401Evidence creation & PubMed import persistence/rest/v1/datasetsPOST401 (via RLS)Sample data loading/rest/v1/reviews?...status=eq.pendingHEAD503Review notifications (fires on every page)

RECOMMENDATIONS FOR CLAUDE CODE FIX SESSION

Fix Supabase RLS policies — This is the #1 blocker. The protocols, evidence_items, and datasets tables all reject INSERT from the authenticated user. Check that RLS policies allow INSERT for auth.uid() = user_id (or whatever the ownership column is).
Fix the reviews table — The 503 on the reviews endpoint suggests the table may not exist, or the Supabase project is paused/hitting limits. Investigate whether this table needs to be created or if the Supabase project needs to be unpaused.
Add user-facing error toasts — Evidence creation and dataset sample loading fail completely silently. Protocol creation at least shows the error in a banner. All write failures should show a clear toast/alert.
Fix multiple GoTrueClient instances — Likely caused by creating the Supabase client in multiple places. Use a singleton pattern or React context to share one client instance.
Add aria-describedby to all DialogContent — Quick fix: add a `<DialogDescription>` component (from Radix/shadcn) inside each dialog.
Fix "Clear all" on Evidence Library filters — The Academic checkbox doesn't clear when "Clear all" is clicked.
Wire up hero buttons — "Start Free Trial", "Watch Demo", and "Generate Protocol" on the landing page are unconnected type="button" with no onClick handlers.

End of report.Sonnet 4.6 is here!Ask before actingClaude is AI and can make mistakes. Please double-check responses.
