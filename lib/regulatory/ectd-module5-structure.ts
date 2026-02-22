// =============================================================================
// eCTD MODULE 5 SECTION DEFINITIONS
// =============================================================================
// Electronic Common Technical Document (eCTD) Module 5: Clinical Study Reports
// Defines the hierarchical structure per ICH M4E(R2) for EMA submissions.
// Includes auto-populate mappings from VaxEvidence data sources.
// =============================================================================

/** Minimum evidence count threshold for "complete" controlled-study status. */
const MIN_EVIDENCE_FOR_COMPLETE = 1;

/** Minimum RoB count threshold for "complete" controlled-study status. */
const MIN_ROB_FOR_COMPLETE = 1;

/** Minimum screening count threshold for "complete" tabular listing status. */
const MIN_SCREENING_FOR_COMPLETE = 1;

/** Minimum meta-analysis count threshold for "complete" pooled-analysis status. */
const MIN_META_ANALYSIS_FOR_COMPLETE = 1;

/**
 * Status of a single eCTD Module 5 section based on available data.
 * - "complete": sufficient VaxEvidence data is mapped to this section
 * - "partial": some data exists but additional items are recommended
 * - "template-only": no VaxEvidence data maps to this section; template provided
 */
export type ECTDSectionStatus = "complete" | "partial" | "template-only";

/**
 * A single eCTD Module 5 section definition.
 */
export interface ECTDSectionDefinition {
  /** eCTD section number (e.g. "5.1", "5.3.5.1") */
  sectionNumber: string;
  /** Short title */
  title: string;
  /** eCTD / ICH regulatory reference */
  reference: string;
  /** Guidance text explaining what belongs in this section */
  guidance: string;
  /** Which VaxEvidence data sources can auto-populate this section */
  autoPopulateFrom: string[];
  /** Whether this section is template-only (no VaxEvidence data maps to it) */
  templateOnly: boolean;
  /** Parent section number for hierarchical display (e.g. "5.3" for "5.3.5.1") */
  parentSection?: string;
}

/**
 * All eCTD Module 5 sections per ICH M4E(R2) — Clinical Study Reports.
 *
 * The hierarchy follows the standard eCTD granularity:
 * 5.1 — TOC
 * 5.2 — Tabular Listing
 * 5.3 — Clinical Study Reports (parent)
 *   5.3.1 – 5.3.7 — Sub-categories
 *     5.3.5.1 – 5.3.5.4 — Efficacy & Safety sub-sections
 * 5.4 — Literature References
 */
