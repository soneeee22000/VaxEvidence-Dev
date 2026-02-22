/**
 * Static demo data for the public demo mode.
 * Represents a realistic RSV vaccine effectiveness study.
 */

/** Demo protocol record matching the protocols table shape. */
export const DEMO_PROTOCOL = {
  id: "demo-protocol-001",
  title:
    "RSV Vaccine Effectiveness in Older Adults: A Real-World Evidence Study",
  study_question:
    "What is the real-world vaccine effectiveness of the RSVPreF (Abrysvo) vaccine against RSV-associated lower respiratory tract disease in adults aged 60 years and older during the 2025-2026 respiratory season?",
  population:
    "Adults aged 60 years and older enrolled in US integrated health systems with at least 12 months of continuous enrollment prior to the study period. Excludes immunocompromised individuals and those with prior RSV vaccination.",
  intervention:
    "Single-dose RSVPreF (Abrysvo, Pfizer) bivalent prefusion F protein vaccine administered during the 2025 pre-season vaccination campaign (August-October 2025).",
  comparator:
    "Age- and comorbidity-matched unvaccinated adults from the same health systems during the same respiratory season.",
  outcomes:
    "Primary: Vaccine effectiveness against medically-attended RSV-associated LRTD confirmed by RT-PCR. Secondary: VE against RSV-related hospitalization, ICU admission, and all-cause respiratory hospitalization. Safety: Serious adverse events within 42 days post-vaccination.",
  design: "Test-negative case-control study",
  status: "in_review" as const,
  user_id: "demo-user",
  created_at: "2025-09-15T10:00:00Z",
  updated_at: "2026-01-20T14:30:00Z",
} as const;

/** Demo evidence items linked to the protocol. */
export const DEMO_EVIDENCE_ITEMS = [
  {
    id: "demo-ev-001",
    title:
      "Efficacy and Safety of RSVPreF Vaccine in Older Adults: Phase 3 RENOIR Trial Results",
    evidence_type: "academic" as const,
    source: "New England Journal of Medicine",
    year: 2023,
    authors: "Walsh EE, Perez Marc G, Zareba AM, et al.",
    abstract:
      "Phase 3 randomized controlled trial demonstrating 66.7% efficacy of bivalent RSVPreF vaccine against RSV-associated lower respiratory tract illness in adults aged 60 years and older over two seasons.",
    tags: ["Phase 3", "RCT", "RSV", "Older Adults", "Efficacy"],
  },
  {
    id: "demo-ev-002",
    title:
      "Real-World Effectiveness of RSV Vaccination Among Medicare Beneficiaries, 2023-2024",
    evidence_type: "academic" as const,
    source: "MMWR Morbidity and Mortality Weekly Report",
    year: 2024,
    authors: "Surie D, Bonnell L, Adams K, et al.",
    abstract:
      "Observational study using a test-negative design showing 75% vaccine effectiveness against RSV-associated hospitalization among adults aged 60 and older in the first US post-licensure season.",
    tags: ["Observational", "VE", "Medicare", "Hospitalization"],
  },
  {
    id: "demo-ev-003",
    title:
      "ACIP Recommendations for RSV Vaccination in Adults Aged 60 Years and Older",
    evidence_type: "regulatory" as const,
    source: "CDC Advisory Committee on Immunization Practices",
    year: 2024,
    authors: "Melgar M, Britton A, Roper LE, et al.",
    abstract:
      "Updated ACIP shared clinical decision-making recommendation for RSV vaccination using either RSVPreF or RSVpreF3 vaccines for adults aged 60 and older, with guidance on timing and risk-based targeting.",
    tags: ["ACIP", "Guideline", "CDC", "Recommendation"],
  },
  {
    id: "demo-ev-004",
    title:
      "Burden of RSV-Associated Hospitalizations Among US Adults, 2019-2023",
    evidence_type: "academic" as const,
    source: "Clinical Infectious Diseases",
    year: 2024,
    authors: "Havers FP, Whitaker M, Melgar M, et al.",
    abstract:
      "Multi-season analysis from RSV-NET surveillance estimating approximately 159,000 RSV-associated hospitalizations annually among US adults, with highest rates in those 65 years and older.",
    tags: ["Epidemiology", "Burden", "Hospitalization", "Surveillance"],
  },
  {
    id: "demo-ev-005",
    title: "Study team discussion: Data source selection and feasibility notes",
    evidence_type: "note" as const,
    source: "Internal",
    year: 2025,
    authors: "Study team",
    abstract:
      "Notes from feasibility assessment comparing Kaiser Permanente, Veterans Health Administration, and Optum databases for RSV VE study. KP selected for superior RT-PCR testing capture and vaccination records linkage.",
    tags: ["Feasibility", "Data Source", "Internal"],
  },
] as const;

/** Pre-populated screening decisions for the demo. */
export const DEMO_SCREENING_DECISIONS = [
  {
    id: "demo-sd-001",
    protocol_id: "demo-protocol-001",
    evidence_id: "demo-ev-001",
    stage: "included" as const,
    decision: "include" as const,
  },
  {
    id: "demo-sd-002",
    protocol_id: "demo-protocol-001",
    evidence_id: "demo-ev-002",
    stage: "included" as const,
    decision: "include" as const,
  },
  {
    id: "demo-sd-003",
    protocol_id: "demo-protocol-001",
    evidence_id: "demo-ev-003",
    stage: "eligibility" as const,
    decision: "include" as const,
  },
  {
    id: "demo-sd-004",
    protocol_id: "demo-protocol-001",
    evidence_id: "demo-ev-004",
    stage: "screening" as const,
    decision: "exclude" as const,
    exclusion_reason: "Epidemiology only — no vaccine effectiveness data",
  },
  {
    id: "demo-sd-005",
    protocol_id: "demo-protocol-001",
    evidence_id: "demo-ev-005",
    stage: "identification" as const,
    decision: "exclude" as const,
    exclusion_reason: "Internal notes — not primary literature",
  },
] as const;

/** Pre-computed PRISMA stage counts for the demo. */
export const DEMO_SCREENING_COUNTS = {
  identification: {
    total: 5,
    pending: 0,
    include: 4,
    exclude: 1,
    duplicate: 0,
  },
  screening: { total: 4, pending: 0, include: 3, exclude: 1, duplicate: 0 },
  eligibility: { total: 3, pending: 0, include: 3, exclude: 0, duplicate: 0 },
  included: { total: 2, pending: 0, include: 2, exclude: 0, duplicate: 0 },
} as const;
