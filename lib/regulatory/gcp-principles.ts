// =============================================================================
// ICH E6(R2) GCP — 13 PRINCIPLES
// =============================================================================
// The 13 principles of ICH Good Clinical Practice (Section 2).
// Ref: ICH Harmonised Guideline E6(R2) — Integrated Addendum (2016).
// =============================================================================

/**
 * A single GCP principle.
 */
export interface GCPPrinciple {
  /** Principle number (1-13) */
  number: number;
  /** Short title for display */
  title: string;
  /** Full principle text per ICH E6(R2) Section 2 */
  description: string;
  /** Which VaxEvidence data can demonstrate compliance */
  complianceMapping: string[];
}

/**
 * All 13 ICH E6(R2) GCP principles (Section 2.1–2.13).
 */
export const GCP_PRINCIPLES: GCPPrinciple[] = [
  {
    number: 1,
    title: "Ethical Conduct",
    description:
      "Clinical trials should be conducted in accordance with the ethical principles that have " +
      "their origin in the Declaration of Helsinki, and that are consistent with GCP and the " +
      "applicable regulatory requirement(s).",
    complianceMapping: ["protocol.status"],
  },
  {
    number: 2,
    title: "Risk-Benefit Assessment",
    description:
      "Before a trial is initiated, foreseeable risks and inconveniences should be weighed " +
      "against the anticipated benefit for the individual trial subject and society. A trial " +
      "should be initiated and continued only if the anticipated benefits justify the risks.",
    complianceMapping: ["risk_of_bias_assessments", "evidence_items"],
  },
  {
    number: 3,
    title: "Rights and Safety of Subjects",
    description:
      "The rights, safety, and well-being of the trial subjects are the most important " +
      "considerations and should prevail over interests of science and society.",
    complianceMapping: [],
  },
  {
    number: 4,
    title: "Nonclinical and Clinical Information",
    description:
      "The available nonclinical and clinical information on an investigational product should " +
      "be adequate to support the proposed clinical trial.",
    complianceMapping: ["evidence_items", "meta_analysis_entries"],
  },
  {
    number: 5,
    title: "Scientific Soundness",
    description:
      "Clinical trials should be scientifically sound, and described in a clear, detailed protocol.",
    complianceMapping: [
      "protocol.study_question",
      "protocol.design",
      "protocol.population",
      "protocol.intervention",
      "protocol.outcomes",
    ],
  },
  {
    number: 6,
    title: "Protocol Compliance",
    description:
      "A trial should be conducted in compliance with the protocol that has received prior " +
      "institutional review board (IRB)/independent ethics committee (IEC) approval/favourable opinion.",
    complianceMapping: ["protocol.status"],
  },
  {
    number: 7,
    title: "Qualified Medical Care",
    description:
      "The medical care given to, and medical decisions made on behalf of, subjects should " +
      "always be the responsibility of a qualified physician or, when appropriate, of a " +
      "qualified dentist.",
    complianceMapping: [],
  },
  {
    number: 8,
    title: "Qualified Personnel",
    description:
      "Each individual involved in conducting a trial should be qualified by education, training, " +
      "and experience to perform his or her respective task(s).",
    complianceMapping: [],
  },
  {
    number: 9,
    title: "Informed Consent",
    description:
      "Freely given informed consent should be obtained from every subject prior to clinical " +
      "trial participation.",
    complianceMapping: [],
  },
  {
    number: 10,
    title: "Data Recording and Reporting",
    description:
      "All clinical trial information should be recorded, handled, and stored in a way that " +
      "allows its accurate reporting, interpretation and verification.",
    complianceMapping: ["activity_log"],
  },
  {
    number: 11,
    title: "Confidentiality",
    description:
      "The confidentiality of records that could identify subjects should be protected, " +
      "respecting the privacy and confidentiality rules in accordance with the applicable " +
      "regulatory requirement(s).",
    complianceMapping: [],
  },
  {
    number: 12,
    title: "GMP Compliance",
    description:
      "Investigational products should be manufactured, handled, and stored in accordance " +
      "with applicable good manufacturing practice (GMP). They should be used in accordance " +
      "with the approved protocol.",
    complianceMapping: [],
  },
  {
    number: 13,
    title: "Quality Assurance",
    description:
      "Systems with procedures that assure the quality of every aspect of the trial should " +
      "be implemented.",
    complianceMapping: ["screening_decisions", "risk_of_bias_assessments"],
  },
];

/**
 * Total number of GCP principles.
 */
export const GCP_PRINCIPLE_COUNT = GCP_PRINCIPLES.length;