export const ECTD_MODULE5_SECTIONS: ECTDSectionDefinition[] = [
  {
    sectionNumber: "5.1",
    title: "Table of Contents of Module 5",
    reference: "ICH M4E(R2), Section 5.1",
    guidance:
      "An overall table of contents listing all clinical study reports, appendices, " +
      "and literature references included in Module 5. This is auto-generated from " +
      "the document structure and does not require manual input.",
    autoPopulateFrom: ["auto-generated"],
    templateOnly: false,
  },
  {
    sectionNumber: "5.2",
    title: "Tabular Listing of All Clinical Studies",
    reference: "ICH M4E(R2), Section 5.2",
    guidance:
      "A tabular listing of all clinical studies conducted with the investigational product, " +
      "including study number, design, treatment groups, number of subjects, diagnosis/criteria " +
      "for inclusion, study objectives, duration, and status. For VaxEvidence: this is " +
      "auto-populated from the screening pipeline, using studies that passed all screening " +
      "stages (screening_decisions with decision=include, stage=included).",
    autoPopulateFrom: [
      "screening_decisions (decision=include, stage=included)",
      "evidence_items (included studies)",
    ],
    templateOnly: false,
  },
  {
    sectionNumber: "5.3",
    title: "Clinical Study Reports",
    reference: "ICH M4E(R2), Section 5.3",
    guidance:
      "This section contains the individual clinical study reports organized by study type. " +
      "Reports should follow the ICH E3 guideline for structure and content. Sub-sections " +
      "are organized by study category (biopharmaceutic, PK, PD, efficacy/safety, etc.).",
    autoPopulateFrom: [],
    templateOnly: true,
  },
  {
    sectionNumber: "5.3.1",
    title: "Reports of Biopharmaceutic Studies",
    reference: "ICH M4E(R2), Section 5.3.1; ICH E3",
    guidance:
      "Reports of bioavailability, bioequivalence, in vitro dissolution, and other " +
      "biopharmaceutic studies. Includes comparative BA/BE studies, in vitro-in vivo " +
      "correlation studies, and bioanalytical/analytical method reports.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store biopharmaceutic study data. " +
      "This section must be prepared by the clinical pharmacology team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.2",
    title: "Reports of Studies Pertinent to PK Using Human Biomaterials",
    reference: "ICH M4E(R2), Section 5.3.2; ICH E3",
    guidance:
      "Reports of pharmacokinetic studies using human biomaterials, including plasma " +
      "protein binding studies, hepatic metabolism and drug interaction studies, and " +
      "studies using other human biomaterials.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store in vitro PK/biomaterial data. " +
      "This section must be prepared by the clinical pharmacology team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.3",
    title: "Reports of Human PK Studies",
    reference: "ICH M4E(R2), Section 5.3.3; ICH E3",
    guidance:
      "Reports of human pharmacokinetic studies, including healthy subject PK and " +
      "initial tolerability studies, patient PK and initial tolerability studies, " +
      "intrinsic/extrinsic factor PK studies, and population PK studies.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store clinical PK study data. " +
      "This section must be prepared by the clinical pharmacology team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.4",
    title: "Reports of Human PD Studies",
    reference: "ICH M4E(R2), Section 5.3.4; ICH E3",
    guidance:
      "Reports of human pharmacodynamic studies, including healthy subject PD and " +
      "PK/PD studies, and patient PD and PK/PD studies.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store clinical PD study data. " +
      "This section must be prepared by the clinical pharmacology team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.5",
    title: "Reports of Efficacy and Safety Studies",
    reference: "ICH M4E(R2), Section 5.3.5; ICH E3",
    guidance:
      "Parent section for all efficacy and safety study reports. Studies are organized " +
      "into: controlled clinical studies (5.3.5.1), uncontrolled clinical studies (5.3.5.2), " +
      "analyses of data from more than one study (5.3.5.3), and other study reports (5.3.5.4).",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.5.1",
    title:
      "Study Reports of Controlled Clinical Studies Pertinent to the Claimed Indication",
    reference: "ICH M4E(R2), Section 5.3.5.1; ICH E3; ICH E9",
    guidance:
      "Individual study reports for each controlled clinical trial (typically RCTs) pertinent " +
      "to the claimed indication. Each report should follow the ICH E3 structure and include " +
      "study title, authors, study design, patient demographics, efficacy results, safety data, " +
      "and conclusions. For VaxEvidence: auto-populated from evidence items (type=academic) " +
      "identified as randomized controlled trials through the PICO framework. Risk-of-bias " +
      "assessments (RoB 2) are appended when available.",
    autoPopulateFrom: [
      "evidence_items (type=academic, design=RCT)",
      "protocol.population",
      "protocol.intervention",
      "protocol.comparator",
      "protocol.outcomes",
      "risk_of_bias_assessments (tool=rob2)",
    ],
    templateOnly: false,
    parentSection: "5.3.5",
  },
  {
    sectionNumber: "5.3.5.2",
    title: "Study Reports of Uncontrolled Clinical Studies",
    reference: "ICH M4E(R2), Section 5.3.5.2; ICH E3",
    guidance:
      "Individual study reports for uncontrolled clinical studies, including single-arm trials, " +
      "observational cohort studies, case-control studies, and cross-sectional studies. Each report " +
      "should describe the study design, population, endpoints, and findings. For VaxEvidence: " +
      "auto-populated from evidence items identified as observational or non-randomized studies. " +
      "ROBINS-I assessments are appended when available.",
    autoPopulateFrom: [
      "evidence_items (type=academic, design=observational)",
      "risk_of_bias_assessments (tool=robins-i)",
    ],
    templateOnly: false,
    parentSection: "5.3.5",
  },
  {
    sectionNumber: "5.3.5.3",
    title: "Reports of Analyses of Data from More Than One Study",
    reference: "ICH M4E(R2), Section 5.3.5.3; ICH E9",
    guidance:
      "Reports of integrated analyses combining data from multiple studies, including " +
      "meta-analyses, pooled analyses, and cross-study comparisons. Should present pooled " +
      "effect sizes with confidence intervals, heterogeneity statistics (I-squared, Q-test), " +
      "and forest plot visualizations. For VaxEvidence: auto-populated from meta-analysis " +
      "entries and forest plot summary statistics.",
    autoPopulateFrom: [
      "meta_analysis_entries (effect_size, ci_lower, ci_upper, weight)",
      "meta_analysis_entries (subgroup analyses)",
      "forest_plot (summary statistics)",
    ],
    templateOnly: false,
    parentSection: "5.3.5",
  },
  {
    sectionNumber: "5.3.5.4",
    title: "Other Study Reports",
    reference: "ICH M4E(R2), Section 5.3.5.4; ICH E3",
    guidance:
      "Reports of other clinical studies not fitting the above categories, such as " +
      "epidemiological studies, registry-based analyses, compassionate use programs, " +
      "or expanded access studies.\n\n" +
      "[TO BE COMPLETED -- Provide study reports for any additional clinical studies " +
      "that do not fit into sections 5.3.5.1 through 5.3.5.3.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3.5",
  },
  {
    sectionNumber: "5.3.6",
    title: "Reports of Post-Marketing Experience",
    reference: "ICH M4E(R2), Section 5.3.6",
    guidance:
      "Reports summarizing post-marketing surveillance data, including spontaneous adverse " +
      "event reports, periodic safety update reports (PSURs), and post-authorization safety " +
      "studies (PASS). For vaccines: include passive surveillance data (VAERS/EudraVigilance) " +
      "and active surveillance findings.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store post-marketing surveillance data. " +
      "This section must be prepared by the pharmacovigilance team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.3.7",
    title: "Case Report Forms and Individual Patient Listings",
    reference: "ICH M4E(R2), Section 5.3.7",
    guidance:
      "Sample case report forms (CRFs) and individual patient data listings. Include blank " +
      "CRFs used in pivotal studies and patient-level data listings for key safety and " +
      "efficacy endpoints as required by the regulatory authority.\n\n" +
      "[TO BE COMPLETED -- VaxEvidence does not store individual patient data or CRFs. " +
      "This section must be prepared by the data management team.]",
    autoPopulateFrom: [],
    templateOnly: true,
    parentSection: "5.3",
  },
  {
    sectionNumber: "5.4",
    title: "Literature References",
    reference: "ICH M4E(R2), Section 5.4",
    guidance:
      "Published literature references cited in the clinical overview and clinical summary " +
      "(Module 2) or referenced in clinical study reports (Module 5). References should be " +
      "presented in a standard bibliographic format. For VaxEvidence: auto-populated from " +
      "the evidence library using bibliography generation (APA/MLA/Chicago/BibTeX/RIS).",
    autoPopulateFrom: [
      "evidence_items (all types)",
      "bibliography_export (APA, MLA, Chicago, BibTeX, RIS)",
    ],
    templateOnly: false,
  },
];

