// =============================================================================
// IND SECTION DEFINITIONS
// =============================================================================
// FDA IND Application structure per 21 CFR 312.23
// Defines all 10 sections with labels, guidance, and auto-populate mappings.
// =============================================================================

/**
 * Status of a single IND section based on available data.
 */
export type INDSectionStatus = "complete" | "partial" | "template-only";

/**
 * A single IND section definition.
 */
export interface INDSectionDefinition {
  /** IND section number per 21 CFR 312.23 */
  sectionNumber: string;
  /** Short title */
  title: string;
  /** Regulatory reference */
  reference: string;
  /** Guidance text explaining what belongs in this section */
  guidance: string;
  /** Which VaxEvidence data fields can auto-populate this section */
  autoPopulateFrom: string[];
  /** Whether this section is template-only (no VaxEvidence data maps to it) */
  templateOnly: boolean;
}

/**
 * All 10 IND application sections per 21 CFR 312.23(a)(1)-(a)(10).
 */
export const IND_SECTIONS: INDSectionDefinition[] = [
  {
    sectionNumber: "Cover",
    title: "Cover Sheet (Form FDA-1571)",
    reference: "21 CFR 312.23(a)(1)",
    guidance:
      "The cover sheet includes the sponsor's name and address, the name of the investigational drug, " +
      "the phase(s) of clinical investigation to be conducted, commitments, and identification of the " +
      "IND submission type (original, amendment, or annual report). This page is auto-populated with " +
      "protocol metadata from VaxEvidence.",
    autoPopulateFrom: [
      "protocol.title",
      "protocol.status",
      "protocol.id",
      "protocol.created_at",
      "protocol.updated_at",
    ],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(2)",
    title: "Table of Contents",
    reference: "21 CFR 312.23(a)(2)",
    guidance:
      "A table of contents for the entire IND submission, listing all sections and appendices " +
      "with page references. This is auto-generated from the document structure.",
    autoPopulateFrom: ["auto-generated"],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(3)",
    title: "Introductory Statement and General Investigational Plan",
    reference: "21 CFR 312.23(a)(3)",
    guidance:
      "This section should provide: (i) the name and structure of the drug substance; " +
      "(ii) the pharmacological class and brief description of the mechanism of action; " +
      "(iii) a summary of previous human experience with the drug (cross-reference to Section 8); " +
      "(iv) a general investigational plan for the coming year, including the rationale for the " +
      "drug or research study, the indication(s) to be studied, the general approach to be followed, " +
      "the kinds of clinical trials, the estimated number of patients, and any anticipated risks " +
      "based on preclinical data.",
    autoPopulateFrom: [
      "protocol.study_question",
      "protocol.design",
      "protocol.population",
      "protocol.intervention",
    ],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(4)",
    title: "Investigator's Brochure",
    reference: "21 CFR 312.23(a)(4)",
    guidance:
      "The Investigator's Brochure (IB) is a comprehensive document providing the investigator " +
      "with clinical and nonclinical data relevant to the study of the investigational product. " +
      "It should include: drug substance description, formulation, pharmacological and toxicological " +
      "effects summary, pharmacokinetics and ADME data, safety and effectiveness data from prior " +
      "studies, possible risks and precautions, and monitoring procedures. For vaccines: include " +
      "immunogenicity data and antigen characterization.",
    autoPopulateFrom: ["evidence (summary)"],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(5)",
    title: "Clinical Protocol(s)",
    reference: "21 CFR 312.23(a)(5)",
    guidance:
      "Each clinical protocol should include: (i) study objectives; (ii) investigator qualifications; " +
      "(iii) patient selection criteria (inclusion/exclusion); (iv) study design (parallel, crossover, " +
      "dose-escalation); (v) dosage, route, and duration of administration; (vi) description of " +
      "observations and measurements (efficacy parameters); (vii) clinical procedures and laboratory " +
      "tests; (viii) the name and description of the drug/dosage form; (ix) statistical methods. " +
      "This section is populated from the VaxEvidence PICO framework.",
    autoPopulateFrom: [
      "protocol.study_question",
      "protocol.population",
      "protocol.intervention",
      "protocol.comparator",
      "protocol.outcomes",
      "protocol.design",
    ],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(6)",
    title: "Chemistry, Manufacturing, and Controls (CMC)",
    reference: "21 CFR 312.23(a)(6)",
    guidance:
      "This section should describe: (i) drug substance — composition, manufacturer, method " +
      "of manufacture, analytical methods, and stability data; (ii) drug product — components, " +
      "manufacturer, method of manufacture, specifications, and stability; (iii) labeling — " +
      "copy of the label; (iv) environmental assessment. For vaccines: include antigen production " +
      "process, purification method, adjuvant information, and potency assays.\n\n" +
      "[TO BE COMPLETED — VaxEvidence does not store manufacturing or chemistry data. " +
      "This section must be prepared by the CMC team.]",
    autoPopulateFrom: [],
    templateOnly: true,
  },
  {
    sectionNumber: "(a)(7)",
    title: "Pharmacology and Toxicology Information",
    reference: "21 CFR 312.23(a)(7)",
    guidance:
      "This section should provide: (i) pharmacological effects and mechanism of action; " +
      "(ii) absorption, distribution, metabolism, and excretion (ADME) data; (iii) an integrated " +
      "summary of toxicological effects from animal and in vitro studies; (iv) a statement that " +
      "each nonclinical laboratory study was conducted in compliance with GLP (21 CFR Part 58) " +
      "or an explanation of why not. For vaccines: include animal immunogenicity data, challenge " +
      "studies, and toxicity in relevant animal models.\n\n" +
      "[TO BE COMPLETED — VaxEvidence does not store preclinical/animal study data. " +
      "This section must be prepared by the pharmacology/toxicology team.]",
    autoPopulateFrom: [],
    templateOnly: true,
  },
  {
    sectionNumber: "(a)(8)",
    title: "Previous Human Experience with the Investigational Drug",
    reference: "21 CFR 312.23(a)(8)",
    guidance:
      "This section should summarize previous investigations or marketing experience with the " +
      "drug, including: (i) data from controlled and uncontrolled clinical trials; (ii) published " +
      "and unpublished reports; (iii) foreign marketing experience; (iv) any IND safety reports " +
      "previously filed. Data should be presented by indication, dosage form, and relevant " +
      "demographic subgroups. This section is auto-populated from the VaxEvidence evidence library.",
    autoPopulateFrom: [
      "evidence_items (academic)",
      "evidence_items (regulatory)",
      "risk_of_bias_assessments",
      "meta_analysis_entries",
    ],
    templateOnly: false,
  },
  {
    sectionNumber: "(a)(9)",
    title: "Additional Information",
    reference: "21 CFR 312.23(a)(9)",
    guidance:
      "This section should include: (i) drug dependence and abuse potential information; " +
      "(ii) radioactive drug data (dosimetry); (iii) pediatric study plans (if applicable); " +
      "(iv) other relevant data not covered elsewhere.\n\n" +
      "[TO BE COMPLETED — Include any additional information relevant to the investigational " +
      "drug that does not fit in other sections.]",
    autoPopulateFrom: [],
    templateOnly: true,
  },
  {
    sectionNumber: "(a)(10)",
    title: "Relevant Information",
    reference: "21 CFR 312.23(a)(10)",
    guidance:
      "Any other relevant information that is available to the sponsor pertaining to the " +
      "safety or effectiveness of the drug. This may include risk-of-bias summaries, " +
      "meta-analysis results, and systematic review findings from VaxEvidence.",
    autoPopulateFrom: [
      "risk_of_bias_assessments",
      "meta_analysis_entries",
      "screening_decisions",
    ],
    templateOnly: false,
  },
];

