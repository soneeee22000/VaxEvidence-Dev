import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { format } from "date-fns";
import {
  ECTD_MODULE5_SECTIONS,
  getECTDSection,
} from "@/lib/regulatory/ectd-module5-structure";
import type { ECTDPackageData } from "./ectd-pdf-generator";

// =============================================================================
// eCTD MODULE 5 WORD GENERATOR
// =============================================================================
// Generates a structured eCTD Module 5 Clinical Study Report (ICH M4E(R2))
// as a Microsoft Word document with auto-populated data from VaxEvidence.
// =============================================================================

/** Shared color constants */
const NAVY = "003366";
const LIGHT_GRAY = "F8F8FC";
const MEDIUM_GRAY = "808080";

/**
 * Helper: create a bold + normal text paragraph.
 */
function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: value, size: 20 }),
    ],
    spacing: { after: 80 },
  });
}

/**
 * Helper: create a placeholder paragraph.
 */
function placeholder(fieldName: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `[TO BE COMPLETED \u2014 requires ${fieldName}]`,
        italics: true,
        color: "B43232",
        size: 20,
      }),
    ],
    spacing: { after: 120 },
    indent: { left: 200 },
  });
}

/**
 * Helper: create a guidance box paragraph (italic, gray).
 */
function guidanceBox(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Guidance: ${text}`,
        italics: true,
        color: "505064",
        size: 16,
      }),
    ],
    spacing: { before: 100, after: 200 },
    shading: { type: ShadingType.SOLID, color: "F5F5FA" },
    indent: { left: 200, right: 200 },
  });
}

/**
 * Helper: create a section heading.
 */
function sectionHeading(number: string, title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Section ${number}: ${title}`,
        bold: true,
        color: NAVY,
        size: 28,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    pageBreakBefore: true,
  });
}

/**
 * Helper: create a subsection heading.
 */
function subHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  });
}

/**
 * Helper: body text.
 */
function bodyText(text: string, indent: number = 0): Paragraph {
  return new Paragraph({
    text,
    spacing: { after: 80 },
    indent: indent > 0 ? { left: indent } : undefined,
  });
}

/**
 * Helper: create a table row with arbitrary columns.
 */
function tableRowNCols(
  cols: string[],
  isHeader: boolean = false,
  widths?: number[],
): TableRow {
  const shading = isHeader
    ? { type: ShadingType.SOLID, color: NAVY }
    : undefined;
  const textColor = isHeader ? "FFFFFF" : "000000";
  const bold = isHeader;

  return new TableRow({
    children: cols.map(
      (col, i) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: col, bold, color: textColor, size: 18 }),
              ],
            }),
          ],
          width:
            widths && widths[i]
              ? { size: widths[i], type: WidthType.PERCENTAGE }
              : undefined,
          shading,
        }),
    ),
  });
}

/**
 * Helper: create a striped data row (alternating background).
 */
function stripedRow(
  cols: string[],
  index: number,
  widths?: number[],
): TableRow {
  const shading =
    index % 2 === 0
      ? { type: ShadingType.SOLID, color: LIGHT_GRAY }
      : undefined;

  return new TableRow({
    children: cols.map(
      (col, i) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: col, size: 18 })],
            }),
          ],
          width:
            widths && widths[i]
              ? { size: widths[i], type: WidthType.PERCENTAGE }
              : undefined,
          shading,
        }),
    ),
  });
}

/**
 * Generate a complete eCTD Module 5 Clinical Study Report as Word document.
 *
 * Follows the ICH M4E(R2) structure with auto-populated sections from
 * VaxEvidence screening, risk-of-bias, and meta-analysis data.
 */
