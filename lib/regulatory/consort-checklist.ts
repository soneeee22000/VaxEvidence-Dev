// =============================================================================
// CONSORT 2010 CHECKLIST
// =============================================================================
// 25-item checklist (~37 sub-items) for reporting randomized controlled trials.
// Ref: Schulz KF, Altman DG, Moher D. CONSORT 2010 Statement.
// =============================================================================

/**
 * A single CONSORT checklist item.
 */
export interface ConsortItem {
  /** Item number (e.g., "1a", "3b") */
  id: string;
  /** Section heading this item belongs to */
  section: string;
  /** Full item text */
  description: string;
  /** Which PICO field(s) can auto-populate this item, if any */
  picoMapping?: string;
}

/**
 * Full CONSORT 2010 checklist with all sub-items.
 */
export const CONSORT_CHECKLIST: ConsortItem[] = [
  // TITLE AND ABSTRACT
  {
    id: "1a",
    section: "Title and Abstract",
    description: "Identification as a randomised trial in the title.",
  },
  {
    id: "1b",
    section: "Title and Abstract",
    description:
      "Structured summary of trial design, methods, results, and conclusions (for specific guidance see CONSORT for Abstracts).",
  },

  // INTRODUCTION
  {
    id: "2a",
    section: "Introduction",
    description: "Scientific background and explanation of rationale.",
  },
  {
    id: "2b",
    section: "Introduction",
    description: "Specific objectives or hypotheses.",
    picoMapping: "study_question",
  },

  // METHODS — Trial Design
  {
    id: "3a",
    section: "Methods — Trial Design",
    description:
      "Description of trial design (such as parallel, factorial) including allocation ratio.",
    picoMapping: "design",
  },
  {
    id: "3b",
    section: "Methods — Trial Design",
    description:
      "Important changes to methods after trial commencement (such as eligibility criteria), with reasons.",
  },

  // METHODS — Participants
  {
    id: "4a",
    section: "Methods — Participants",
    description: "Eligibility criteria for participants.",
    picoMapping: "population",
  },
  {
    id: "4b",
    section: "Methods — Participants",
    description: "Settings and locations where the data were collected.",
  },

  // METHODS — Interventions
  {
    id: "5",
    section: "Methods — Interventions",
    description:
      "The interventions for each group with sufficient details to allow replication, including how and when they were actually administered.",
    picoMapping: "intervention,comparator",
  },

  // METHODS — Outcomes
  {
    id: "6a",
    section: "Methods — Outcomes",
    description:
      "Completely defined pre-specified primary and secondary outcome measures, including how and when they were assessed.",
    picoMapping: "outcomes",
  },
  {
    id: "6b",
    section: "Methods — Outcomes",
    description:
      "Any changes to trial outcomes after the trial commenced, with reasons.",
  },

  // METHODS — Sample Size
  {
    id: "7a",
    section: "Methods — Sample Size",
    description: "How sample size was determined.",
  },
  {
    id: "7b",
    section: "Methods — Sample Size",
    description:
      "When applicable, explanation of any interim analyses and stopping guidelines.",
  },

  // METHODS — Randomisation
  {
    id: "8a",
    section: "Methods — Randomisation: Sequence Generation",
    description: "Method used to generate the random allocation sequence.",
  },
  {
    id: "8b",
    section: "Methods — Randomisation: Sequence Generation",
    description:
      "Type of randomisation; details of any restriction (such as blocking and block size).",
  },
  {
    id: "9",
    section: "Methods — Randomisation: Allocation Concealment",
    description:
      "Mechanism used to implement the random allocation sequence (such as sequentially numbered containers), describing any steps taken to conceal the sequence until interventions were assigned.",
  },
  {
    id: "10",
    section: "Methods — Randomisation: Implementation",
    description:
      "Who generated the random allocation sequence, who enrolled participants, and who assigned participants to interventions.",
  },

  // METHODS — Blinding
  {
    id: "11a",
    section: "Methods — Blinding",
    description:
      "If done, who was blinded after assignment to interventions (for example, participants, care providers, those assessing outcomes) and how.",
  },
  {
    id: "11b",
    section: "Methods — Blinding",
    description: "If relevant, description of the similarity of interventions.",
  },

  // METHODS — Statistical Methods
  {
    id: "12a",
    section: "Methods — Statistical Methods",
    description:
      "Statistical methods used to compare groups for primary and secondary outcomes.",
  },
  {
    id: "12b",
    section: "Methods — Statistical Methods",
    description:
      "Methods for additional analyses, such as subgroup analyses and adjusted analyses.",
  },

  // RESULTS — Participant Flow
  {
    id: "13a",
    section: "Results — Participant Flow",
    description:
      "For each group, the numbers of participants who were randomly assigned, received intended treatment, and were analysed for the primary outcome.",
  },
  {
    id: "13b",
    section: "Results — Participant Flow",
    description:
      "For each group, losses and exclusions after randomisation, together with reasons.",
  },

  // RESULTS — Recruitment
  {
    id: "14a",
    section: "Results — Recruitment",
    description: "Dates defining the periods of recruitment and follow-up.",
  },
  {
    id: "14b",
    section: "Results — Recruitment",
    description: "Why the trial ended or was stopped.",
  },

  // RESULTS — Baseline Data
  {
    id: "15",
    section: "Results — Baseline Data",
    description:
      "A table showing baseline demographic and clinical characteristics for each group.",
  },

  // RESULTS — Numbers Analysed
  {
    id: "16",
    section: "Results — Numbers Analysed",
    description:
      "For each group, number of participants (denominator) included in each analysis and whether the analysis was by original assigned groups.",
  },

  // RESULTS — Outcomes and Estimation
  {
    id: "17a",
    section: "Results — Outcomes and Estimation",
    description:
      "For each primary and secondary outcome, results for each group, and the estimated effect size and its precision (such as 95% confidence interval).",
  },
  {
    id: "17b",
    section: "Results — Outcomes and Estimation",
    description:
      "For binary outcomes, presentation of both absolute and relative effect sizes is recommended.",
  },

  // RESULTS — Ancillary Analyses
  {
    id: "18",
    section: "Results — Ancillary Analyses",
    description:
      "Results of any other analyses performed, including subgroup analyses and adjusted analyses, distinguishing pre-specified from exploratory.",
  },

  // RESULTS — Harms
  {
    id: "19",
    section: "Results — Harms",
    description:
      "All important harms or unintended effects in each group (for specific guidance see CONSORT for Harms).",
  },

  // DISCUSSION
  {
    id: "20",
    section: "Discussion — Limitations",
    description:
      "Trial limitations, addressing sources of potential bias, imprecision, and, if relevant, multiplicity of analyses.",
  },
  {
    id: "21",
    section: "Discussion — Generalisability",
    description:
      "Generalisability (external validity, applicability) of the trial findings.",
  },
  {
    id: "22",
    section: "Discussion — Interpretation",
    description:
      "Interpretation consistent with results, balancing benefits and harms, and considering other relevant evidence.",
  },

  // OTHER INFORMATION
  {
    id: "23",
    section: "Other Information — Registration",
    description: "Registration number and name of trial registry.",
  },
  {
    id: "24",
    section: "Other Information — Protocol",
    description: "Where the full trial protocol can be accessed, if available.",
  },
  {
    id: "25",
    section: "Other Information — Funding",
    description:
      "Sources of funding and other support (such as supply of drugs), role of funders.",
  },
];

/**
 * Get unique section names in order.
 */
export function getConsortSections(): string[] {
  const seen = new Set<string>();
  return CONSORT_CHECKLIST.filter((item) => {
    if (seen.has(item.section)) return false;
    seen.add(item.section);
    return true;
  }).map((item) => item.section);
}

/**
 * Total number of CONSORT items.
 */
export const CONSORT_ITEM_COUNT = CONSORT_CHECKLIST.length;
