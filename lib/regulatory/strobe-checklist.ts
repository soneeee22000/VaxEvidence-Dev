// =============================================================================
// STROBE CHECKLIST
// =============================================================================
// 22-item checklist for reporting observational studies.
// Three study-type variants: cohort, case-control, cross-sectional.
// Items 6, 12, 14, 15 differ by study design.
// Ref: von Elm E, et al. STROBE Statement. Lancet 2007.
// =============================================================================

/**
 * A single STROBE checklist item.
 */
export interface StrobeItem {
  /** Item number (e.g., "1", "6a-cohort") */
  id: string;
  /** Section heading this item belongs to */
  section: string;
  /** Full item text */
  description: string;
  /** Which study types this item applies to (empty = all) */
  appliesTo: ("cohort" | "case-control" | "cross-sectional")[];
  /** Which PICO field(s) can auto-populate this item, if any */
  picoMapping?: string;
}

/** Study type variants for STROBE */
export type StrobeStudyType = "cohort" | "case-control" | "cross-sectional";

/**
 * Full STROBE checklist with all items including study-type variants.
 */
export const STROBE_CHECKLIST: StrobeItem[] = [
  // TITLE AND ABSTRACT
  {
    id: "1",
    section: "Title and Abstract",
    description:
      "(a) Indicate the study's design with a commonly used term in the title or the abstract. " +
      "(b) Provide in the abstract an informative and balanced summary of what was done and what was found.",
    appliesTo: [],
  },

  // INTRODUCTION
  {
    id: "2",
    section: "Introduction — Background/Rationale",
    description:
      "Explain the scientific background and rationale for the investigation being reported.",
    appliesTo: [],
  },
  {
    id: "3",
    section: "Introduction — Objectives",
    description:
      "State specific objectives, including any prespecified hypotheses.",
    appliesTo: [],
    picoMapping: "study_question",
  },

  // METHODS — Study Design
  {
    id: "4",
    section: "Methods — Study Design",
    description: "Present key elements of study design early in the paper.",
    appliesTo: [],
    picoMapping: "design",
  },

  // METHODS — Setting
  {
    id: "5",
    section: "Methods — Setting",
    description:
      "Describe the setting, locations, and relevant dates, including periods of recruitment, " +
      "exposure, follow-up, and data collection.",
    appliesTo: [],
  },

  // METHODS — Participants (study-type variants)
  {
    id: "6a-cohort",
    section: "Methods — Participants",
    description:
      "Give the eligibility criteria, and the sources and methods of selection of participants. " +
      "Describe methods of follow-up.",
    appliesTo: ["cohort"],
    picoMapping: "population",
  },
  {
    id: "6a-case-control",
    section: "Methods — Participants",
    description:
      "Give the eligibility criteria, and the sources and methods of case ascertainment and " +
      "control selection. Give the rationale for the choice of cases and controls.",
    appliesTo: ["case-control"],
    picoMapping: "population",
  },
  {
    id: "6a-cross-sectional",
    section: "Methods — Participants",
    description:
      "Give the eligibility criteria, and the sources and methods of selection of participants.",
    appliesTo: ["cross-sectional"],
    picoMapping: "population",
  },
  {
    id: "6b-cohort",
    section: "Methods — Participants",
    description:
      "For matched studies, give matching criteria and number of exposed and unexposed.",
    appliesTo: ["cohort"],
  },
  {
    id: "6b-case-control",
    section: "Methods — Participants",
    description:
      "For matched studies, give matching criteria and the number of controls per case.",
    appliesTo: ["case-control"],
  },

  // METHODS — Variables
  {
    id: "7",
    section: "Methods — Variables",
    description:
      "Clearly define all outcomes, exposures, predictors, potential confounders, and effect modifiers. " +
      "Give diagnostic criteria, if applicable.",
    appliesTo: [],
    picoMapping: "outcomes",
  },

  // METHODS — Data Sources/Measurement
  {
    id: "8",
    section: "Methods — Data Sources/Measurement",
    description:
      "For each variable of interest, give sources of data and details of methods of assessment " +
      "(measurement). Describe comparability of assessment methods if there is more than one group.",
    appliesTo: [],
  },

  // METHODS — Bias
  {
    id: "9",
    section: "Methods — Bias",
    description: "Describe any efforts to address potential sources of bias.",
    appliesTo: [],
  },

  // METHODS — Study Size
  {
    id: "10",
    section: "Methods — Study Size",
    description: "Explain how the study size was arrived at.",
    appliesTo: [],
  },

  // METHODS — Quantitative Variables
  {
    id: "11",
    section: "Methods — Quantitative Variables",
    description:
      "Explain how quantitative variables were handled in the analyses. If applicable, describe " +
      "which groupings were chosen and why.",
    appliesTo: [],
  },

  // METHODS — Statistical Methods (study-type variants for 12)
  {
    id: "12a",
    section: "Methods — Statistical Methods",
    description:
      "Describe all statistical methods, including those used to control for confounding.",
    appliesTo: [],
  },
  {
    id: "12b",
    section: "Methods — Statistical Methods",
    description:
      "Describe any methods used to examine subgroups and interactions.",
    appliesTo: [],
  },
  {
    id: "12c",
    section: "Methods — Statistical Methods",
    description: "Explain how missing data were addressed.",
    appliesTo: [],
  },
  {
    id: "12d-cohort",
    section: "Methods — Statistical Methods",
    description: "If applicable, explain how loss to follow-up was addressed.",
    appliesTo: ["cohort"],
  },
  {
    id: "12d-case-control",
    section: "Methods — Statistical Methods",
    description:
      "If applicable, explain how matching of cases and controls was addressed.",
    appliesTo: ["case-control"],
  },
  {
    id: "12d-cross-sectional",
    section: "Methods — Statistical Methods",
    description:
      "If applicable, describe analytical methods taking account of sampling strategy.",
    appliesTo: ["cross-sectional"],
  },
  {
    id: "12e",
    section: "Methods — Statistical Methods",
    description: "Describe any sensitivity analyses.",
    appliesTo: [],
  },

  // RESULTS — Participants
  {
    id: "13a",
    section: "Results — Participants",
    description:
      "Report numbers of individuals at each stage of study — e.g., numbers potentially eligible, " +
      "examined for eligibility, confirmed eligible, included in the study, completing follow-up, " +
      "and analysed.",
    appliesTo: [],
  },
  {
    id: "13b",
    section: "Results — Participants",
    description: "Give reasons for non-participation at each stage.",
    appliesTo: [],
  },
  {
    id: "13c",
    section: "Results — Participants",
    description: "Consider use of a flow diagram.",
    appliesTo: [],
  },

  // RESULTS — Descriptive Data
  {
    id: "14a",
    section: "Results — Descriptive Data",
    description:
      "Give characteristics of study participants (e.g., demographic, clinical, social) and information " +
      "on exposures and potential confounders.",
    appliesTo: [],
  },
  {
    id: "14b",
    section: "Results — Descriptive Data",
    description:
      "Indicate number of participants with missing data for each variable of interest.",
    appliesTo: [],
  },
  {
    id: "14c-cohort",
    section: "Results — Descriptive Data",
    description: "Summarise follow-up time (e.g., average and total amount).",
    appliesTo: ["cohort"],
  },

  // RESULTS — Outcome Data (study-type variants for 15)
  {
    id: "15-cohort",
    section: "Results — Outcome Data",
    description:
      "Report numbers of outcome events or summary measures over time.",
    appliesTo: ["cohort"],
  },
  {
    id: "15-case-control",
    section: "Results — Outcome Data",
    description:
      "Report numbers in each exposure category, or summary measures of exposure.",
    appliesTo: ["case-control"],
  },
  {
    id: "15-cross-sectional",
    section: "Results — Outcome Data",
    description: "Report numbers of outcome events or summary measures.",
    appliesTo: ["cross-sectional"],
  },

  // RESULTS — Main Results
  {
    id: "16a",
    section: "Results — Main Results",
    description:
      "Give unadjusted estimates and, if applicable, confounder-adjusted estimates and their precision " +
      "(e.g., 95% confidence interval). Make clear which confounders were adjusted for and why " +
      "they were included.",
    appliesTo: [],
  },
  {
    id: "16b",
    section: "Results — Main Results",
    description:
      "Report category boundaries when continuous variables were categorized.",
    appliesTo: [],
  },
  {
    id: "16c",
    section: "Results — Main Results",
    description:
      "If relevant, consider translating estimates of relative risk into absolute risk for a " +
      "meaningful time period.",
    appliesTo: [],
  },

  // RESULTS — Other Analyses
  {
    id: "17",
    section: "Results — Other Analyses",
    description:
      "Report other analyses done — e.g., analyses of subgroups and interactions, and sensitivity analyses.",
    appliesTo: [],
  },

  // DISCUSSION
  {
    id: "18",
    section: "Discussion — Key Results",
    description: "Summarise key results with reference to study objectives.",
    appliesTo: [],
  },
  {
    id: "19",
    section: "Discussion — Limitations",
    description:
      "Discuss limitations of the study, taking into account sources of potential bias or imprecision. " +
      "Discuss both direction and magnitude of any potential bias.",
    appliesTo: [],
  },
  {
    id: "20",
    section: "Discussion — Interpretation",
    description:
      "Give a cautious overall interpretation of results considering objectives, limitations, " +
      "multiplicity of analyses, results from similar studies, and other relevant evidence.",
    appliesTo: [],
  },
  {
    id: "21",
    section: "Discussion — Generalisability",
    description:
      "Discuss the generalisability (external validity) of the study results.",
    appliesTo: [],
  },

  // OTHER INFORMATION
  {
    id: "22",
    section: "Other Information — Funding",
    description:
      "Give the source of funding and the role of the funders for the present study and, " +
      "if applicable, for the original study on which the present article is based.",
    appliesTo: [],
  },
];

/**
 * Get STROBE items filtered for a specific study type.
 * Items with empty appliesTo apply to all study types.
 */
export function getStrobeItemsForStudyType(
  studyType: StrobeStudyType,
): StrobeItem[] {
  return STROBE_CHECKLIST.filter(
    (item) => item.appliesTo.length === 0 || item.appliesTo.includes(studyType),
  );
}

/**
 * Get unique section names in order.
 */
export function getStrobeSections(): string[] {
  const seen = new Set<string>();
  return STROBE_CHECKLIST.filter((item) => {
    if (seen.has(item.section)) return false;
    seen.add(item.section);
    return true;
  }).map((item) => item.section);
}

/**
 * Total number of STROBE items (including all variants).
 */
export const STROBE_ITEM_COUNT = STROBE_CHECKLIST.length;

/**
 * Count of items for a specific study type.
 */
export function getStrobeItemCount(studyType: StrobeStudyType): number {
  return getStrobeItemsForStudyType(studyType).length;
}
