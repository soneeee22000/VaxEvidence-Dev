# VaxEvidence — Full Feature Walkthrough Script

> **Purpose:** Feed this script to Claude with the Chrome extension to walk through
> and visually verify every major feature in Phases 8, 10, 11, and 12.
>
> **Prerequisites:**
>
> - Dev server running (`pnpm dev` on `localhost:3000`)
> - Logged in (or auth session exists)
> - At least one protocol already exists, OR the script will create one
>
> **Recording:** Start a GIF recording at the beginning of each phase so we have
> visual proof of every feature working.

---

## SETUP — Create Test Protocol and Evidence

Before testing Phase 8/10/11/12 features, we need a protocol with linked evidence.

### Step 1: Create a test protocol

1. Navigate to `http://localhost:3000/app/new`
2. Wait for the page to load — you should see the protocol creation form
3. Fill in the form fields:
   - **Protocol title:** `Feature Walkthrough Test Protocol`
   - **Study question:** `Does mRNA COVID-19 vaccine reduce hospitalisation rates in adults aged 65 and older?`
   - **Population:** `Adults aged 65 and older in the United States`
   - **Intervention:** `BNT162b2 mRNA COVID-19 vaccine, 2-dose primary series plus booster`
   - **Comparator:** `Unvaccinated individuals or placebo recipients`
   - **Outcomes:** `Hospitalisation within 28 days of symptom onset, ICU admission, mortality`
   - **Study design:** Select `Retrospective cohort study` from the dropdown
4. Click **"Create Protocol"**
5. Wait for redirect to the protocol detail page (`/app/[id]`)
6. **Take a screenshot** — Save the protocol URL from the address bar, we need it for all subsequent steps
7. Note the protocol ID from the URL (the UUID after `/app/`)

### Step 2: Create and link evidence

1. Open a new tab and navigate to `http://localhost:3000/app/evidence/new`
2. Fill in the evidence form:
   - **Title:** `Effectiveness of BNT162b2 Against Hospitalisation in Older Adults`
   - **Type:** Select `Academic` (or `academic`)
   - **Authors:** `Thompson MG, Stenehjem E, Grannis S, et al.`
   - **Description:** `Retrospective cohort study of mRNA vaccine effectiveness against COVID-19 hospitalisation using electronic health records from 21 US health systems.`
   - **DOI:** `10.1056/NEJMoa2110362`
3. Click **"Create Evidence"** (or the save/submit button)
4. Navigate back to the protocol detail page (the URL you saved in Step 1)
5. Find the **"Linked Evidence"** section and click **"Add Evidence"**
6. In the dialog that opens, find the evidence item we just created and click it to select it
7. Click the **"Link"** button (it should show a count like "Link (1)")
8. **Take a screenshot** showing the evidence now appears under Linked Evidence

---

## PHASE 8 — Systematic Review & PRISMA

> Start GIF recording: name it `phase8-screening-walkthrough.gif`

### Test 8.1: Navigate to Screening Page

1. On the protocol detail page, find the **"Systematic Review"** card
2. It should show text: "PRISMA-compliant screening, risk of bias, and meta-analysis"
3. Click **"Continue Screening"** (or "Start Screening" if first time)
4. Wait for the screening page to load at `/app/[protocol-id]/screening`
5. **Take a screenshot** — The page should show tabs and the screening pipeline

### Test 8.2: Verify 4 Tabs Exist

1. Look at the tab bar at the top of the screening page
2. Verify these 4 tabs are visible:
   - **Screening** (should be active/selected by default)
   - **PRISMA Diagram**
   - **Risk of Bias**
   - **Meta-Analysis**
3. **Take a screenshot** showing all 4 tabs

### Test 8.3: Verify Stats Bar Shows 4 Stages

1. Under the Screening tab, look for the horizontal stats/progress bar
2. It should show 4 stages with counts:
   - **Identification** (blue) — should show the total count
   - **Screening** (amber)
   - **Eligibility** (purple)
   - **Included** (green)
3. **Take a screenshot** of the stats bar

### Test 8.4: Screening Cards and Decision Buttons

