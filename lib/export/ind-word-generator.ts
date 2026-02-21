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
import { IND_SECTIONS, getINDSection } from "@/lib/regulatory/ind-sections";
import type { INDPackageData } from "./ind-package-generator";

// =============================================================================
// IND PACKAGE WORD GENERATOR
// =============================================================================
// Generates a structured FDA IND submission package (21 CFR 312.23)
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
 * Helper: create a simple 2-column table row.
 */
function tableRow2Col(
  col1: string,
  col2: string,
  isHeader: boolean = false,
): TableRow {
  const shading = isHeader
    ? { type: ShadingType.SOLID, color: NAVY }
    : undefined;
  const textColor = isHeader ? "FFFFFF" : "000000";
  const bold = isHeader;

  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: col1, bold, color: textColor, size: 18 }),
            ],
          }),
        ],
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading,
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: col2, bold, color: textColor, size: 18 }),
            ],
          }),
        ],
        shading,
      }),
    ],
  });
}

/**
 * Generate a complete FDA IND submission package as Word document.
 */
export async function generateINDPackageWord(
  data: INDPackageData,
): Promise<Blob> {
  const { protocol, linkedEvidence, robAssessments, metaAnalysisEntries } =
    data;
  const children: (Paragraph | Table)[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INVESTIGATIONAL NEW DRUG APPLICATION (IND)",
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
          text: "Per 21 CFR 312.23",
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
      tableRow2Col("Field", "Value", true),
      tableRow2Col("Protocol ID", protocol.id),
      tableRow2Col("Status", protocol.status.toUpperCase()),
      tableRow2Col(
        "Created",
        format(new Date(protocol.created_at), "MMMM d, yyyy"),
      ),
      tableRow2Col(
        "Last Updated",
        format(new Date(protocol.updated_at), "MMMM d, yyyy"),
      ),
      tableRow2Col("Generated", format(new Date(), "MMMM d, yyyy HH:mm")),
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
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("(a)(2)", "Table of Contents"));

  for (const section of IND_SECTIONS) {
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
  // SECTION (a)(3): Introductory Statement
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading(
      "(a)(3)",
      "Introductory Statement and General Investigational Plan",
    ),
  );
  children.push(guidanceBox(getINDSection("(a)(3)").guidance));

  children.push(subHeading("1. Research Question and Rationale"));
  if (protocol.study_question) {
    children.push(bodyText(protocol.study_question, 200));
  } else {
    children.push(placeholder("study_question"));
  }

  children.push(subHeading("2. Investigational Product Identification"));
  if (protocol.intervention) {
    children.push(labelValue("Intervention", protocol.intervention));
  } else {
    children.push(placeholder("intervention"));
  }

  children.push(subHeading("3. Target Population"));
  if (protocol.population) {
    children.push(bodyText(protocol.population, 200));
  } else {
    children.push(placeholder("population"));
  }

  children.push(subHeading("4. General Investigational Plan"));
  if (protocol.design) {
    children.push(labelValue("Study Design", protocol.design));
  } else {
    children.push(placeholder("study design"));
  }
  children.push(bodyText("[Estimated number of patients: _______]", 200));
  children.push(bodyText("[Duration of treatment/follow-up: _______]", 200));
  children.push(bodyText("[Clinical sites: _______]", 200));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(4): Investigator's Brochure
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("(a)(4)", "Investigator's Brochure"));
  children.push(guidanceBox(getINDSection("(a)(4)").guidance));

  const ibSubsections = [
    "1. Table of Contents",
    "2. Summary",
    "3. Introduction",
    "4. Physical, Chemical, and Pharmaceutical Properties",
    "5. Nonclinical Studies",
    "6. Effects in Humans",
    "7. Summary of Data and Guidance for the Investigator",
  ];

  for (const sub of ibSubsections) {
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
            text: "[TO BE COMPLETED \u2014 Refer to ICH E6(R2) Section 7]",
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

  // Evidence summary in IB
  if (linkedEvidence.length > 0) {
    children.push(subHeading("Referenced Evidence from VaxEvidence Library"));
    children.push(
      bodyText(
        `${linkedEvidence.length} evidence item(s) are linked and may inform IB sections:`,
        200,
      ),
    );

    const maxItems = Math.min(linkedEvidence.length, 10);
    for (let i = 0; i < maxItems; i++) {
      const ev = linkedEvidence[i].evidence_items;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 18 }),
            new TextRun({ text: ev.title, size: 18 }),
            ...(ev.authors
              ? [
                  new TextRun({
                    text: ` \u2014 ${ev.authors}`,
                    italics: true,
                    size: 16,
                  }),
                ]
              : []),
          ],
          spacing: { after: 60 },
          indent: { left: 400 },
        }),
      );
    }
    if (linkedEvidence.length > 10) {
      children.push(
        bodyText(
          `... and ${linkedEvidence.length - 10} more items (see Section (a)(8)).`,
          400,
        ),
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(5): Clinical Protocol(s)
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("(a)(5)", "Clinical Protocol(s)"));
  children.push(guidanceBox(getINDSection("(a)(5)").guidance));

  children.push(subHeading("Protocol Title"));
  children.push(bodyText(protocol.title, 200));

  children.push(subHeading("1. Study Objectives"));
  if (protocol.study_question) {
    children.push(labelValue("Primary Objective", protocol.study_question));
  } else {
    children.push(placeholder("study_question"));
  }

  children.push(subHeading("2. Study Design"));
  if (protocol.design) {
    children.push(bodyText(protocol.design, 200));
  } else {
    children.push(placeholder("study design"));
  }

  children.push(subHeading("3. Patient Selection Criteria"));
  children.push(
    new Paragraph({
      text: "3.1 Inclusion Criteria (Population)",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 50 },
    }),
  );
  if (protocol.population) {
    children.push(bodyText(protocol.population, 400));
  } else {
    children.push(placeholder("population"));
  }

  children.push(
    new Paragraph({
      text: "3.2 Exclusion Criteria",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 50 },
    }),
  );
  children.push(placeholder("exclusion criteria"));

  children.push(subHeading("4. Intervention / Investigational Product"));
  if (protocol.intervention) {
    children.push(bodyText(protocol.intervention, 200));
  } else {
    children.push(placeholder("intervention"));
  }
  children.push(bodyText("[Dosage: _______]", 200));
  children.push(bodyText("[Route of administration: _______]", 200));
  children.push(bodyText("[Duration of treatment: _______]", 200));

  children.push(subHeading("5. Control / Comparator"));
  if (protocol.comparator) {
    children.push(bodyText(protocol.comparator, 200));
  } else {
    children.push(placeholder("comparator"));
  }

  children.push(subHeading("6. Efficacy Parameters (Outcome Measures)"));
  if (protocol.outcomes) {
    children.push(bodyText(protocol.outcomes, 200));
  } else {
    children.push(placeholder("outcomes"));
  }

  children.push(subHeading("7. Statistical Methods"));
  children.push(placeholder("statistical methods"));

  children.push(subHeading("8. Safety Monitoring"));
  children.push(placeholder("safety monitoring plan"));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(6): CMC — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading("(a)(6)", "Chemistry, Manufacturing, and Controls (CMC)"),
  );
  children.push(guidanceBox(getINDSection("(a)(6)").guidance));

  const cmcItems = [
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

  for (const item of cmcItems) {
    const isSubItem = item.startsWith("  ");
    children.push(
      new Paragraph({
        text: item.trim(),
        heading: isSubItem ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2,
        spacing: { before: isSubItem ? 50 : 150, after: 50 },
        indent: isSubItem ? { left: 400 } : undefined,
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(7): Pharmacology and Toxicology — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading("(a)(7)", "Pharmacology and Toxicology Information"),
  );
  children.push(guidanceBox(getINDSection("(a)(7)").guidance));

  const toxItems = [
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

  for (const item of toxItems) {
    const isSubItem = item.startsWith("  ");
    children.push(
      new Paragraph({
        text: item.trim(),
        heading: isSubItem ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2,
        spacing: { before: isSubItem ? 50 : 150, after: 50 },
        indent: isSubItem ? { left: 400 } : undefined,
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(8): Previous Human Experience
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(
    sectionHeading(
      "(a)(8)",
      "Previous Human Experience with the Investigational Drug",
    ),
  );
  children.push(guidanceBox(getINDSection("(a)(8)").guidance));

  if (linkedEvidence.length === 0) {
    children.push(
      bodyText(
        "No previous human experience data has been linked to this protocol in VaxEvidence.",
      ),
    );
    children.push(placeholder("linked evidence items"));
  } else {
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

    // Academic evidence table
    if (academic.length > 0) {
      children.push(
        subHeading(`1. Published Clinical Evidence (${academic.length} items)`),
      );

      const evidenceTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["#", "Title", "Authors", "Journal/DOI"].map(
              (h) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: h,
                          bold: true,
                          color: "FFFFFF",
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                  shading: {
                    type: ShadingType.SOLID,
                    color: NAVY,
                  },
                }),
            ),
          }),
          ...academic.map(
            (link, i) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: `${i + 1}` })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    shading:
                      i % 2 === 0
                        ? {
                            type: ShadingType.SOLID,
                            color: LIGHT_GRAY,
                          }
                        : undefined,
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: link.evidence_items.title,
                      }),
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading:
                      i % 2 === 0
                        ? {
                            type: ShadingType.SOLID,
                            color: LIGHT_GRAY,
                          }
                        : undefined,
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: link.evidence_items.authors || "N/A",
                      }),
                    ],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading:
                      i % 2 === 0
                        ? {
                            type: ShadingType.SOLID,
                            color: LIGHT_GRAY,
                          }
                        : undefined,
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text:
                          link.evidence_items.doi ||
                          link.evidence_items.journal ||
                          "N/A",
                      }),
                    ],
                    shading:
                      i % 2 === 0
                        ? {
                            type: ShadingType.SOLID,
                            color: LIGHT_GRAY,
                          }
                        : undefined,
                  }),
                ],
              }),
          ),
        ],
      });

      children.push(evidenceTable);
      children.push(new Paragraph({ spacing: { after: 200 } }));

      // Detailed list
      children.push(subHeading("Detailed Evidence Summaries"));

      for (let i = 0; i < academic.length; i++) {
        const ev = academic[i].evidence_items;
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
        if (ev.journal) {
          children.push(labelValue("Journal", ev.journal));
        }
        if (ev.doi) {
          children.push(labelValue("DOI", ev.doi));
        }
        if (ev.publication_date) {
          children.push(labelValue("Published", ev.publication_date));
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
      }
    }

    // Regulatory documents
    if (regulatory.length > 0) {
      children.push(
        subHeading(`2. Regulatory Documents (${regulatory.length} items)`),
      );

      for (let i = 0; i < regulatory.length; i++) {
        const ev = regulatory[i].evidence_items;
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true }),
              new TextRun({ text: ev.title, bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
        );
        if (ev.regulatory_body) {
          children.push(labelValue("Agency", ev.regulatory_body));
        }
        if (ev.document_type) {
          children.push(labelValue("Type", ev.document_type));
        }
        if (ev.source_url) {
          children.push(labelValue("URL", ev.source_url));
        }
        if (ev.description) {
          children.push(labelValue("Summary", ev.description));
        }
      }
    }

    // Other evidence
    if (other.length > 0) {
      children.push(subHeading(`3. Other Evidence (${other.length} items)`));
      for (let i = 0; i < other.length; i++) {
        const ev = other[i].evidence_items;
        children.push(bodyText(`${i + 1}. [${ev.type}] ${ev.title}`, 200));
        if (ev.description) {
          children.push(bodyText(ev.description, 400));
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(9): Additional Information — Template Only
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("(a)(9)", "Additional Information"));
  children.push(guidanceBox(getINDSection("(a)(9)").guidance));

  for (const sub of [
    "1. Drug Dependence and Abuse Potential",
    "2. Radioactive Drug Data (if applicable)",
    "3. Pediatric Study Plans (if applicable)",
    "4. Other Relevant Data",
  ]) {
    children.push(subHeading(sub));
    children.push(placeholder(sub.split(". ")[1]));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION (a)(10): Relevant Information
  // ═══════════════════════════════════════════════════════════════════════════

  children.push(sectionHeading("(a)(10)", "Relevant Information"));
  children.push(guidanceBox(getINDSection("(a)(10)").guidance));

  // Risk of Bias
  if (robAssessments.length > 0) {
    children.push(subHeading("Risk of Bias Assessment Summary"));
    children.push(
      bodyText(
        `${robAssessments.length} risk-of-bias assessments have been completed.`,
        200,
      ),
    );

    const robTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["#", "Assessment Tool", "Overall Judgment"].map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: h,
                        bold: true,
                        color: "FFFFFF",
                        size: 16,
                      }),
                    ],
                  }),
                ],
                shading: { type: ShadingType.SOLID, color: NAVY },
              }),
          ),
        }),
        ...robAssessments.map(
          (rob, i) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: `${i + 1}` })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: rob.tool })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: rob.overall_judgment })],
                }),
              ],
            }),
        ),
      ],
    });

    children.push(robTable);
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // Meta-analysis
  if (metaAnalysisEntries.length > 0) {
    children.push(subHeading("Meta-Analysis Summary"));
    children.push(
      bodyText(
        `${metaAnalysisEntries.length} study-level effect sizes entered.`,
        200,
      ),
    );

    const maTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["Study", "Effect Size", "95% CI", "Weight"].map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: h,
                        bold: true,
                        color: "FFFFFF",
                        size: 16,
                      }),
                    ],
                  }),
                ],
                shading: { type: ShadingType.SOLID, color: NAVY },
              }),
          ),
        }),
        ...metaAnalysisEntries.map(
          (entry) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: entry.study_label })],
                  width: { size: 35, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: entry.effect_size.toFixed(3),
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: `[${entry.ci_lower.toFixed(3)}, ${entry.ci_upper.toFixed(3)}]`,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: `${entry.weight.toFixed(1)}%`,
                    }),
                  ],
                }),
              ],
            }),
        ),
      ],
    });

    children.push(maTable);
  }

  if (robAssessments.length === 0 && metaAnalysisEntries.length === 0) {
    children.push(
      bodyText(
        "No systematic review data (risk-of-bias assessments or meta-analysis entries) has been recorded.",
      ),
    );
    children.push(placeholder("systematic review data"));
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