export async function generateECTDWord(data: ECTDPackageData): Promise<Blob> {
  const {
    protocol,
    linkedEvidence,
    screeningDecisions,
    robAssessments,
    metaAnalysisEntries,
  } = data;
  const children: (Paragraph | Table)[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "CLINICAL STUDY REPORT",
          bold: true,
          color: NAVY,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "eCTD Module 5 \u2014 ICH M4E(R2)",
          color: MEDIUM_GRAY,
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
  );

  children.push(
    new Paragraph({
      text: protocol.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  );

  // Metadata table
  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRowNCols(["Field", "Value"], true, [40, 60]),
      tableRowNCols(["Protocol ID", protocol.id], false, [40, 60]),
      tableRowNCols(["Status", protocol.status.toUpperCase()], false, [40, 60]),
      tableRowNCols(
        ["Created", format(new Date(protocol.created_at), "MMMM d, yyyy")],
        false,
        [40, 60],
      ),
      tableRowNCols(
        ["Last Updated", format(new Date(protocol.updated_at), "MMMM d, yyyy")],
        false,
        [40, 60],
      ),
      tableRowNCols(
        ["Generated", format(new Date(), "MMMM d, yyyy HH:mm")],
        false,
        [40, 60],
      ),
    ],
  });

  children.push(metadataTable);
  children.push(new Paragraph({ spacing: { after: 400 } }));

  // Sponsor placeholder
  children.push(subHeading("Sponsor Information"));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "[Sponsor Name]\n[Sponsor Address]\n[Contact Person / Phone / Email]",
          italics: true,
          color: MEDIUM_GRAY,
        }),
      ],
      spacing: { after: 200 },
      indent: { left: 200 },
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.1 — TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("5.1", getECTDSection("5.1").title));

  for (const section of ECTD_MODULE5_SECTIONS) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Section ${section.sectionNumber}: `,
            bold: true,
            size: 22,
          }),
          new TextRun({ text: section.title, size: 22 }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.2 — Tabular Listing of All Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading("5.2", "Tabular Listing of All Clinical Studies"),
  );
  children.push(guidanceBox(getECTDSection("5.2").guidance));

  const includedDecisions = screeningDecisions.filter(
    (sd) => sd.decision === "include" && sd.stage === "included",
  );

  if (includedDecisions.length === 0) {
    children.push(
      bodyText(
        "No studies have passed all screening stages for this protocol.",
      ),
    );
    children.push(
      placeholder(
        "screening pipeline results (stage=included, decision=include)",
      ),
    );
  } else {
    children.push(
      bodyText(
        `${includedDecisions.length} study/studies passed all screening stages and are included in this report.`,
        200,
      ),
    );

    const colWidths = [5, 20, 40, 25, 10];
    const studyTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRowNCols(
          ["#", "Study ID", "Title", "Authors", "Status"],
          true,
          colWidths,
        ),
        ...includedDecisions.map((sd, i) => {
          const ev = sd.evidence_items;
          return stripedRow(
            [
              `${i + 1}`,
              sd.evidence_id.length > 15
                ? sd.evidence_id.substring(0, 12) + "..."
                : sd.evidence_id,
              ev ? ev.title : "N/A",
              ev?.authors || "N/A",
              "Included",
            ],
            i,
            colWidths,
          );
        }),
      ],
    });

    children.push(studyTable);
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3 — Clinical Study Reports (header only)
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("5.3", "Clinical Study Reports"));
  children.push(guidanceBox(getECTDSection("5.3").guidance));

  children.push(
    bodyText(
      "This section contains individual clinical study reports organized by study type. " +
        "Sub-sections 5.3.1 through 5.3.7 follow the ICH M4E(R2) hierarchy.",
      200,
    ),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.1 — Controlled Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading(
      "5.3.5.1",
      "Study Reports of Controlled Clinical Studies Pertinent to the Claimed Indication",
    ),
  );
  children.push(guidanceBox(getECTDSection("5.3.5.1").guidance));

  const academicEvidence = linkedEvidence.filter(
    (e) => e.evidence_items.type === "academic",
  );
  const evidenceWithRoB = academicEvidence.filter((e) =>
    robAssessments.some((rob) => rob.evidence_id === e.evidence_items.id),
  );

  if (evidenceWithRoB.length === 0) {
    children.push(
      bodyText(
        "No controlled clinical studies with risk-of-bias assessments have been linked to this protocol.",
      ),
    );
    children.push(
      placeholder(
        "academic evidence items with RoB 2 assessments (controlled trials)",
      ),
    );
  } else {
    children.push(
      bodyText(
        `${evidenceWithRoB.length} controlled clinical study/studies with risk-of-bias assessments:`,
        200,
      ),
    );

    for (let i = 0; i < evidenceWithRoB.length; i++) {
      const ev = evidenceWithRoB[i].evidence_items;
      const rob = robAssessments.find((r) => r.evidence_id === ev.id);

      // Study heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true }),
            new TextRun({ text: ev.title, bold: true }),
          ],
          spacing: { before: 150, after: 50 },
        }),
      );

      if (ev.authors) {
        children.push(labelValue("Authors", ev.authors));
      }
      if (ev.description) {
        children.push(labelValue("Study Design", ev.description));
      }

      // RoB domain judgments table
      if (rob) {
        children.push(subHeading("Risk of Bias Assessment"));
        children.push(labelValue("Tool", rob.tool));
        children.push(labelValue("Overall Judgment", rob.overall_judgment));

        const domainNames = Object.keys(rob.domains);
        if (domainNames.length > 0) {
          const domainColWidths = [40, 20, 40];
          const domainTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              tableRowNCols(
                ["Domain", "Judgment", "Justification"],
                true,
                domainColWidths,
              ),
              ...domainNames.map((domainName, d) =>
                stripedRow(
                  [
                    domainName,
                    rob.domains[domainName].judgment,
                    rob.domains[domainName].justification,
                  ],
                  d,
                  domainColWidths,
                ),
              ),
            ],
          });

          children.push(domainTable);
          children.push(new Paragraph({ spacing: { after: 200 } }));
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.2 — Uncontrolled Clinical Studies
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading("5.3.5.2", "Study Reports of Uncontrolled Clinical Studies"),
  );
  children.push(guidanceBox(getECTDSection("5.3.5.2").guidance));

  const uncontrolledEvidence = academicEvidence.filter(
    (e) =>
      !robAssessments.some((rob) => rob.evidence_id === e.evidence_items.id),
  );

  if (uncontrolledEvidence.length === 0) {
    children.push(
      bodyText(
        "No uncontrolled clinical studies have been linked to this protocol.",
      ),
    );
    children.push(
      placeholder("observational or non-randomized study evidence items"),
    );
  } else {
    children.push(
      bodyText(
        `${uncontrolledEvidence.length} uncontrolled / observational study/studies:`,
        200,
      ),
    );

    for (let i = 0; i < uncontrolledEvidence.length; i++) {
      const ev = uncontrolledEvidence[i].evidence_items;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true }),
            new TextRun({ text: ev.title, bold: true }),
          ],
          spacing: { before: 150, after: 50 },
        }),
      );

      if (ev.authors) {
        children.push(labelValue("Authors", ev.authors));
      }
      if (ev.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Summary: ", bold: true, size: 20 }),
              new TextRun({ text: ev.description, size: 20 }),
            ],
            spacing: { after: 80 },
            indent: { left: 200 },
          }),
        );
      }
      if (ev.journal) {
        children.push(labelValue("Journal", ev.journal));
      }
      if (ev.doi) {
        children.push(labelValue("DOI", ev.doi));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.3 — Multi-Study Analyses
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading(
      "5.3.5.3",
      "Reports of Analyses of Data from More Than One Study",
    ),
  );
  children.push(guidanceBox(getECTDSection("5.3.5.3").guidance));

  if (metaAnalysisEntries.length === 0) {
    children.push(
      bodyText(
        "No meta-analysis entries have been recorded for this protocol.",
      ),
    );
    children.push(
      placeholder(
        "meta-analysis entries with effect sizes and confidence intervals",
      ),
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

    children.push(subHeading("Pooled Analysis Summary"));
    children.push(labelValue("Number of studies", `${totalStudies}`));
    children.push(
      labelValue(
        "Pooled effect estimate (weighted mean)",
        pooledEffect !== null
          ? pooledEffect.toFixed(4)
          : "[Weights sum to zero]",
      ),
    );
    children.push(
      labelValue(
        "Overall CI range",
        `[${overallCILower.toFixed(4)}, ${overallCIUpper.toFixed(4)}]`,
      ),
    );

    // Individual study table
    children.push(subHeading("Individual Study Effect Sizes"));

    const maColWidths = [35, 20, 25, 20];
    const maTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRowNCols(
          ["Study", "Effect Size", "95% CI", "Weight"],
          true,
          maColWidths,
        ),
        ...metaAnalysisEntries.map((entry, i) =>
          stripedRow(
            [
              entry.study_label,
              entry.effect_size.toFixed(3),
              `[${entry.ci_lower.toFixed(3)}, ${entry.ci_upper.toFixed(3)}]`,
              `${entry.weight.toFixed(1)}%`,
            ],
            i,
            maColWidths,
          ),
        ),
      ],
    });

    children.push(maTable);
    children.push(new Paragraph({ spacing: { after: 200 } }));

    // Subgroup breakdown if present
    const subgroups = new Set(
      metaAnalysisEntries
        .filter((e) => e.subgroup)
        .map((e) => e.subgroup as string),
    );
    if (subgroups.size > 0) {
      children.push(subHeading("Subgroup Analysis"));
      for (const sg of subgroups) {
        const sgEntries = metaAnalysisEntries.filter((e) => e.subgroup === sg);
        children.push(
          bodyText(`Subgroup: ${sg} (${sgEntries.length} studies)`, 200),
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.5.4 — Other Study Reports (Template Only)
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("5.3.5.4", "Other Study Reports"));
  children.push(guidanceBox(getECTDSection("5.3.5.4").guidance));

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text:
            "[TO BE COMPLETED \u2014 Include reports of epidemiological studies, " +
            "registry-based analyses, compassionate use programs, or expanded access " +
            "studies that do not fit into sections 5.3.5.1 through 5.3.5.3.]",
          italics: true,
          color: MEDIUM_GRAY,
          size: 18,
        }),
      ],
      spacing: { after: 100 },
      indent: { left: 200 },
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.6 — Reports of Post-Marketing Experience (Template Only)
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading("5.3.6", "Reports of Post-Marketing Experience"),
  );
  children.push(guidanceBox(getECTDSection("5.3.6").guidance));

  for (const sub of [
    "1. Passive Surveillance Data (VAERS / EudraVigilance)",
    "2. Active Surveillance Findings",
    "3. Periodic Safety Update Reports (PSURs)",
    "4. Post-Authorization Safety Studies (PASS)",
  ]) {
    children.push(
      new Paragraph({
        text: sub,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "[TO BE COMPLETED]",
            italics: true,
            color: MEDIUM_GRAY,
            size: 18,
          }),
        ],
        spacing: { after: 100 },
        indent: { left: 400 },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.3.7 — Case Report Forms and Individual Patient Listings
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading(
      "5.3.7",
      "Case Report Forms and Individual Patient Listings",
    ),
  );
  children.push(guidanceBox(getECTDSection("5.3.7").guidance));

  for (const sub of [
    "1. Sample Case Report Forms (CRFs)",
    "2. Individual Patient Data Listings",
    "3. Key Safety Endpoint Listings",
    "4. Key Efficacy Endpoint Listings",
  ]) {
    children.push(
      new Paragraph({
        text: sub,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "[TO BE COMPLETED]",
            italics: true,
            color: MEDIUM_GRAY,
            size: 18,
          }),
        ],
        spacing: { after: 100 },
        indent: { left: 400 },
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5.4 — Literature References
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("5.4", "Literature References"));
  children.push(guidanceBox(getECTDSection("5.4").guidance));

  if (linkedEvidence.length === 0) {
    children.push(
      bodyText("No evidence items have been linked to this protocol."),
    );
    children.push(
      placeholder("linked evidence items for bibliography generation"),
    );
  } else {
    children.push(
      bodyText(
        `${linkedEvidence.length} reference(s) from VaxEvidence library:`,
        200,
      ),
    );

    for (let i = 0; i < linkedEvidence.length; i++) {
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

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 18 }),
            new TextRun({ text: citation, size: 18 }),
          ],
          spacing: { after: 60 },
          indent: { left: 200 },
        }),
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(new Paragraph({ spacing: { before: 600 } }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by VaxEvidence on ${format(new Date(), "MMMM d, yyyy")} \u2014 CONFIDENTIAL`,
          size: 16,
          color: MEDIUM_GRAY,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  // Build document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