/**
 * Look up an IND section by its section number.
 * Avoids fragile hardcoded array indices in generators.
 */
export function getINDSection(sectionNumber: string): INDSectionDefinition {
  const section = IND_SECTIONS.find((s) => s.sectionNumber === sectionNumber);
  if (!section) {
    throw new Error(`IND section ${sectionNumber} not found`);
  }
  return section;
}

/**
 * Determine the completeness status of each IND section based on available data.
 */
export interface INDSectionCompleteness {
  sectionNumber: string;
  title: string;
  status: INDSectionStatus;
  /** Reason for the status */
  reason: string;
}

/**
 * Evaluate completeness of IND sections based on available protocol data.
 */
export function evaluateINDCompleteness(data: {
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
  robCount: number;
  metaAnalysisCount: number;
}): INDSectionCompleteness[] {
  const { protocol, evidenceCount, robCount, metaAnalysisCount } = data;

  const hasPICO =
    !!protocol.population &&
    !!protocol.intervention &&
    !!protocol.comparator &&
    !!protocol.outcomes;
  const hasStudyQuestion = !!protocol.study_question;
  const hasDesign = !!protocol.design;

  return IND_SECTIONS.map((section) => {
    if (section.templateOnly) {
      return {
        sectionNumber: section.sectionNumber,
        title: section.title,
        status: "template-only" as const,
        reason: "No VaxEvidence data maps to this section. Template provided.",
      };
    }

    switch (section.sectionNumber) {
      case "Cover":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: protocol.title ? ("complete" as const) : ("partial" as const),
          reason: protocol.title
            ? "Protocol metadata available."
            : "Protocol title is missing.",
        };

      case "(a)(2)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "complete" as const,
          reason: "Auto-generated from document structure.",
        };

      case "(a)(3)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            hasStudyQuestion && hasDesign
              ? ("complete" as const)
              : ("partial" as const),
          reason:
            hasStudyQuestion && hasDesign
              ? "Study question and design available."
              : `Missing: ${[!hasStudyQuestion && "study question", !hasDesign && "study design"].filter(Boolean).join(", ")}.`,
        };

      case "(a)(4)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "partial" as const,
          reason:
            evidenceCount > 0
              ? `${evidenceCount} evidence items available for summary. Manual CMC/tox data still required.`
              : "No evidence linked. IB outline provided as template.",
        };

      case "(a)(5)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            hasPICO && hasDesign ? ("complete" as const) : ("partial" as const),
          reason:
            hasPICO && hasDesign
              ? "Full PICO framework and study design available."
              : `Missing: ${[!hasPICO && "PICO fields", !hasDesign && "study design"].filter(Boolean).join(", ")}.`,
        };

      case "(a)(8)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            evidenceCount > 0 ? ("complete" as const) : ("partial" as const),
          reason:
            evidenceCount > 0
              ? `${evidenceCount} evidence items auto-populated.`
              : "No evidence linked to this protocol.",
        };

      case "(a)(10)":
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status:
            robCount > 0 || metaAnalysisCount > 0
              ? ("complete" as const)
              : ("partial" as const),
          reason:
            robCount > 0 || metaAnalysisCount > 0
              ? `${robCount} RoB assessments, ${metaAnalysisCount} meta-analysis entries available.`
              : "No systematic review data available.",
        };

      default:
        return {
          sectionNumber: section.sectionNumber,
          title: section.title,
          status: "partial" as const,
          reason: "Unknown section.",
        };
    }
  });
}
