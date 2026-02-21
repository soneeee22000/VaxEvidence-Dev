import { jsPDF } from "jspdf";
import { format } from "date-fns";
import type { ProtocolRecord } from "@/lib/supabase/protocols";
import { getINDSection } from "@/lib/regulatory/ind-sections";

// =============================================================================
// IND PACKAGE PDF GENERATOR
// =============================================================================
// Generates a structured FDA IND submission package (21 CFR 312.23)
// as a multi-section PDF with auto-populated data from VaxEvidence.
// =============================================================================

/**
 * Data required to generate an IND package.
 */
export interface INDPackageData {
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
      regulatory_body?: string;
      document_type?: string;
      source_url?: string;
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
 * Generate a complete FDA IND submission package as PDF.
 */
export async function generateINDPackagePDF(
  data: INDPackageData,
): Promise<Blob> {
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

  const { protocol, linkedEvidence, robAssessments, metaAnalysisEntries } =
    data;

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
  doc.text("INVESTIGATIONAL NEW DRUG", marginLeft, 30);
  doc.setFontSize(18);
  doc.text("APPLICATION (IND)", marginLeft, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Per 21 CFR 312.23", marginLeft, 52);

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
    title: "Cover Sheet (Form FDA-1571)",
    page: 1,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS — Section (a)(2)
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  const tocPage = doc.getNumberOfPages();
  sectionPages.push({
    number: "(a)(2)",
    title: "Table of Contents",
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
  // SECTION (a)(3): Introductory Statement
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(3)",
    title: "Introductory Statement and General Investigational Plan",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader(
    "(a)(3)",
    "Introductory Statement and General Investigational Plan",
  );
  addGuidanceBox(getINDSection("(a)(3)").guidance);

  // Auto-populate from study question
  addText("1. Research Question and Rationale", 12, true);
  y += 3;
  if (protocol.study_question) {
    addText(protocol.study_question, 10, false, 5);
  } else {
    addPlaceholder("study_question");
  }
  y += 5;

  // Drug/vaccine identification
  addText("2. Investigational Product Identification", 12, true);
  y += 3;
  if (protocol.intervention) {
    addText(`Intervention: ${protocol.intervention}`, 10, false, 5);
  } else {
    addPlaceholder("intervention");
  }
  y += 5;

  // Target population
  addText("3. Target Population", 12, true);
  y += 3;
  if (protocol.population) {
    addText(protocol.population, 10, false, 5);
  } else {
    addPlaceholder("population");
  }
  y += 5;

  // Study design overview
  addText("4. General Investigational Plan", 12, true);
  y += 3;
  if (protocol.design) {
    addText(`Study Design: ${protocol.design}`, 10, false, 5);
  } else {
    addPlaceholder("study design");
  }
  y += 3;
  addText("[Estimated number of patients: _______]", 10, false, 5);
  y += 3;
  addText("[Duration of treatment/follow-up: _______]", 10, false, 5);
  y += 3;
  addText("[Clinical sites: _______]", 10, false, 5);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(4): Investigator's Brochure
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(4)",
    title: "Investigator's Brochure",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(4)", "Investigator's Brochure");
  addGuidanceBox(getINDSection("(a)(4)").guidance);

  const ibSections = [
    "1. Table of Contents",
    "2. Summary",
    "3. Introduction",
    "4. Physical, Chemical, and Pharmaceutical Properties",
    "5. Nonclinical Studies",
    "6. Effects in Humans",
    "7. Summary of Data and Guidance for the Investigator",
  ];

  for (const ibSection of ibSections) {
    addText(ibSection, 11, true);
    y += 2;
    addText(
      "[TO BE COMPLETED \u2014 Refer to ICH E6(R2) Section 7 for required content.]",
      9,
      false,
      5,
    );
    y += 5;
  }

  // Include evidence summary if available
  if (linkedEvidence.length > 0) {
    checkPageBreak(20);
    y += 5;
    addText("Referenced Evidence from VaxEvidence Library", 12, true);
    y += 3;
    addText(
      `The following ${linkedEvidence.length} evidence item(s) are linked to this protocol and may inform IB sections:`,
      9,
      false,
      5,
    );
    y += 3;

    const maxItems = Math.min(linkedEvidence.length, 10);
    for (let i = 0; i < maxItems; i++) {
      checkPageBreak(12);
      const ev = linkedEvidence[i].evidence_items;
      addText(`${i + 1}. ${ev.title}`, 9, false, 5);
      if (ev.authors) {
        addText(`Authors: ${ev.authors}`, 8, false, 10);
      }
    }
    if (linkedEvidence.length > 10) {
      addText(
        `... and ${linkedEvidence.length - 10} more items (see Section (a)(8) for full list).`,
        8,
        false,
        5,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(5): Clinical Protocol(s)
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(5)",
    title: "Clinical Protocol(s)",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(5)", "Clinical Protocol(s)");
  addGuidanceBox(getINDSection("(a)(5)").guidance);

  // Protocol title
  addText("Protocol Title", 12, true);
  y += 3;
  addText(protocol.title, 10, false, 5);
  y += 5;

  // Study Objectives
  addText("1. Study Objectives", 12, true);
  y += 3;
  if (protocol.study_question) {
    addText(`Primary Objective: ${protocol.study_question}`, 10, false, 5);
  } else {
    addPlaceholder("study_question");
  }
  y += 5;

  // Study Design
  addText("2. Study Design", 12, true);
  y += 3;
  if (protocol.design) {
    addText(protocol.design, 10, false, 5);
  } else {
    addPlaceholder("study design");
  }
  y += 5;

  // Patient Selection (PICO Population)
  addText("3. Patient Selection Criteria", 12, true);
  y += 3;
  addText("3.1 Inclusion Criteria (Population)", 11, true, 5);
  if (protocol.population) {
    addText(protocol.population, 10, false, 10);
  } else {
    addPlaceholder("population");
  }
  y += 3;
  addText("3.2 Exclusion Criteria", 11, true, 5);
  addText(
    "[TO BE COMPLETED \u2014 List specific exclusion criteria]",
    10,
    false,
    10,
  );
  y += 5;

  // Intervention
  addText("4. Intervention / Investigational Product", 12, true);
  y += 3;
  if (protocol.intervention) {
    addText(protocol.intervention, 10, false, 5);
  } else {
    addPlaceholder("intervention");
  }
  y += 3;
  addText("[Dosage: _______]", 10, false, 5);
  addText("[Route of administration: _______]", 10, false, 5);
  addText("[Duration of treatment: _______]", 10, false, 5);
  y += 5;

  // Comparator
  addText("5. Control / Comparator", 12, true);
  y += 3;
  if (protocol.comparator) {
    addText(protocol.comparator, 10, false, 5);
  } else {
    addPlaceholder("comparator");
  }
  y += 5;

  // Outcomes / Efficacy Parameters
  addText("6. Efficacy Parameters (Outcome Measures)", 12, true);
  y += 3;
  if (protocol.outcomes) {
    addText(protocol.outcomes, 10, false, 5);
  } else {
    addPlaceholder("outcomes");
  }
  y += 5;

  // Statistical methods placeholder
  addText("7. Statistical Methods", 12, true);
  y += 3;
  addText(
    "[TO BE COMPLETED \u2014 Describe primary analysis, sample size justification, " +
      "interim analyses, and stopping rules.]",
    10,
    false,
    5,
  );
  y += 5;

  // Safety monitoring
  addText("8. Safety Monitoring", 12, true);
  y += 3;
  addText(
    "[TO BE COMPLETED \u2014 Describe safety monitoring plan, adverse event reporting, " +
      "Data Safety Monitoring Board (DSMB) procedures.]",
    10,
    false,
    5,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(6): CMC — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(6)",
    title: "Chemistry, Manufacturing, and Controls (CMC)",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(6)", "Chemistry, Manufacturing, and Controls (CMC)");
  addGuidanceBox(getINDSection("(a)(6)").guidance);

  const cmcSections = [
    "1. Drug Substance",
    "  1.1 Description and Characterization",
    "  1.2 Manufacturer(s)",
    "  1.3 Method of Manufacture",
    "  1.4 Control of Drug Substance (Specifications)",
    "  1.5 Stability",
    "2. Drug Product",
    "  2.1 Components",
    "  2.2 Manufacturer(s)",
    "  2.3 Method of Manufacture",
    "  2.4 Control of Drug Product (Specifications)",
    "  2.5 Container Closure System",
    "  2.6 Stability",
    "3. Labeling",
    "4. Environmental Assessment",
  ];

  for (const s of cmcSections) {
    addText(s, s.startsWith("  ") ? 10 : 11, !s.startsWith("  "));
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(7): Pharmacology and Toxicology — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(7)",
    title: "Pharmacology and Toxicology Information",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(7)", "Pharmacology and Toxicology Information");
  addGuidanceBox(getINDSection("(a)(7)").guidance);

  const toxSections = [
    "1. Pharmacological Effects and Mechanism of Action",
    "2. Absorption, Distribution, Metabolism, Excretion (ADME)",
    "3. Integrated Summary of Toxicological Findings",
    "  3.1 Single-Dose Toxicity",
    "  3.2 Repeat-Dose Toxicity",
    "  3.3 Genotoxicity",
    "  3.4 Reproductive and Developmental Toxicity",
    "  3.5 Local Tolerance",
    "4. GLP Compliance Statement",
  ];

  for (const s of toxSections) {
    addText(s, s.startsWith("  ") ? 10 : 11, !s.startsWith("  "));
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(8): Previous Human Experience
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(8)",
    title: "Previous Human Experience",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader(
    "(a)(8)",
    "Previous Human Experience with the Investigational Drug",
  );
  addGuidanceBox(getINDSection("(a)(8)").guidance);

  if (linkedEvidence.length === 0) {
    addText(
      "No previous human experience data has been linked to this protocol in VaxEvidence.",
      10,
    );
    y += 3;
    addText(
      "[TO BE COMPLETED \u2014 Summarize prior clinical investigations, published reports, " +
        "and any foreign marketing experience with this investigational product.]",
      10,
      false,
      5,
    );
  } else {
    // Academic evidence
    const academic = linkedEvidence.filter(
      (e) => e.evidence_items.type === "academic",
    );
    const regulatory = linkedEvidence.filter(
      (e) => e.evidence_items.type === "regulatory",
    );
    const other = linkedEvidence.filter(
      (e) =>
        e.evidence_items.type !== "academic" &&
        e.evidence_items.type !== "regulatory",
    );

    if (academic.length > 0) {
      addText(
        `1. Published Clinical Evidence (${academic.length} items)`,
        12,
        true,
      );
      y += 3;

      // Evidence summary table header
      checkPageBreak(15);
      doc.setFillColor(0, 51, 102);
      doc.rect(marginLeft, y, contentWidth, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("#", marginLeft + 2, y + 5);
      doc.text("Title", marginLeft + 10, y + 5);
      doc.text("Authors", marginLeft + 95, y + 5);
      doc.text("Journal / DOI", marginLeft + 130, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 9;

      for (let i = 0; i < academic.length; i++) {
        checkPageBreak(15);
        const ev = academic[i].evidence_items;

        // Alternating row background
        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 252);
          doc.rect(marginLeft, y - 2, contentWidth, 10, "F");
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`${i + 1}`, marginLeft + 2, y + 3);

        // Title (truncated)
        const titleTrunc =
          ev.title.length > 50 ? ev.title.substring(0, 47) + "..." : ev.title;
        doc.text(titleTrunc, marginLeft + 10, y + 3);

        // Authors (truncated)
        const authorsTrunc = ev.authors
          ? ev.authors.length > 25
            ? ev.authors.substring(0, 22) + "..."
            : ev.authors
          : "N/A";
        doc.text(authorsTrunc, marginLeft + 95, y + 3);

        // Journal/DOI
        const journalDoi = ev.doi || ev.journal || "N/A";
        const jdTrunc =
          journalDoi.length > 30
            ? journalDoi.substring(0, 27) + "..."
            : journalDoi;
        doc.text(jdTrunc, marginLeft + 130, y + 3);

        y += 10;
      }
      y += 5;

      // Detailed evidence list
      addText("Detailed Evidence Summaries", 11, true);
      y += 3;

      for (let i = 0; i < academic.length; i++) {
        checkPageBreak(25);
        const ev = academic[i].evidence_items;
        const note = academic[i].note;

        addText(`${i + 1}. ${ev.title}`, 10, true, 5);
        if (ev.authors) addText(`Authors: ${ev.authors}`, 9, false, 10);
        if (ev.journal) addText(`Journal: ${ev.journal}`, 9, false, 10);
        if (ev.doi) addText(`DOI: ${ev.doi}`, 9, false, 10);
        if (ev.publication_date) {
          addText(`Published: ${ev.publication_date}`, 9, false, 10);
        }
        if (ev.description) {
          addText(`Summary: ${ev.description}`, 9, false, 10);
        }
        if (note) {
          doc.setFont("helvetica", "italic");
          addText(`Note: ${note}`, 9, false, 10);
          doc.setFont("helvetica", "normal");
        }
        y += 3;
      }
    }

    if (regulatory.length > 0) {
      checkPageBreak(15);
      y += 5;
      addText(`2. Regulatory Documents (${regulatory.length} items)`, 12, true);
      y += 3;

      for (let i = 0; i < regulatory.length; i++) {
        checkPageBreak(15);
        const ev = regulatory[i].evidence_items;
        addText(`${i + 1}. ${ev.title}`, 10, true, 5);
        if (ev.regulatory_body) {
          addText(`Agency: ${ev.regulatory_body}`, 9, false, 10);
        }
        if (ev.document_type) {
          addText(`Type: ${ev.document_type}`, 9, false, 10);
        }
        if (ev.source_url) {
          addText(`URL: ${ev.source_url}`, 9, false, 10);
        }
        if (ev.description) {
          addText(`Summary: ${ev.description}`, 9, false, 10);
        }
        y += 3;
      }
    }

    if (other.length > 0) {
      checkPageBreak(15);
      y += 5;
      addText(`3. Other Evidence (${other.length} items)`, 12, true);
      y += 3;

      for (let i = 0; i < other.length; i++) {
        checkPageBreak(12);
        const ev = other[i].evidence_items;
        addText(`${i + 1}. [${ev.type}] ${ev.title}`, 10, false, 5);
        if (ev.description) {
          addText(ev.description, 9, false, 10);
        }
        y += 2;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(9): Additional Information — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(9)",
    title: "Additional Information",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(9)", "Additional Information");
  addGuidanceBox(getINDSection("(a)(9)").guidance);

  const addlSections = [
    "1. Drug Dependence and Abuse Potential",
    "2. Radioactive Drug Data (if applicable)",
    "3. Pediatric Study Plans (if applicable)",
    "4. Other Relevant Data",
  ];

  for (const s of addlSections) {
    addText(s, 11, true);
    y += 2;
    addText("[TO BE COMPLETED]", 9, false, 5);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(10): Relevant Information
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage();
  y = 20;
  sectionPages.push({
    number: "(a)(10)",
    title: "Relevant Information",
    page: doc.getNumberOfPages(),
  });

  addSectionHeader("(a)(10)", "Relevant Information");
  addGuidanceBox(getINDSection("(a)(10)").guidance);

  // Risk of Bias summary
  if (robAssessments.length > 0) {
    addText("Risk of Bias Assessment Summary", 12, true);
    y += 3;
    addText(
      `${robAssessments.length} risk-of-bias assessments have been completed for evidence linked to this protocol.`,
      10,
      false,
      5,
    );
    y += 5;

    // Summary table
    checkPageBreak(15);
    doc.setFillColor(0, 51, 102);
    doc.rect(marginLeft, y, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("#", marginLeft + 2, y + 5);
    doc.text("Tool", marginLeft + 10, y + 5);
    doc.text("Overall Judgment", marginLeft + 50, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 9;

    for (let i = 0; i < robAssessments.length; i++) {
      checkPageBreak(10);
      const rob = robAssessments[i];
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(marginLeft, y - 2, contentWidth, 8, "F");
      }
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}`, marginLeft + 2, y + 3);
      doc.text(rob.tool, marginLeft + 10, y + 3);
      doc.text(rob.overall_judgment, marginLeft + 50, y + 3);
      y += 8;
    }
    y += 5;
  }

  // Meta-analysis summary
  if (metaAnalysisEntries.length > 0) {
    checkPageBreak(20);
    addText("Meta-Analysis Summary", 12, true);
    y += 3;
    addText(
      `${metaAnalysisEntries.length} study-level effect sizes have been entered for meta-analysis.`,
      10,
      false,
      5,
    );
    y += 5;

    // Summary table
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
    y += 5;
  }

  if (robAssessments.length === 0 && metaAnalysisEntries.length === 0) {
    addText(
      "No systematic review data (risk-of-bias assessments or meta-analysis entries) " +
        "has been recorded for this protocol.",
      10,
    );
    y += 3;
    addText(
      "[TO BE COMPLETED \u2014 Include any additional information relevant to the " +
        "safety or effectiveness of the investigational product.]",
      10,
      false,
      5,
    );
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

    // Dotted line to page number
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
      `VaxEvidence \u2014 FDA IND Application (21 CFR 312.23) \u2014 CONFIDENTIAL`,
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