/**
 * Look up an eCTD Module 5 section by its section number.
 * Avoids fragile hardcoded array indices in generators.
 *
 * @param sectionNumber - The section number to look up (e.g. "5.3.5.1")
 * @returns The matching section definition
 * @throws Error if the section number is not found
 */
export function getECTDSection(sectionNumber: string): ECTDSectionDefinition {
  const section = ECTD_MODULE5_SECTIONS.find(
    (s) => s.sectionNumber === sectionNumber,
  );
  if (!section) {
    throw new Error(`eCTD Module 5 section ${sectionNumber} not found`);
  }
  return section;
}

/**
 * A section grouped with its children for hierarchical display.
 */
export interface ECTDSectionGroup {
  /** The parent section definition */
  section: ECTDSectionDefinition;
  /** Direct child sections (one level deep) */
  children: ECTDSectionDefinition[];
}

/**
 * Returns eCTD Module 5 sections grouped by parent for hierarchical display.
 *
 * Top-level sections (no parentSection) are returned as groups. Each group
 * contains its direct children. Sections nested more than one level deep
 * (e.g. 5.3.5.1 under 5.3.5) are nested under their immediate parent.
 *
 * @returns An array of section groups ordered by section number
 */
export function getECTDSections(): ECTDSectionGroup[] {
  const topLevel = ECTD_MODULE5_SECTIONS.filter((s) => !s.parentSection);

  return topLevel.map((section) => ({
    section,
    children: ECTD_MODULE5_SECTIONS.filter(
      (s) => s.parentSection === section.sectionNumber,
    ),
  }));
}

