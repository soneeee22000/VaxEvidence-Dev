// =============================================================================
// ICH E6(R2) GCP — ESSENTIAL DOCUMENTS (Section 8)
// =============================================================================
// Essential documents for the conduct of a clinical trial, organized by
// trial phase: before, during, and after.
// Ref: ICH E6(R2) Section 8.
// =============================================================================

/**
 * A single GCP essential document.
 */
export interface GCPEssentialDocument {
  /** Document ID (e.g., "8.2.1") */
  id: string;
  /** Document title */
  title: string;
  /** Purpose of the document */
  purpose: string;
  /** Trial phase: before, during, or after */
  phase: "before" | "during" | "after";
  /** Whether VaxEvidence can generate or track this document */
  trackedByVaxEvidence: boolean;
  /** Which VaxEvidence feature provides this, if any */
  vaxEvidenceSource?: string;
}

/**
 * Essential documents per ICH E6(R2) Section 8.
 */
export const GCP_ESSENTIAL_DOCUMENTS: GCPEssentialDocument[] = [
  // BEFORE THE CLINICAL PHASE (8.2)
  {
    id: "8.2.1",
    title: "Investigator's Brochure",
    purpose:
      "To document that relevant and current scientific information about the investigational " +
      "product has been provided to the investigator.",
    phase: "before",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "IND Section (a)(4) — auto-generated from evidence library",
  },
  {
    id: "8.2.2",
    title: "Signed Protocol and Amendments",
    purpose:
      "To document investigator and sponsor agreement to the protocol/amendment(s).",
    phase: "before",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "Protocol management — PICO-based protocol with version tracking",
  },
  {
    id: "8.2.3",
    title: "Informed Consent Form",
    purpose: "To document the informed consent of each subject.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.4",
    title: "Financial Aspects of the Trial",
    purpose:
      "To document the financial agreement between the investigator/institution and the sponsor.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.5",
    title: "Insurance Statement",
    purpose:
      "To document that compensation for trial-related injury will be available.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.6",
    title: "Signed Agreement (Investigator/Sponsor)",
    purpose: "To document agreements between involved parties.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.7",
    title: "IRB/IEC Approval",
    purpose:
      "To document that the trial has been subject to IRB/IEC review and given approval.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.8",
    title: "IRB/IEC Composition",
    purpose:
      "To document that the IRB/IEC is constituted in agreement with GCP.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.9",
    title: "Regulatory Authority Authorisation",
    purpose:
      "To document regulatory authority authorisation/approval to conduct the trial.",
    phase: "before",
    trackedByVaxEvidence: true,
    vaxEvidenceSource: "IND package — FDA submission document",
  },
  {
    id: "8.2.10",
    title: "Curriculum Vitae of Investigators",
    purpose: "To document qualifications and eligibility to conduct the trial.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.11",
    title: "Normal Values / Ranges for Medical Tests",
    purpose: "To document normal values and/or ranges of the tests.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.12",
    title: "Medical/Laboratory Certifications",
    purpose: "To document competence of facility to perform required tests.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.13",
    title: "Sample of Case Report Form",
    purpose: "To document that the CRF has been agreed upon by all parties.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.14",
    title: "Decoding Procedures for Blinded Trials",
    purpose:
      "To document how, in case of emergency, the identity of blinded product can be revealed.",
    phase: "before",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.2.15",
    title: "Trial Initiation Monitoring Report",
    purpose:
      "To document that trial procedures were reviewed and that investigators were trained.",
    phase: "before",
    trackedByVaxEvidence: false,
  },

  // DURING THE CLINICAL CONDUCT (8.3)
  {
    id: "8.3.1",
    title: "Investigator's Brochure Updates",
    purpose:
      "To document that the investigator is informed in a timely manner of relevant information " +
      "as it becomes available.",
    phase: "during",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "Evidence library — new evidence items added during trial",
  },
  {
    id: "8.3.2",
    title: "Revised Protocol / Amendments",
    purpose:
      "To document revisions of the protocol and CRF changes during the trial.",
    phase: "during",
    trackedByVaxEvidence: true,
    vaxEvidenceSource: "Protocol version history — tracked via activity log",
  },
  {
    id: "8.3.3",
    title: "IRB/IEC Continuing Review Approvals",
    purpose:
      "To document that the IRB/IEC has approved continued trial conduct on a timely basis.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.4",
    title: "Monitoring Visit Reports",
    purpose: "To document site visits by the monitor and any findings/actions.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.5",
    title: "Relevant Communications",
    purpose:
      "To document any agreements or significant discussions regarding trial administration.",
    phase: "during",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "Comments and collaboration — real-time discussion on protocol",
  },
  {
    id: "8.3.6",
    title: "Signed Informed Consent Forms",
    purpose:
      "To document that consent is obtained in accordance with GCP and protocol.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.7",
    title: "Source Documents",
    purpose:
      "To document the existence of the subject and to substantiate integrity of trial data.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.8",
    title: "Completed CRFs",
    purpose:
      "To document that the investigator or authorized member of staff confirms the observations.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.9",
    title: "Adverse Event Reports",
    purpose:
      "To document that all adverse events have been reported to sponsor in compliance with protocol.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.10",
    title: "Interim or Annual Reports to IRB/IEC",
    purpose:
      "To document the status and results of the trial provided to the IRB/IEC.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.11",
    title: "Subject Screening Log",
    purpose:
      "To document identification of subjects who entered pre-trial screening.",
    phase: "during",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "Screening pipeline — PRISMA-compliant screening decisions",
  },
  {
    id: "8.3.12",
    title: "Subject Identification Code List",
    purpose:
      "To document that investigator/institution keeps a confidential list of names of all " +
      "subjects allocated to trial numbers.",
    phase: "during",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.3.13",
    title: "Drug Accountability Records",
    purpose:
      "To document that the investigational product has been used according to the protocol.",
    phase: "during",
    trackedByVaxEvidence: false,
  },

  // AFTER COMPLETION OR TERMINATION (8.4)
  {
    id: "8.4.1",
    title: "Drug Accountability at Site",
    purpose:
      "To document that the investigational product has been used according to protocol " +
      "or has been returned/destroyed.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.2",
    title: "Documentation of IP Destruction",
    purpose:
      "To document destruction of unused investigational products by sponsor or at site.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.3",
    title: "Completed Subject Identification Code List",
    purpose: "To permit identification of all subjects enrolled in the trial.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.4",
    title: "Audit Certificate (if applicable)",
    purpose: "To document that an audit was performed.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.5",
    title: "Final Monitoring Report",
    purpose:
      "To document that all activities required for trial close-out are completed.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.6",
    title: "Treatment Allocation and Decoding Documentation",
    purpose:
      "Returned to sponsor to document any decoding that may have occurred.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.7",
    title: "Final Report by Investigator to IRB/IEC",
    purpose: "To document completion of the trial.",
    phase: "after",
    trackedByVaxEvidence: false,
  },
  {
    id: "8.4.8",
    title: "Clinical Study Report",
    purpose: "To document results and interpretation of the trial.",
    phase: "after",
    trackedByVaxEvidence: true,
    vaxEvidenceSource:
      "Meta-analysis and evidence summaries — systematic review output",
  },
];

/**
 * Get essential documents by trial phase.
 */
export function getDocumentsByPhase(
  phase: "before" | "during" | "after",
): GCPEssentialDocument[] {
  return GCP_ESSENTIAL_DOCUMENTS.filter((doc) => doc.phase === phase);
}

/**
 * Get documents that VaxEvidence can track.
 */
export function getTrackedDocuments(): GCPEssentialDocument[] {
  return GCP_ESSENTIAL_DOCUMENTS.filter((doc) => doc.trackedByVaxEvidence);
}

/**
 * Total number of essential documents.
 */
export const GCP_ESSENTIAL_DOCUMENT_COUNT = GCP_ESSENTIAL_DOCUMENTS.length;