1. Below the stats bar, screening cards should appear (one per linked evidence item)
2. Each card should show:
   - Evidence title
   - Evidence type badge
   - Decision buttons: **Include** (green), **Exclude** (red), **Duplicate** (gray)
3. **Take a screenshot** of a screening card with its decision buttons

### Test 8.5: Include an Evidence Item

1. Click the **"Include"** button on the first screening card
2. The card should update to show an "included" status badge (green)
3. The stats bar counts should update (pending decreases, included increases)
4. **Take a screenshot** showing the included status

### Test 8.6: Revert and Exclude with Reason

1. If visible, click **"Revert to Pending"** on the included item to reset it
2. Now click **"Exclude"** on the same item
3. An exclusion reason form should appear with:
   - A dropdown for exclusion reason (e.g., "Wrong population", "Wrong intervention", etc.)
   - A textarea for "Additional notes (optional)"
   - **"Confirm Exclude"** and **"Cancel"** buttons
4. Select any reason from the dropdown
5. Type a note: `Not relevant to our specific age group criteria`
6. Click **"Cancel"** (we don't actually want to exclude it — we need it for later tests)
7. **Take a screenshot** of the exclusion reason form before cancelling

### Test 8.7: Duplicate Detection Dialog

1. Look for the **"Detect Duplicates"** button (should be visible in Identification stage)
2. Click it
3. A dialog should open showing duplicate detection results
4. It may show "No duplicates found" or list potential duplicates
5. **Take a screenshot** of the duplicate detection dialog
6. Close the dialog

### Test 8.8: PRISMA Diagram Tab

1. Click the **"PRISMA Diagram"** tab
2. Wait for the PRISMA flow diagram to render
3. It should show a structured flow with boxes for:
   - Identification (records identified)
   - Screening (records screened)
   - Eligibility (full-text assessed)
   - Included (studies included)
4. The counts in the diagram should reflect our screening decisions
5. **Take a screenshot** of the full PRISMA flow diagram

### Test 8.9: Risk of Bias Tab

1. Click the **"Risk of Bias"** tab
2. The panel should load showing:
   - A tool selector (RoB 2 for RCTs or ROBINS-I for Observational)
   - A list of evidence items available for assessment
   - Or a summary table if assessments already exist
3. If there's a form, verify the domain judgment dropdowns show options like "Low", "Some concerns", "High"
4. **Take a screenshot** of the Risk of Bias panel

### Test 8.10: Meta-Analysis Tab

1. Click the **"Meta-Analysis"** tab
2. The panel should load showing:
   - Title: "Meta-Analysis"
   - Description about entering study-level effect sizes
   - A data entry table (or prompt to add studies)
   - The forest plot area (may show "No entries to display" message)
3. If there's an **"Add Study"** or **"Add Entry"** button, click it
4. Try entering a test study entry:
   - Study label: `Thompson 2021`
   - Effect size: `0.87`
   - CI Lower: `0.80`
   - CI Upper: `0.95`
   - Weight: `25`
5. **Take a screenshot** of the meta-analysis panel with data

> Stop GIF recording for Phase 8

---

## PHASE 10 — Real-Time Collaboration

> Start GIF recording: name it `phase10-collaboration-walkthrough.gif`

### Test 10.1: Notification Bell

1. Navigate back to the protocol detail page
2. Look at the top navigation bar (header area)
3. Find the **notification bell icon** (Bell icon, should be in the top-right area)
4. It may show a badge with unread count (or no badge if 0 notifications)
5. **Take a screenshot** showing the notification bell

### Test 10.2: Notification Popover

1. Click the **notification bell icon**
2. A popover/dropdown should appear showing either:
   - **"No notifications yet"** — if empty
   - A list of notification items with titles, descriptions, and timestamps
   - A **"Mark all read"** button (if there are notifications)
3. **Take a screenshot** of the notification popover
4. Close the popover by clicking elsewhere

### Test 10.3: Comments Section

1. On the protocol detail page, scroll down to find the **"Comments"** section
2. It should have a header saying **"Comments"** with subtitle "Discuss this protocol with your team"
3. There should be a text input area with placeholder: **"Share your thoughts about this protocol..."**
4. Below the input, a character counter (e.g., "0 / 10000")
5. A **"Comment"** button (should be disabled when input is empty)
6. **Take a screenshot** of the comments section

### Test 10.4: Post a Comment

1. Click the comment input textarea
2. Type: `This protocol looks good. The PICO framework is well-defined for our target population.`
3. The character counter should update
4. The **"Comment"** button should now be enabled
5. Click **"Comment"** to post
6. The comment should appear in the comments list below with:
   - Your user email/name
   - The comment text
   - A timestamp
7. **Take a screenshot** showing the posted comment

### Test 10.5: Presence & Collaboration Indicators

1. Look at the protocol detail page header area
2. There may be **collaborator avatar circles** showing who's currently viewing
3. If you're the only user, you should see at least your own avatar/initial
4. Look at any form field (like Population or Intervention) — there may be colored border indicators showing active editors
5. **Take a screenshot** of any visible presence/collaboration indicators

### Test 10.6: Field-Level Collaboration

1. Click on the **"Population"** field to focus it
2. If real-time collaboration is active, the field border may change color to indicate you're editing
3. Other users (if any) would see your cursor/focus highlighted
4. **Take a screenshot** showing the field with focus indicators

> Stop GIF recording for Phase 10

---

## PHASE 11 — Regulatory Compliance

> Start GIF recording: name it `phase11-regulatory-walkthrough.gif`

### Test 11.1: Regulatory Compliance Card

1. On the protocol detail page, find the **"Regulatory Compliance"** card
2. It should show:
   - Title: **"Regulatory Compliance"**
   - Subtitle: "CONSORT/STROBE checklists and ICH GCP compliance tracking"
   - A link: **"Open Compliance Hub"**
3. **Take a screenshot** of the Regulatory Compliance card

### Test 11.2: Navigate to Regulatory Hub

1. Click **"Open Compliance Hub"**
2. Wait for the page to load at `/app/[protocol-id]/regulatory`
3. The page should show:
   - A back link (arrow left + "Protocol" or similar)
   - Title: **"Regulatory Compliance"**
   - Subtitle about reporting checklists and GCP compliance
4. **Take a screenshot** of the regulatory hub page header

### Test 11.3: CONSORT Tab

1. The **"CONSORT"** tab should be selected by default (or click it)
2. The checklist panel should show:
   - Title: **"CONSORT 2010 Checklist"** (or similar)
   - A progress indicator (e.g., "0 of 37 complete")
   - Checklist items organized by sections (Title, Abstract, Introduction, Methods, Results, Discussion, Other)
   - Each item has a status indicator and expandable details
3. Click on one checklist item to expand it
4. You should see:
   - Status dropdown or buttons (Not Started / In Progress / Complete)
   - Notes field
   - Optional page reference field
5. Try changing one item's status to **"Complete"** or **"In Progress"**
6. **Take a screenshot** of the CONSORT checklist with an expanded item

### Test 11.4: STROBE Tab

1. Click the **"STROBE"** tab
2. The checklist panel should show:
   - Title: **"STROBE Checklist"** (or similar)
   - A study type selector (Cohort / Case-Control / Cross-Sectional)
   - Checklist items (approximately 40 items depending on study type)
3. Try switching the study type dropdown to see items change
4. **Take a screenshot** of the STROBE checklist panel

### Test 11.5: ICH GCP Tab

1. Click the **"ICH GCP"** tab
2. The GCP compliance panel should show:
   - Title about ICH E6(R2) GCP compliance
   - Three collapsible sections:
     - **Principles** (13 items)
     - **Protocol Sections** (20 items)
     - **Essential Documents** (35 items)
   - Each item has compliance status options (Compliant / Partial / Non-compliant / Not Applicable)
3. Expand one section and check a few items
4. Try setting one principle to **"Compliant"**
5. **Take a screenshot** of the ICH GCP panel with expanded sections

### Test 11.6: Back to Protocol

1. Click the back link (arrow left + "Protocol" text) to return to protocol detail
2. Verify you're back on the protocol detail page
3. **Take a screenshot** confirming navigation back

### Test 11.7: Export Menu — Regulatory Section

1. On the protocol detail page, find and click the **"Export"** button
2. A dropdown menu should open showing multiple export options
3. Scroll down or look for the **"Regulatory"** section label
4. Under it, verify three items exist:
   - **"FDA IND Package"**
   - **"eCTD Module 5"**
   - **"SDTM Templates"**
5. **Take a screenshot** of the export dropdown showing the Regulatory section

### Test 11.8: FDA IND Package Dialog

1. Click **"FDA IND Package"** from the export menu
2. A dialog should open with:
   - Title: **"FDA IND Submission Package"** (or similar)
   - Subtitle mentioning the protocol name
   - Section completeness indicator (e.g., "5/10 sections auto-populated")
   - A list of 10 IND sections (Cover Sheet through Relevant Information)
   - Each section shows a status badge: "Auto-populated" (green), "Partial" (yellow), or "Template only" (gray)
   - Format selector: **"PDF"** and **"Word (.docx)"** buttons
   - A note about protocol draft status
   - **"Generate IND Package"** and **"Cancel"** buttons
3. Click **"Word (.docx)"** to toggle format
4. **Take a screenshot** of the full IND Package dialog
5. Click **"Cancel"** to close (don't actually generate)

### Test 11.9: eCTD Module 5 Dialog

1. Click **"Export"** again to reopen the dropdown
2. Click **"eCTD Module 5"**
3. A dialog should open with:
   - Title about eCTD Module 5
   - Section list with ICH M4E(R2) hierarchy (sections 5.1-5.4)
   - Status badges per section
   - Format selector (PDF / Word)
   - Generate and Cancel buttons
4. **Take a screenshot** of the eCTD dialog
5. Click **"Cancel"** to close

### Test 11.10: SDTM Templates Dialog

1. Click **"Export"** again to reopen the dropdown
2. Click **"SDTM Templates"**
3. A dialog should open with:
   - Title: **"SDTM Templates"** (or similar)
   - Two sections of CDISC domains:
     - **Trial Design Domains:** TS, TA, TE, TI, TV (5 domains)
     - **Clinical Domains:** DM, AE, CM, LB, VS (5 domains)
   - Checkboxes for each domain with description
   - A **"Select All"** toggle
   - Variable count summary (e.g., "N variables across selected domains")
   - **"Generate ZIP"** and **"Cancel"** buttons
4. Click **"Select All"** to check all domains
5. **Take a screenshot** of the SDTM dialog with all domains selected
6. Click **"Cancel"** to close

> Stop GIF recording for Phase 11

---

## PHASE 12 — Enterprise Settings

> Start GIF recording: name it `phase12-enterprise-walkthrough.gif`

### Test 12.1: Navigate to Settings

1. Navigate to `http://localhost:3000/app/settings`
2. Wait for the page to load
3. The page should show:
   - Title: **"Settings"** (or "Workspace Settings")
   - Subtitle about workspace configuration
4. **Take a screenshot** of the settings page

### Test 12.2: Settings Tabs Overview

1. Look for the tab bar with 6 tabs:
   - **API Keys**
   - **Webhooks**
   - **SSO**
   - **Integrations**
   - **Audit Log**
   - **Compliance**
2. If you see a message like "No workspace found" or "Create a workspace first", take a screenshot of that — this is the empty state
3. **Take a screenshot** of the tab bar (or empty state)

> **NOTE:** If no workspace exists, some tabs may show empty states. That's expected.
> Take screenshots of whatever state appears — both working states and empty states
> are valid for this walkthrough.

### Test 12.3: API Keys Tab

1. Click the **"API Keys"** tab (if not already selected)
2. The panel should show:
   - Title about API key management
   - A **"Create API Key"** button
   - A table/list of existing keys (or empty state message)
3. Click **"Create API Key"**
4. A dialog should open with form fields:
   - **Name** field (text input for the key name)
   - **Expiration** or **Permissions** fields
5. **Take a screenshot** of the Create API Key dialog
6. Click **"Cancel"** to close without creating

### Test 12.4: Webhooks Tab

1. Click the **"Webhooks"** tab
2. The panel should show:
   - Title about webhook configuration
   - A **"Create Webhook"** button
   - A table/list of existing webhooks (or empty state)
3. Click **"Create Webhook"**
4. A dialog should open with form fields:
   - **URL** field (for the webhook endpoint)
   - **Events** selection (checkboxes or multi-select for event types)
   - **Secret** or authentication fields
5. **Take a screenshot** of the Create Webhook dialog
6. Click **"Cancel"** to close

### Test 12.5: SSO Tab

1. Click the **"SSO"** tab
2. The panel should show:
   - Title about SAML/SSO configuration
   - Configuration form or setup instructions
   - Fields like: Entity ID, SSO URL, Certificate, etc.
3. **Take a screenshot** of the SSO configuration panel

### Test 12.6: Integrations Tab

1. Click the **"Integrations"** tab
2. The panel should show:
   - Title about third-party integrations
   - Integration provider cards or list (e.g., REDCap, Slack, CTMS, etc.)
   - Each integration shows: name, description, status (Connected/Not connected), Configure button
3. **Take a screenshot** of the integrations panel

### Test 12.7: Audit Log Tab

1. Click the **"Audit Log"** tab
2. The panel should show:
   - Title about audit/activity log
   - Filter controls (date range, action type, user)
   - A table or list of audit log entries
   - Each entry shows: timestamp, user, action, resource, details
3. If there are filter dropdowns, try opening one
4. **Take a screenshot** of the audit log panel

### Test 12.8: Compliance Tab

1. Click the **"Compliance"** tab
2. The panel should show:
   - Compliance dashboard with status indicators
   - Data residency configuration section
   - Compliance score or status overview
   - Regulatory framework indicators (HIPAA, SOC 2, GDPR, etc.)
3. **Take a screenshot** of the compliance dashboard

> Stop GIF recording for Phase 12

---

## CLEANUP

### Delete Test Protocol

1. Navigate back to the protocol detail page (the URL from Setup Step 1)
2. Find the **"Delete"** button (should be near Export and Save buttons)
3. Click **"Delete"**
4. A confirmation dialog should appear asking to confirm deletion
5. Confirm the deletion
6. You should be redirected to the dashboard

### Delete Test Evidence

1. Navigate to `http://localhost:3000/app/evidence`
2. Find the evidence item "Effectiveness of BNT162b2 Against Hospitalisation in Older Adults"
3. Open it and delete it (if a delete option exists)
4. Or leave it — test evidence doesn't hurt anything

---

## Summary Checklist

After completing this walkthrough, verify you have screenshots or GIF recordings of:

### Phase 8 — Systematic Review

- [ ] Screening page with 4 tabs visible
- [ ] Stats bar showing 4 stages (Identification, Screening, Eligibility, Included)
- [ ] Screening card with Include/Exclude/Duplicate buttons
- [ ] Include action changing card status
- [ ] Exclude reason form with dropdown and notes
- [ ] Duplicate detection dialog
- [ ] PRISMA flow diagram
- [ ] Risk of Bias assessment panel
- [ ] Meta-Analysis panel with forest plot area

### Phase 10 — Collaboration

- [ ] Notification bell in header
- [ ] Notification popover (empty or with items)
- [ ] Comments section with input field
- [ ] Posted comment appearing in list
- [ ] Presence/collaboration indicators (if visible)

### Phase 11 — Regulatory

- [ ] Regulatory Compliance card on protocol detail
- [ ] Regulatory hub page with 3 tabs
- [ ] CONSORT checklist with expandable items
- [ ] STROBE checklist with study type selector
- [ ] ICH GCP panel with 3 collapsible sections
- [ ] Export menu showing Regulatory section
- [ ] FDA IND Package dialog with 10 sections
- [ ] eCTD Module 5 dialog with section hierarchy
- [ ] SDTM Templates dialog with domain checkboxes

### Phase 12 — Enterprise

- [ ] Settings page with 6 tabs
- [ ] API Keys panel with Create dialog
- [ ] Webhooks panel with Create dialog
- [ ] SSO configuration panel
- [ ] Integrations panel with provider cards
- [ ] Audit Log panel with filters
- [ ] Compliance dashboard

**Total: ~30 distinct feature verifications across 4 phases**