/**
 * Completeness assessment for a single eCTD Module 5 section.
 */
export interface ECTDSectionCompleteness {
  /** eCTD section number */
  sectionNumber: string;
  /** Section title */
  title: string;
  /** Completeness status */
  status: ECTDSectionStatus;
  /** Human-readable reason for the status */
  reason: string;
}

/**
 * Evaluate completeness of eCTD Module 5 sections based on available protocol data.
 *
 * @param data - Available data counts from VaxEvidence
 * @param data.protocol - The protocol object (used for metadata checks)
 * @param data.evidenceCount - Number of evidence items linked to the protocol
 * @param data.screeningCount - Number of screening decisions with decision=include
 * @param data.robCount - Number of risk-of-bias assessments
 * @param data.metaAnalysisCount - Number of meta-analysis entries
 * @returns An array of completeness assessments, one per section
 */
export function evaluateECTDCompleteness(data: {
  protocol: {
    title?: string;
    study_question?: string;
    population?: string;
    intervention?: string;
    comparator?: string;
    outcomes?: string;
    design?: string;
    status?: string;
  };
  evidenceCount: number;
  screeningCount: number;
  robCount: number;
  metaAnalysisCount: number;
}): ECTDSectionCompleteness[] {
  const { evidenceCount, screeningCount, robCount, metaAnalysisCount } = data;

  return ECTD_MODULE5_SECTIONS.map((section) => {
    switch (section.sectionNumber) {
      case "5.1":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "complete" as const,
          reason: "Auto-generated from document structure.",
        };

      case "5.2":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            screeningCount >= MIN_SCREENING_FOR_COMPLETE
              ? ("complete" as const)
              : ("template-only" as const),
          reason:
            screeningCount >= MIN_SCREENING_FOR_COMPLETE
              ? `${screeningCount} included studies available from screening pipeline.`
              : "No studies have passed the screening pipeline yet.",
        };

      case "5.3.5.1":
        if (
          evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE &&
          robCount >= MIN_ROB_FOR_COMPLETE
        ) {
          return {
            sectionNumber: section.sectionNumber,
            title: section.title,
            status: "complete" as const,
            reason: `${evidenceCount} evidence items and ${robCount} RoB assessments available.`,
          };
        }
        if (evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE) {
          return {
            sectionNumber: section.sectionNumber,
            title: section.title,
            status: "partial" as const,
            reason: `${evidenceCount} evidence items available but no risk-of-bias assessments yet.`,
          };
        }
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "template-only" as const,
          reason: "No evidence items linked to this protocol.",
        };

      case "5.3.5.2":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE
              ? ("complete" as const)
              : ("template-only" as const),
          reason:
            evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE
              ? `${evidenceCount} evidence items available for observational study reports.`
              : "No evidence items linked to this protocol.",
        };

      case "5.3.5.3":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            metaAnalysisCount >= MIN_META_ANALYSIS_FOR_COMPLETE
              ? ("complete" as const)
              : ("template-only" as const),
          reason:
            metaAnalysisCount >= MIN_META_ANALYSIS_FOR_COMPLETE
              ? `${metaAnalysisCount} meta-analysis entries available for pooled analysis.`
              : "No meta-analysis entries available.",
        };

      case "5.4":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE
              ? ("complete" as const)
              : ("template-only" as const),
          reason:
            evidenceCount >= MIN_EVIDENCE_FOR_COMPLETE
              ? `${evidenceCount} evidence items available for bibliography generation.`
              : "No evidence items available for literature references.",
        };

      default:
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "template-only" as const,
          reason:
            "No VaxEvidence data maps to this section. Template provided.",
        };
    }
  });
}
