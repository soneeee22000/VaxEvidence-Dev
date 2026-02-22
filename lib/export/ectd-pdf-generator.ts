import { jsPDF } from "jspdf";
import { format } from "date-fns";
import type { ProtocolRecord } from "@/lib/supabase/protocols";
import { getECTDSection } from "@/lib/regulatory/ectd-module5-structure";

// =============================================================================
// eCTD MODULE 5 PDF GENERATOR
// =============================================================================
// Generates a structured eCTD Module 5 Clinical Study Report (ICH M4E(R2))
// as a multi-section PDF with auto-populated data from VaxEvidence.
// =============================================================================

/**
 * Data required to generate an eCTD Module 5 Clinical Study Report.
 */
export interface ECTDPackageData {
  protocol: ProtocolRecord;
  linkedEvidence: Array<{
    note?: string;
    evidence_items: {
      id: string;
      type: string;
      title: string;
      description?: string;
      authors?: string;
      journal?: string;
      doi?: string;
      publication_date?: string;
    };
  }>;
  screeningDecisions: Array<{
    evidence_id: string;
    stage: string;
    decision: string;
    evidence_items?: {
      id: string;
      title: string;
      type: string;
      authors?: string;
    };
  }>;
  robAssessments: Array<{
    evidence_id: string;
    tool: string;
    overall_judgment: string;
    domains: Record<string, { judgment: string; justification: string }>;
  }>;
  metaAnalysisEntries: Array<{
    study_label: string;
    effect_size: number;
    ci_lower: number;
    ci_upper: number;
    weight: number;
    subgroup?: string;
  }>;
}

/**
 * Generate a complete eCTD Module 5 Clinical Study Report as PDF.
 *
 * Follows the ICH M4E(R2) structure with auto-populated sections from
 * VaxEvidence screening, risk-of-bias, and meta-analysis data.
 */
