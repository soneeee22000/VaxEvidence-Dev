// =============================================================================
// ICH E6(R2) GCP — PROTOCOL SECTIONS (6.1–6.16)
// =============================================================================
// Required protocol content per ICH E6(R2) Section 6.
// Maps each protocol section to VaxEvidence PICO fields.
// =============================================================================

/**
 * A single GCP protocol section requirement.
 */
export interface GCPProtocolSection {
  /** Section number (e.g., "6.1", "6.4.1") */
  sectionNumber: string;
  /** Section title */
  title: string;
  /** Description of what must be included */
  description: string;
  /** Which VaxEvidence fields map to this section */
  picoMapping: string[];
}

/**
 * GCP protocol sections 6.1–6.16 per ICH E6(R2).
 */
export const GCP_PROTOCOL_SECTIONS: GCPProtocolSection[] = [
  {
    sectionNumber: "6.1",
    title: "General Information",
    description:
      "Protocol title, protocol identifying number, and date. Name and address of sponsor. " +
      "Name and title of person(s) authorized to sign the protocol and amendments.",
    picoMapping: ["protocol.title", "protocol.id"],
  },
  {
    sectionNumber: "6.2",
    title: "Background Information",
    description:
      "Name and description of the investigational product(s). Summary of findings from nonclinical " +
      "studies and clinical trials relevant to the trial. Summary of known and potential risks and " +
      "benefits to human subjects.",
    picoMapping: ["protocol.study_question", "evidence_items"],
  },
  {
    sectionNumber: "6.3",
    title: "Trial Objectives and Purpose",
    description:
      "A detailed description of the objectives and the purpose of the trial.",
    picoMapping: ["protocol.study_question"],
  },
  {
    sectionNumber: "6.4",
    title: "Trial Design",
    description:
      "The scientific integrity of the trial and the credibility of the data from the trial " +
      "depend substantially on the trial design. Description of the type/design of trial " +
      "(e.g., double-blind, placebo-controlled, parallel design) and a schematic diagram of " +
      "trial design, procedures, and stages.",
    picoMapping: ["protocol.design"],
  },
  {
    sectionNumber: "6.4.1",
    title: "Primary and Secondary Endpoints",
    description:
      "A description of the primary endpoints and secondary endpoints, if any, to be measured " +
      "during the trial.",
    picoMapping: ["protocol.outcomes"],
  },
  {
    sectionNumber: "6.4.2",
    title: "Measures to Minimize Bias",
    description:
      "A description of the measures taken to minimize/avoid bias, including randomization and blinding.",
    picoMapping: ["protocol.design"],
  },
  {
    sectionNumber: "6.4.3",
    title: "Duration of Treatment and Follow-up",
    description:
      "A description of the expected duration of an individual subject's participation and a " +
      "description of the sequence and duration of all trial periods.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.4.4",
    title: "Stopping Rules",
    description:
      "A description of the stopping rules or discontinuation criteria for individual subjects, " +
      "parts of the trial, and the entire trial.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.5",
    title: "Selection of Study Population",
    description: "Subject inclusion criteria. Subject exclusion criteria.",
    picoMapping: ["protocol.population"],
  },
  {
    sectionNumber: "6.6",
    title: "Treatment of Subjects",
    description:
      "The treatment(s) to be administered, including the name(s) of all the product(s), " +
      "the dose(s), the dosing schedule(s), the route/mode(s) of administration, and the " +
      "treatment period(s). Medication(s)/treatment(s) permitted and not permitted before " +
      "and/or during the trial.",
    picoMapping: ["protocol.intervention", "protocol.comparator"],
  },
  {
    sectionNumber: "6.7",
    title: "Assessment of Efficacy",
    description:
      "Specification of the efficacy parameters. Methods and timing for assessing, recording, " +
      "and analysing efficacy parameters.",
    picoMapping: ["protocol.outcomes"],
  },
  {
    sectionNumber: "6.8",
    title: "Assessment of Safety",
    description:
      "Specification of safety parameters. Methods and timing for assessing, recording, and " +
      "analysing safety parameters. Procedures for eliciting reports of and recording and " +
      "reporting adverse events and intercurrent illnesses.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.9",
    title: "Statistics",
    description:
      "A description of the statistical methods to be employed, including timing of any planned " +
      "interim analysis(es). The number of subjects planned to be enrolled. The level of " +
      "significance to be used. Criteria for the termination of the trial. Procedure for " +
      "accounting for missing, unused, and spurious data.",
    picoMapping: ["protocol.design"],
  },
  {
    sectionNumber: "6.10",
    title: "Direct Access to Source Data/Documents",
    description:
      "The sponsor should ensure that it is specified in the protocol or other written agreement " +
      "that the investigator(s)/institution(s) will permit trial-related monitoring, audits, " +
      "IRB/IEC review, and regulatory inspection(s).",
    picoMapping: [],
  },
  {
    sectionNumber: "6.11",
    title: "Quality Control and Quality Assurance",
    description: "Quality control and quality assurance procedures.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.12",
    title: "Ethics",
    description: "Description of ethical considerations relating to the trial.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.13",
    title: "Data Handling and Record Keeping",
    description:
      "Case report form completion, data management, and record keeping procedures.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.14",
    title: "Financing and Insurance",
    description:
      "Financing and insurance if not addressed in a separate agreement.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.15",
    title: "Publication Policy",
    description:
      "Publication policy, if not addressed in a separate agreement.",
    picoMapping: [],
  },
  {
    sectionNumber: "6.16",
    title: "Supplements",
    description:
      "Additional information may be appended to the protocol (e.g., CRF samples, " +
      "list of relevant publications).",
    picoMapping: ["evidence_items"],
  },
];

/**
 * Total number of GCP protocol sections.
 */
export const GCP_PROTOCOL_SECTION_COUNT = GCP_PROTOCOL_SECTIONS.length;