export async function generateECTDPDF(data: ECTDPackageData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── Helpers ──

  const checkPageBreak = (needed: number = 15): boolean => {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    fontSize: number = 10,
    isBold: boolean = false,
    indent: number = 0,
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, marginLeft + indent, y);
      y += fontSize * 0.4 + 1;
    }
  };

  const addSectionHeader = (number: string, title: string) => {
    checkPageBreak(20);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text(`Section ${number}: ${title}`, marginLeft, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
  };

  const addGuidanceBox = (text: string) => {
    checkPageBreak(20);
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(180, 180, 200);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    const boxHeight = lines.length * 4.5 + 8;
    checkPageBreak(boxHeight);
    doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 2, 2, "FD");
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 100);
    for (const line of lines) {
      doc.text(line, marginLeft + 5, y);
      y += 4.5;
    }
    doc.setTextColor(0, 0, 0);
    y += 5;
  };

  const addPlaceholder = (fieldName: string) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(180, 50, 50);
    doc.text(
      `[TO BE COMPLETED \u2014 requires ${fieldName}]`,
      marginLeft + 5,
      y,
    );
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  const addLabelValue = (label: string, value: string) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, marginLeft + 5, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    const valueLines = doc.splitTextToSize(
      value,
      contentWidth - 10 - labelWidth,
    );
    for (let i = 0; i < valueLines.length; i++) {
      if (i === 0) {
        doc.text(valueLines[i], marginLeft + 5 + labelWidth, y);
      } else {
        y += 5;
        checkPageBreak(6);
        doc.text(valueLines[i], marginLeft + 5 + labelWidth, y);
      }
    }
    y += 6;
  };

  const {
    protocol,
    linkedEvidence,
    screeningDecisions,
    robAssessments,
    metaAnalysisEntries,
  } = data;

  // Track section page numbers for TOC
  const sectionPages: Array<{ number: string; title: string; page: number }> =
    [];

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("CLINICAL STUDY REPORT", marginLeft, 30);
  doc.setFontSize(18);
  doc.text("eCTD Module 5 \u2014 ICH M4E(R2)", marginLeft, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Electronic Common Technical Document", marginLeft, 52);

  y = 75;
  doc.setTextColor(0, 0, 0);

  // Protocol title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(protocol.title, contentWidth);
  for (const line of titleLines) {
    doc.text(line, marginLeft, y);
    y += 7;
  }
  y += 10;

  // Metadata box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(marginLeft, y, contentWidth, 50, 2, 2, "FD");
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const metaItems = [
    ["Protocol ID", protocol.id],
    ["Status", protocol.status.toUpperCase()],
    ["Created", format(new Date(protocol.created_at), "MMMM d, yyyy")],
    ["Last Updated", format(new Date(protocol.updated_at), "MMMM d, yyyy")],
    ["Generated", format(new Date(), "MMMM d, yyyy HH:mm")],
  ];

  for (const [label, value] of metaItems) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginLeft + 5, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, marginLeft + 45, y);
    y += 6;
  }
  y += 15;

  // Sponsor placeholder
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Sponsor Information", marginLeft, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("[Sponsor Name]", marginLeft + 5, y);
  y += 5;
  doc.text("[Sponsor Address]", marginLeft + 5, y);
  y += 5;
  doc.text("[Contact Person / Phone / Email]", marginLeft + 5, y);
  doc.setTextColor(0, 0, 0);

  sectionPages.push({
    number: "Cover",
    title: "Cover Page",
    page: 1,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.1 — Table of Contents
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  const tocPage = doc.getNumberOfPages();
  sectionPages.push({
    number: "5.1",
    title: getECTDSection("5.1").title,
    page: tocPage,
  });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 51, 102);
  doc.text("Table of Contents", marginLeft, y);
  doc.setTextColor(0, 0, 0);
  y += 15;

  // We'll fill TOC at the end once we know page numbers
  const tocYStart = y;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.2 — Tabular Listing of All Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.2",
    title: getECTDSection("5.2").title,
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.2", "Tabular Listing of All Clinical Studies");
  addGuidanceBox(getECTDSection("5.2").guidance);

  // Filter included studies from screening
  const includedDecisions = screeningDecisions.filter(
    (sd) => sd.decision === "include" && sd.stage === "included",
  );

  if (includedDecisions.length === 0) {
    addText(
      "No studies have passed all screening stages for this protocol.",
      10,
    );
    y += 3;
    addPlaceholder(
      "screening pipeline results (stage=included, decision=include)",
    );
  } else {
    addText(
      `${includedDecisions.length} study/studies passed all screening stages and are included in this report.`,
      10,
    );
    y += 5;

    // Table header
    checkPageBreak(15);
    doc.setFillColor(0, 51, 102);
    doc.rect(marginLeft, y, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("#", marginLeft + 2, y + 5);
    doc.text("Study ID", marginLeft + 10, y + 5);
    doc.text("Title", marginLeft + 40, y + 5);
    doc.text("Authors", marginLeft + 110, y + 5);
    doc.text("Status", marginLeft + 150, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 9;

    for (let i = 0; i < includedDecisions.length; i++) {
      checkPageBreak(15);
      const sd = includedDecisions[i];
      const ev = sd.evidence_items;

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(marginLeft, y - 2, contentWidth, 10, "F");
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}`, marginLeft + 2, y + 3);

      // Study ID (evidence_id truncated)
      const studyId =
        sd.evidence_id.length > 15
          ? sd.evidence_id.substring(0, 12) + "..."
          : sd.evidence_id;
      doc.text(studyId, marginLeft + 10, y + 3);

      // Title
      const titleTrunc = ev
        ? ev.title.length > 40
          ? ev.title.substring(0, 37) + "..."
          : ev.title
        : "N/A";
      doc.text(titleTrunc, marginLeft + 40, y + 3);

      // Authors
      const authorsTrunc = ev?.authors
        ? ev.authors.length > 25
          ? ev.authors.substring(0, 22) + "..."
          : ev.authors
        : "N/A";
      doc.text(authorsTrunc, marginLeft + 110, y + 3);

      // Status
      doc.text("Included", marginLeft + 150, y + 3);

      y += 10;
    }
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3 — Clinical Study Reports (header only)
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3",
    title: getECTDSection("5.3").title,
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.3", "Clinical Study Reports");
  addGuidanceBox(getECTDSection("5.3").guidance);

  addText(
    "This section contains individual clinical study reports organized by study type. " +
      "Sub-sections 5.3.1 through 5.3.7 follow the ICH M4E(R2) hierarchy.",
    10,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.1 — Controlled Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.5.1",
    title: "Controlled Clinical Studies",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader(
    "5.3.5.1",
    "Study Reports of Controlled Clinical Studies Pertinent to the Claimed Indication",
  );
  addGuidanceBox(getECTDSection("5.3.5.1").guidance);

  // Filter academic evidence with RoB assessments (RCTs)
  const academicEvidence = linkedEvidence.filter(
    (e) => e.evidence_items.type === "academic",
  );
  const evidenceWithRoB = academicEvidence.filter((e) =>
    robAssessments.some((rob) => rob.evidence_id === e.evidence_items.id),
  );

  if (evidenceWithRoB.length === 0) {
    addText(
      "No controlled clinical studies with risk-of-bias assessments have been linked to this protocol.",
      10,
    );
    y += 3;
    addPlaceholder(
      "academic evidence items with RoB 2 assessments (controlled trials)",
    );
  } else {
    addText(
      `${evidenceWithRoB.length} controlled clinical study/studies with risk-of-bias assessments:`,
      10,
      true,
    );
    y += 5;

    for (let i = 0; i < evidenceWithRoB.length; i++) {
      checkPageBreak(30);
      const ev = evidenceWithRoB[i].evidence_items;
      const rob = robAssessments.find((r) => r.evidence_id === ev.id);

      addText(`${i + 1}. ${ev.title}`, 11, true, 5);
      if (ev.authors) {
        addLabelValue("Authors", ev.authors);
      }
      if (ev.description) {
        addLabelValue("Study Design", ev.description);
      }
      y += 3;

      // RoB domain judgments sub-table
      if (rob) {
        addText("Risk of Bias Assessment", 10, true, 10);
        addLabelValue("Tool", rob.tool);
        addLabelValue("Overall Judgment", rob.overall_judgment);
        y += 2;

        const domainNames = Object.keys(rob.domains);
        if (domainNames.length > 0) {
          // Domain table header
          checkPageBreak(15);
          doc.setFillColor(0, 51, 102);
          doc.rect(marginLeft + 10, y, contentWidth - 20, 7, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Domain", marginLeft + 12, y + 5);
          doc.text("Judgment", marginLeft + 80, y + 5);
          doc.text("Justification", marginLeft + 110, y + 5);
          doc.setTextColor(0, 0, 0);
          y += 9;

          for (let d = 0; d < domainNames.length; d++) {
            checkPageBreak(10);
            const domainName = domainNames[d];
            const domain = rob.domains[domainName];

            if (d % 2 === 0) {
              doc.setFillColor(248, 248, 252);
              doc.rect(marginLeft + 10, y - 2, contentWidth - 20, 8, "F");
            }

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");

            const domainTrunc =
              domainName.length > 35
                ? domainName.substring(0, 32) + "..."
                : domainName;
            doc.text(domainTrunc, marginLeft + 12, y + 3);
            doc.text(domain.judgment, marginLeft + 80, y + 3);

            const justTrunc =
              domain.justification.length > 30
                ? domain.justification.substring(0, 27) + "..."
                : domain.justification;
            doc.text(justTrunc, marginLeft + 110, y + 3);
            y += 8;
          }
        }
      }
      y += 5;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.2 — Uncontrolled Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.5.2",
    title: "Uncontrolled Clinical Studies",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.3.5.2", "Study Reports of Uncontrolled Clinical Studies");
  addGuidanceBox(getECTDSection("5.3.5.2").guidance);

  // Observational / non-RCT evidence (academic without RoB, or non-academic types)
  const uncontrolledEvidence = academicEvidence.filter(
    (e) =>
      !robAssessments.some((rob) => rob.evidence_id === e.evidence_items.id),
  );

  if (uncontrolledEvidence.length === 0) {
    addText(
      "No uncontrolled clinical studies have been linked to this protocol.",
      10,
    );
    y += 3;
    addPlaceholder("observational or non-randomized study evidence items");
  } else {
    addText(
      `${uncontrolledEvidence.length} uncontrolled / observational study/studies:`,
      10,
      true,
    );
    y += 5;

    for (let i = 0; i < uncontrolledEvidence.length; i++) {
      checkPageBreak(20);
      const ev = uncontrolledEvidence[i].evidence_items;

      addText(`${i + 1}. ${ev.title}`, 11, true, 5);
      if (ev.authors) {
        addLabelValue("Authors", ev.authors);
      }
      if (ev.description) {
        addText(`Summary: ${ev.description}`, 9, false, 10);
      }
      if (ev.journal) {
        addLabelValue("Journal", ev.journal);
      }
      if (ev.doi) {
        addLabelValue("DOI", ev.doi);
      }
      y += 5;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.3 — Multi-Study Analyses
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.5.3",
    title: "Reports of Analyses of Data from More Than One Study",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader(
    "5.3.5.3",
    "Reports of Analyses of Data from More Than One Study",
  );
  addGuidanceBox(getECTDSection("5.3.5.3").guidance);

  if (metaAnalysisEntries.length === 0) {
    addText(
      "No meta-analysis entries have been recorded for this protocol.",
      10,
    );
    y += 3;
    addPlaceholder(
      "meta-analysis entries with effect sizes and confidence intervals",
    );
  } else {
    // Summary statistics
    const totalStudies = metaAnalysisEntries.length;
    const totalWeight = metaAnalysisEntries.reduce(
      (sum, e) => sum + e.weight,
      0,
    );
    const pooledEffect =
      totalWeight > 0
        ? metaAnalysisEntries.reduce(
            (sum, e) => sum + e.effect_size * e.weight,
            0,
          ) / totalWeight
        : null;
    const overallCILower = Math.min(
      ...metaAnalysisEntries.map((e) => e.ci_lower),
    );
    const overallCIUpper = Math.max(
      ...metaAnalysisEntries.map((e) => e.ci_upper),
    );

    addText("Pooled Analysis Summary", 12, true);
    y += 3;
    addLabelValue("Number of studies", `${totalStudies}`);
    addLabelValue(
      "Pooled effect estimate (weighted mean)",
      pooledEffect !== null ? pooledEffect.toFixed(4) : "[Weights sum to zero]",
    );
    addLabelValue(
      "Overall CI range",
      `[${overallCILower.toFixed(4)}, ${overallCIUpper.toFixed(4)}]`,
    );
    y += 5;

    // Individual study table
    addText("Individual Study Effect Sizes", 12, true);
    y += 3;

    checkPageBreak(15);
    doc.setFillColor(0, 51, 102);
    doc.rect(marginLeft, y, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Study", marginLeft + 2, y + 5);
    doc.text("Effect Size", marginLeft + 65, y + 5);
    doc.text("95% CI", marginLeft + 95, y + 5);
    doc.text("Weight", marginLeft + 135, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 9;

    for (let i = 0; i < metaAnalysisEntries.length; i++) {
      checkPageBreak(10);
      const entry = metaAnalysisEntries[i];

      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(marginLeft, y - 2, contentWidth, 8, "F");
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      const label =
        entry.study_label.length > 35
          ? entry.study_label.substring(0, 32) + "..."
          : entry.study_label;
      doc.text(label, marginLeft + 2, y + 3);
      doc.text(entry.effect_size.toFixed(3), marginLeft + 65, y + 3);
      doc.text(
        `[${entry.ci_lower.toFixed(3)}, ${entry.ci_upper.toFixed(3)}]`,
        marginLeft + 95,
        y + 3,
      );
      doc.text(`${entry.weight.toFixed(1)}%`, marginLeft + 135, y + 3);
      y += 8;
    }

    // Subgroup breakdown if present
    const subgroups = new Set(
      metaAnalysisEntries
        .filter((e) => e.subgroup)
        .map((e) => e.subgroup as string),
    );
    if (subgroups.size > 0) {
      y += 5;
      addText("Subgroup Analysis", 12, true);
      y += 3;
      for (const sg of subgroups) {
        const sgEntries = metaAnalysisEntries.filter((e) => e.subgroup === sg);
        addText(`Subgroup: ${sg} (${sgEntries.length} studies)`, 10, true, 5);
        y += 2;
      }
    }
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.4 — Other Study Reports (Template Only)
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.5.4",
    title: "Other Study Reports",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.3.5.4", "Other Study Reports");
  addGuidanceBox(getECTDSection("5.3.5.4").guidance);

  addText(
    "[TO BE COMPLETED \u2014 Include reports of epidemiological studies, registry-based " +
      "analyses, compassionate use programs, or expanded access studies that do not fit " +
      "into sections 5.3.5.1 through 5.3.5.3.]",
    10,
    false,
    5,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.6 — Reports of Post-Marketing Experience (Template Only)
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.6",
    title: "Reports of Post-Marketing Experience",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.3.6", "Reports of Post-Marketing Experience");
  addGuidanceBox(getECTDSection("5.3.6").guidance);

  const postMarketingSections = [
    "1. Passive Surveillance Data (VAERS / EudraVigilance)",
    "2. Active Surveillance Findings",
    "3. Periodic Safety Update Reports (PSURs)",
    "4. Post-Authorization Safety Studies (PASS)",
  ];

  for (const s of postMarketingSections) {
    addText(s, 11, true);
    y += 2;
    addText("[TO BE COMPLETED]", 9, false, 5);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.7 — Case Report Forms and Individual Patient Listings
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.3.7",
    title: "Case Report Forms and Individual Patient Listings",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader(
    "5.3.7",
    "Case Report Forms and Individual Patient Listings",
  );
  addGuidanceBox(getECTDSection("5.3.7").guidance);

  const crfSections = [
    "1. Sample Case Report Forms (CRFs)",
    "2. Individual Patient Data Listings",
    "3. Key Safety Endpoint Listings",
    "4. Key Efficacy Endpoint Listings",
  ];

  for (const s of crfSections) {
    addText(s, 11, true);
    y += 2;
    addText("[TO BE COMPLETED]", 9, false, 5);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.4 — Literature References
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "5.4",
    title: getECTDSection("5.4").title,
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("5.4", "Literature References");
  addGuidanceBox(getECTDSection("5.4").guidance);

  if (linkedEvidence.length === 0) {
    addText("No evidence items have been linked to this protocol.", 10);
    y += 3;
    addPlaceholder("linked evidence items for bibliography generation");
  } else {
    addText(
      `${linkedEvidence.length} reference(s) from VaxEvidence library:`,
      10,
      true,
    );
    y += 5;

    for (let i = 0; i < linkedEvidence.length; i++) {
      checkPageBreak(15);
      const ev = linkedEvidence[i].evidence_items;

      // Format: Authors. Title. Journal, Date. DOI.
      const parts: string[] = [];
      if (ev.authors) {
        parts.push(ev.authors);
      }
      parts.push(ev.title);
      if (ev.journal) {
        parts.push(ev.journal);
      }
      if (ev.publication_date) {
        parts.push(ev.publication_date);
      }
      if (ev.doi) {
        parts.push(`DOI: ${ev.doi}`);
      }

      const citation = parts.join(". ") + ".";
      addText(`${i + 1}. ${citation}`, 9, false, 5);
      y += 2;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BACK-FILL TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setPage(tocPage);
  let tocY = tocYStart;

  doc.setFontSize(11);
  for (const sp of sectionPages) {
    doc.setFont("helvetica", "bold");
    doc.text(`Section ${sp.number}`, marginLeft, tocY);
    doc.setFont("helvetica", "normal");
    doc.text(sp.title, marginLeft + 35, tocY);

    // Page number
    const pageNumX = pageWidth - marginRight - 10;
    doc.text(`${sp.page}`, pageNumX, tocY);
    tocY += 8;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER ON EVERY PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `VaxEvidence \u2014 eCTD Module 5 Clinical Study Report (ICH M4E(R2)) \u2014 CONFIDENTIAL`,
      marginLeft,
      pageHeight - 10,
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginRight - 20,
      pageHeight - 10,
    );
  }

  doc.setTextColor(0, 0, 0);
  return doc.output("blob");
}
