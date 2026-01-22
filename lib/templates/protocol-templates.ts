export interface ProtocolTemplate {
  id: string
  name: string
  category: "effectiveness" | "safety" | "immunogenicity" | "general"
  description: string
  icon: string
  title: string
  study_question: string
  population: string
  intervention: string
  comparator: string
  outcomes: string
  study_design: string
  inclusion_criteria?: string[]
  exclusion_criteria?: string[]
  data_sources?: string[]
  endpoints?: string[]
  statistical_methods?: string
  sample_size_rationale?: string
  use_cases: string[]
  typical_duration: string
  regulatory_context?: string
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: "meningococcal-ve",
    name: "Meningococcal Vaccine Effectiveness Study",
    category: "effectiveness",
    description:
      "Real-world effectiveness study for meningococcal conjugate vaccines against invasive meningococcal disease",
    icon: "🦠",
    title:
      "Real-World Effectiveness of Meningococcal ACWY Conjugate Vaccine Against Invasive Meningococcal Disease",
    study_question:
      "What is the vaccine effectiveness of meningococcal ACWY conjugate vaccine in preventing invasive meningococcal disease (IMD) among adolescents and young adults in routine use?",
    population: `Target population: Adolescents and young adults aged 11-25 years

Characteristics:
- Enrolled in integrated healthcare system with vaccination records
- At least 12 months of continuous enrollment
- Residing in study area during observation period

Stratification variables:
- Age groups: 11-15, 16-18, 19-25 years
- Time since vaccination: <1 year, 1-3 years, 3-5 years, >5 years
- Risk factors: complement deficiency, asplenia, HIV infection`,
    intervention: `Meningococcal ACWY conjugate vaccine (MenACWY)
- Formulations: MenACWY-CRM or MenACWY-D
- Dosing: Single dose or booster dose (per local recommendations)
- Route: Intramuscular injection
- Documented in electronic health records or immunization registries`,
    comparator: `Unvaccinated individuals matched on:
- Age (±6 months)
- Sex
- Geographic location
- Healthcare utilization patterns
- Presence of risk factors

Alternative comparator: Historical pre-vaccination cohort (if available)`,
    outcomes: `Primary outcome:
- Laboratory-confirmed invasive meningococcal disease (IMD) caused by serogroups A, C, W, or Y
- Confirmed by culture or PCR from normally sterile site

Secondary outcomes:
- Serogroup-specific IMD (A, C, W, Y separately)
- IMD severity (meningitis vs. septicemia vs. both)
- IMD-related hospitalization
- IMD-related mortality

Outcome ascertainment:
- National surveillance systems
- Hospital discharge databases (ICD-10: A39.0-A39.9)
- Laboratory records`,
    study_design: `Retrospective cohort study using test-negative design

Design features:
- Data source: Integrated healthcare database with linkage to:
  - Electronic health records
  - Vaccination registries
  - Laboratory databases
  - Hospital discharge records
- Follow-up period: 2015-2024 (adjust based on vaccine introduction)
- Analysis: Cox proportional hazards regression with time-varying vaccination status
- Vaccine effectiveness calculation: VE = (1 - HR) × 100%`,
    inclusion_criteria: [
      "Age 11-25 years during study period",
      "Minimum 12 months continuous enrollment in healthcare system",
      "Complete vaccination records available",
      "Resident in study catchment area",
      "No history of meningococcal disease prior to study entry",
    ],
    exclusion_criteria: [
      "Receipt of meningococcal B vaccine (if analyzing serogroup-specific VE)",
      "Participation in meningococcal vaccine clinical trials",
      "Diagnosis of IMD within 14 days of vaccination (to exclude breakthrough cases during seroconversion period)",
      "Missing critical covariates (>20% missing data)",
      "Immunocompromising conditions not documented in risk-adjustment variables",
    ],
    data_sources: [
      "National/regional immunization registry",
      "Electronic health records (EHR) system",
      "National meningococcal surveillance system",
      "Laboratory information systems",
      "Hospital discharge databases",
      "Pharmacy dispensing records (for immunosuppressive medications)",
      "Census data for socioeconomic variables",
    ],
    endpoints: [
      "Vaccine effectiveness against all-cause IMD (serogroups A/C/W/Y)",
      "Serogroup-specific vaccine effectiveness",
      "VE by time since vaccination (waning immunity)",
      "VE by age group",
      "VE by number of doses received",
      "VE in high-risk populations vs. healthy individuals",
    ],
    statistical_methods: `Primary analysis:
- Cox proportional hazards model with vaccination as time-varying covariate
- Adjustment for confounders: age, sex, calendar time, geographic region, healthcare utilization, comorbidities
- Stratified analysis by serogroup, age, time since vaccination
- Sensitivity analyses: Different outcome definitions, lag periods, control for indication bias

Sample size calculation:
- Assumed VE: 80%
- Expected IMD incidence in unvaccinated: 1-2 per 100,000 person-years
- Power: 80% to detect VE ≥60%
- Alpha: 0.05
- Estimated cohort size: 500,000-1,000,000 person-years`,
    sample_size_rationale:
      "Based on expected IMD incidence of 1.5 per 100,000 person-years in unvaccinated population, and assumed vaccine effectiveness of 80%, approximately 750,000 person-years of follow-up are needed to observe 25-30 IMD cases and achieve 80% power to detect VE with 95% confidence interval width of ±20%.",
    use_cases: [
      "Post-licensure vaccine effectiveness monitoring",
      "Assessment of waning immunity and booster dose need",
      "Evaluation of vaccine impact in national immunization programs",
      "Regulatory submissions for label updates",
    ],
    typical_duration: "12-18 months from protocol development to final report",
    regulatory_context:
      "Suitable for FDA/EMA real-world evidence submissions. Aligns with FDA guidance on RWE for regulatory decision-making and EMA DARWIN EU standards.",
  },
  {
    id: "covid-booster-ve",
    name: "COVID-19 Booster Vaccine Effectiveness",
    category: "effectiveness",
    description:
      "Real-world effectiveness of COVID-19 booster doses against Omicron variants",
    icon: "💉",
    title:
      "Effectiveness of COVID-19 mRNA Booster Vaccines Against Omicron-Related Hospitalization",
    study_question:
      "What is the incremental vaccine effectiveness of COVID-19 mRNA booster doses (3rd or 4th dose) compared to primary series (2 doses) in preventing COVID-19-related hospitalization among adults during Omicron variant predominance?",
    population: `Target population: Adults aged ≥18 years

Inclusion:
- Completed primary COVID-19 vaccination series (2 doses mRNA or vector vaccine)
- Enrolled in integrated healthcare system
- No prior documented COVID-19 infection (for infection-naive analysis)

Stratification:
- Age groups: 18-49, 50-64, 65-74, ≥75 years
- Comorbidity burden: 0, 1-2, ≥3 high-risk conditions
- Time since primary series: <6 months, 6-9 months, ≥9 months
- Prior infection status: infection-naive vs. hybrid immunity`,
    intervention: `COVID-19 mRNA booster vaccine (3rd or 4th dose)
- Products: BNT162b2 (Pfizer-BioNTech) or mRNA-1273 (Moderna)
- Dosing: Standard or adapted formulation (bivalent/updated)
- Timing: ≥3 months after completion of primary series or previous booster
- Documented in electronic immunization registry`,
    comparator: `Primary series only (2 doses)
- Matched on:
  - Age (±2 years)
  - Calendar time of primary series completion (±30 days)
  - Comorbidity score
  - Geographic region
  - Prior infection status
  
Time-varying comparison: Person-time contributed by individuals who later receive booster`,
    outcomes: `Primary outcome:
- COVID-19-related hospitalization (≥24 hours)
- Confirmed by: Positive SARS-CoV-2 RT-PCR or antigen test within 14 days before or during hospitalization
- ICD-10: U07.1 (COVID-19, virus identified)

Secondary outcomes:
- Severe COVID-19 (ICU admission, mechanical ventilation, or death)
- COVID-19-related ED visits not resulting in hospitalization
- All-cause mortality within 30 days
- Symptomatic COVID-19 infection (outpatient)

Variant-specific analysis:
- Stratified by predominant variant period (BA.1, BA.2, BA.4/5, XBB, etc.)`,
    study_design: `Test-negative design with matched cohort analysis

Design:
- Data source: Multi-site healthcare network with integrated EHR
- Study period: December 2021 - Present (Omicron era)
- Follow-up: From booster eligibility date (3 months post-primary series) until outcome, death, disenrollment, or study end
- Analysis: Time-varying Cox regression, accounting for immortal time bias
- VE calculation: VE = (1 - aHR) × 100%

Test-negative component:
- Cases: COVID-19 test-positive hospitalizations
- Controls: Test-negative respiratory illness hospitalizations
- Odds ratio of vaccination among cases vs. controls`,
    inclusion_criteria: [
      "Age ≥18 years at time of booster eligibility",
      "Completed COVID-19 primary vaccination series ≥3 months prior",
      "Continuous enrollment in healthcare system during follow-up",
      "Complete vaccination records in EHR or registry",
      "No contraindications to COVID-19 vaccination",
    ],
    exclusion_criteria: [
      "Immunocompromising conditions requiring additional primary dose (unless analyzing separately)",
      "Documented COVID-19 infection within 90 days before study entry (for infection-naive cohort)",
      "Receipt of non-mRNA COVID-19 vaccines as booster (analyze separately)",
      "Incomplete primary series",
      "Long-term care facility residents (analyze separately due to different exposure risk)",
    ],
    data_sources: [
      "Electronic health records (hospitalizations, diagnoses, lab results)",
      "COVID-19 immunization registry",
      "SARS-CoV-2 laboratory testing databases",
      "State/national surveillance systems (for variant data)",
      "Death registries",
      "Claims databases (if EHR linkage available)",
      "Genomic sequencing data (for variant confirmation)",
    ],
    endpoints: [
      "VE of booster vs. primary series against Omicron hospitalization",
      "VE by time since booster (<2 months, 2-4 months, 4-6 months, >6 months)",
      "VE by age and comorbidity status",
      "VE by vaccine product (Pfizer vs. Moderna)",
      "VE by booster dose number (3rd vs. 4th)",
      "VE in infection-naive vs. hybrid immunity populations",
      "VE against severe outcomes (ICU/death)",
    ],
    statistical_methods: `Primary analysis:
- Cox proportional hazards with time-varying vaccination exposure
- Inverse probability weighting to adjust for confounding
- Spline models to assess non-linear time-dependent VE
- Adjustment: Age, sex, race/ethnicity, comorbidities, prior infection, calendar time, local transmission intensity

Sensitivity analyses:
- Varying lag periods between vaccination and outcome (7 vs. 14 days)
- Alternative outcome definitions (test-positive admissions vs. COVID-19 primary discharge diagnosis)
- Restriction to periods of specific variant predominance
- E-value calculation for unmeasured confounding`,
    sample_size_rationale:
      "To detect VE ≥50% with 80% power and 95% CI width ≤20%, assuming 30% booster uptake and 5 hospitalizations per 1,000 person-years in primary-series-only group, approximately 200,000 person-years needed.",
    use_cases: [
      "Public health decision-making on booster recommendations",
      "Regulatory review of booster dose authorizations",
      "Health economic analyses of vaccination strategies",
      "Real-time effectiveness monitoring during variant emergence",
    ],
    typical_duration: "8-12 months (can be updated continuously)",
    regulatory_context:
      "Aligned with FDA guidance on COVID-19 vaccine effectiveness studies and CDC VE network standards. Suitable for emergency use authorization updates.",
  },
  {
    id: "hpv-safety",
    name: "HPV Vaccine Long-term Safety Study",
    category: "safety",
    description:
      "Post-licensure safety monitoring for HPV vaccines focusing on rare adverse events",
    icon: "🛡️",
    title:
      "Long-term Safety of HPV Vaccination: Population-based Cohort Study of Autoimmune and Neurological Outcomes",
    study_question:
      "Is HPV vaccination associated with increased risk of autoimmune or neurological adverse events in adolescents and young adults over a 10-year follow-up period?",
    population: `Target population: Adolescents aged 9-26 years at vaccination

Cohort definition:
- Exposed cohort: Individuals who received ≥1 dose of HPV vaccine
- Unexposed cohort: Age-matched unvaccinated individuals

Inclusion:
- Enrolled in healthcare system before age 15
- Minimum 1 year pre-vaccination enrollment (for baseline health assessment)
- No history of target adverse events before vaccination

Sample: 500,000 vaccinated + 500,000 matched unvaccinated`,
    intervention: `HPV vaccines (any formulation):
- Bivalent (HPV 16/18) - Cervarix
- Quadrivalent (HPV 6/11/16/18) - Gardasil
- Nonavalent (HPV 6/11/16/18/31/33/45/52/58) - Gardasil 9

Exposure definition:
- Any dose vs. no doses (primary analysis)
- Stratified by number of doses (1, 2, 3+)
- Time-varying exposure status`,
    comparator: `Unvaccinated matched controls:
- Matching criteria (1:1 ratio):
  - Sex (females only or include males)
  - Birth year (±1 year)
  - Healthcare system enrollment date (±3 months)
  - Baseline healthcare utilization (quartiles)
  - Propensity score for vaccination

Controls selected from same source population`,
    outcomes: `Pre-specified adverse events of special interest (AESI):

Autoimmune conditions:
- Guillain-Barré syndrome (GBS)
- Multiple sclerosis (MS) and other demyelinating diseases
- Type 1 diabetes mellitus
- Autoimmune thyroid disease
- Systemic lupus erythematosus (SLE)
- Inflammatory bowel disease
- Rheumatoid arthritis

Neurological conditions:
- Seizure disorders (new-onset epilepsy)
- Complex regional pain syndrome (CRPS)
- Postural orthostatic tachycardia syndrome (POTS)

Other safety signals:
- Venous thromboembolism (VTE)
- Anaphylaxis (within 24 hours of vaccination)

Outcome validation:
- Medical record review for all potential cases
- Confirmation by board-certified specialists
- Blinded adjudication using Brighton Collaboration criteria`,
    study_design: `Retrospective cohort study with matched design

Features:
- Data source: Nationwide healthcare databases with linked registries
- Accrual period: 2010-2020
- Follow-up: From vaccination (or matched index date) until outcome, death, disenrollment, or December 31, 2024 (up to 10 years)
- Analysis: Cox regression with stratification by matching factors
- Risk window analysis: Multiple windows tested (0-42 days, 43-180 days, 181-365 days, >365 days post-vaccination)

Self-controlled designs (sensitivity analysis):
- Self-controlled case series (SCCS) for acute events
- Self-controlled risk interval analysis`,
    inclusion_criteria: [
      "Age 9-26 years at first HPV vaccine dose (or matched index date)",
      "Continuous enrollment in healthcare system ≥12 months before and after index date",
      "Complete medical history available in electronic records",
      "No contraindications to HPV vaccination documented",
      "Residence in study area throughout follow-up",
    ],
    exclusion_criteria: [
      "Pre-existing autoimmune or neurological conditions of interest",
      "Diagnosis of target AESI within 6 months before index date",
      "Immunocompromising conditions or immunosuppressive therapy",
      "Pregnancy at time of vaccination (analyze separately)",
      "Participation in HPV vaccine clinical trials",
      "Missing critical baseline covariates",
    ],
    data_sources: [
      "National immunization registry",
      "Hospital discharge databases (ICD-10 codes)",
      "Specialty clinic databases (neurology, rheumatology, endocrinology)",
      "Pharmacy dispensing records (disease-modifying drugs)",
      "Laboratory databases (autoantibodies, diagnostic tests)",
      "Medical record review system (for case validation)",
      "Vital statistics (mortality data)",
    ],
    endpoints: [
      "Incidence rate ratio (IRR) for each AESI (vaccinated vs. unvaccinated)",
      "Absolute risk difference per 100,000 person-years",
      "Number needed to harm (if signal detected)",
      "Time-to-event analysis for each outcome",
      "Dose-response relationship (1 vs. 2 vs. 3 doses)",
      "Age and sex-stratified risk estimates",
      "Temporal clustering analysis (post-vaccination risk windows)",
    ],
    statistical_methods: `Primary analysis:
- Stratified Cox proportional hazards models
- Adjustment for confounders: Age, sex, calendar year, geographic region, healthcare utilization, comorbidities, other vaccinations
- Multiple testing correction: Bonferroni or false discovery rate (FDR) for multiple AESI

Secondary analyses:
- Self-controlled case series (SCCS) to control for time-invariant confounding
- Nested case-control analysis within cohort
- Propensity score matching with various caliper widths
- Quantitative bias analysis for unmeasured confounding

Power calculation:
- 500,000 per group provides >80% power to detect IRR ≥1.5 for events with baseline incidence ≥5 per 100,000 person-years`,
    sample_size_rationale:
      "For rare events (incidence 5-10 per 100,000 person-years), 1 million total participants with average 5-year follow-up provides 80% power to detect IRR ≥1.5 with alpha=0.01 (adjusted for multiple comparisons).",
    use_cases: [
      "Regulatory post-marketing safety surveillance",
      "Pharmacovigilance signal detection and validation",
      "Public health communication on vaccine safety",
      "Litigation support and risk-benefit analyses",
    ],
    typical_duration: "24-36 months from protocol to final report",
    regulatory_context:
      "Aligns with FDA/EMA pharmacovigilance requirements and WHO Brighton Collaboration AESI framework. Suitable for PADER (Pediatric Adverse Event Reporting) submissions.",
  },
  {
    id: "flu-seasonal-ve",
    name: "Seasonal Influenza Vaccine Effectiveness",
    category: "effectiveness",
    description:
      "Annual monitoring of influenza vaccine effectiveness using test-negative design",
    icon: "🤧",
    title:
      "Interim and End-of-Season Influenza Vaccine Effectiveness Against Medically-Attended Influenza",
    study_question:
      "What is the seasonal influenza vaccine effectiveness in preventing medically-attended laboratory-confirmed influenza during the [YEAR-YEAR] influenza season?",
    population: `Enrollment criteria:
- Age ≥6 months (or age-specific if pediatric/adult focus)
- Presenting to outpatient clinic, urgent care, or emergency department
- Acute respiratory illness (ARI) with:
  - Cough AND
  - Fever (≥37.8°C or subjective) or feverishness within past 7 days
- Illness onset ≤7 days before presentation
- Eligible for influenza testing per site protocols

Exclusion:
- Hospitalized >24 hours before enrollment
- Receipt of antiviral treatment before specimen collection
- Previously enrolled in current season`,
    intervention: `Seasonal influenza vaccination (current season)
- Formulations: Quadrivalent inactivated (IIV4), live attenuated (LAIV4), recombinant (RIV4), high-dose (HD-IIV4), adjuvanted (aIIV4)
- Timing: Received ≥14 days before illness onset
- Documentation: Self-report, medical records, or immunization registry verification

Partial vaccination:
- <14 days post-vaccination (excluded from primary analysis or analyzed separately)`,
    comparator: `Unvaccinated (current season):
- No influenza vaccine received in current season
- OR <14 days since vaccination

Prior-season vaccination status:
- Documented for analysis of repeated vaccination effects`,
    outcomes: `Primary outcome:
- Laboratory-confirmed influenza (any type/subtype)
- Detection methods: RT-PCR or rapid molecular assay
- Specimen: Nasal/nasopharyngeal swab or nasal wash

Secondary outcomes:
- Influenza A vs. influenza B
- Influenza A subtypes: A(H1N1)pdm09 vs. A(H3N2)
- Vaccine-matched vs. mismatched strains (based on genetic/antigenic characterization)
- Severe outcomes: Hospitalization or ICU admission among influenza-positive
- Outpatient visits vs. ED visits vs. hospitalization

Test-negative controls:
- ARI patients testing negative for influenza (may test positive for other respiratory viruses)`,
    study_design: `Test-negative case-control design

Study structure:
- Multi-site ambulatory care network (10-20 sites)
- Enrollment period: November - April (or local influenza season)
- Weekly enrollment targets: 50-100 patients per site
- Real-time data entry and laboratory testing
- Interim analyses: Mid-season (January/February) and end-of-season (May)

Analysis:
- Logistic regression comparing odds of vaccination among test-positive (cases) vs. test-negative (controls)
- VE = (1 - OR) × 100%
- Adjustment for confounders and effect modifiers`,
    inclusion_criteria: [
      "Meets ARI case definition (cough + fever/feverishness within 7 days)",
      "Illness onset ≤7 days before presentation",
      "Able to provide respiratory specimen",
      "No antiviral treatment before specimen collection",
      "Age ≥6 months",
      "Enrolled ≤1 time per influenza season",
    ],
    exclusion_criteria: [
      "Hospitalized >24 hours before enrollment",
      "Receipt of antivirals before specimen collection",
      "Unable to verify vaccination status",
      "Influenza vaccination 0-13 days before illness onset (excluded from primary analysis)",
      "Previously enrolled in current season",
      "Healthcare workers or long-term care residents (may analyze separately)",
    ],
    data_sources: [
      "Electronic medical records (demographics, diagnoses, visit dates)",
      "Immunization registries (vaccination dates and products)",
      "Laboratory information systems (influenza test results, Ct values)",
      "Genomic surveillance databases (strain characterization)",
      "Patient interviews or surveys (supplemental vaccination history)",
      "WHO FluNet (for circulating strain monitoring)",
      "CDC FluVaxView (national vaccination coverage data)",
    ],
    endpoints: [
      "Overall VE against any influenza",
      "VE by influenza type (A vs. B)",
      "VE by influenza A subtype (H1N1pdm09 vs. H3N2)",
      "VE by age group (6mo-8yr, 9-17yr, 18-49yr, 50-64yr, ≥65yr)",
      "VE by vaccine type (standard-dose vs. high-dose vs. adjuvanted)",
      "VE by prior-season vaccination status",
      "VE by calendar time (early vs. late season)",
      "VE against medically-attended vs. hospitalized influenza",
    ],
    statistical_methods: `Primary analysis:
- Multivariable logistic regression
- Dependent variable: Laboratory-confirmed influenza (yes/no)
- Independent variable: Vaccination status (vaccinated ≥14 days vs. unvaccinated)
- Covariates: Age (categorical), sex, race/ethnicity, chronic medical conditions, enrollment site, calendar time (biweekly intervals)

VE calculation:
- VE = (1 - aOR) × 100%
- 95% CI calculated from model coefficients

Stratified analyses:
- By age, vaccine type, virus type/subtype
- Interaction terms to test effect modification
- Sensitivity analyses excluding indeterminate vaccination status

Sample size:
- Target 2,000-3,000 total enrollments per season
- Provides 80% power to detect VE ≥40% with 30-50% vaccination coverage and 30-40% test-positivity`,
    sample_size_rationale:
      "Based on expected 40% test positivity and 40% vaccination coverage, enrollment of 2,500 patients provides >80% power to detect overall VE ≥35% and sufficient precision for subgroup analyses (95% CI width ~±15%).",
    use_cases: [
      "Annual US Flu VE Network surveillance",
      "WHO Global Influenza Surveillance and Response System (GISRS)",
      "Vaccine strain selection for next season",
      "Public health messaging on vaccination",
      "Real-time monitoring during pandemic preparedness",
    ],
    typical_duration: "6-8 months (November - May) per season, recurring annually",
    regulatory_context:
      "Follows CDC Influenza Division protocols and WHO case definitions. Results inform FDA VRBPAC recommendations for strain composition.",
  },
  {
    id: "general-ve-template",
    name: "General Vaccine Effectiveness Study",
    category: "general",
    description:
      "Flexible template for any vaccine effectiveness study - customize as needed",
    icon: "📋",
    title: "[VACCINE NAME] Vaccine Effectiveness Against [OUTCOME] in [POPULATION]",
    study_question:
      "What is the effectiveness of [VACCINE NAME] in preventing [PRIMARY OUTCOME] among [TARGET POPULATION] in real-world settings?",
    population: `Target population: [Describe age, geographic location, risk factors]

Inclusion criteria:
- Age: [specify range]
- Enrollment: [healthcare system, geographic area]
- Observation period: [dates]
- Eligibility: [vaccine-eligible per guidelines]

Exclusion criteria:
- [Contraindications to vaccination]
- [Pre-existing conditions that modify vaccine response]
- [Incomplete data or loss to follow-up criteria]

Stratification variables:
- Age groups: [specify]
- Comorbidity status: [specify]
- [Other relevant subgroups]`,
    intervention: `[VACCINE NAME]
- Product(s): [Brand names, manufacturers]
- Formulation: [Live, inactivated, subunit, mRNA, etc.]
- Dosing schedule: [Number of doses, intervals]
- Route: [Intramuscular, subcutaneous, intranasal, oral]
- Documentation: [Source of vaccination records]

Exposure definition:
- Fully vaccinated: [Define based on doses and timing]
- Partially vaccinated: [If applicable]
- Time-varying exposure: [If applicable]`,
    comparator: `Unvaccinated individuals OR [alternative comparator]

Matching/adjustment strategy:
- [Propensity score matching, inverse probability weighting, or other methods]
- Matching variables: [Age, sex, comorbidities, healthcare utilization, etc.]
- Control for confounding: [List confounders]

Alternative comparators:
- [Historical controls, different vaccine products, placebo recipients from trials]`,
    outcomes: `Primary outcome:
- [Specify disease/event of interest]
- Case definition: [Clinical, laboratory-confirmed, or composite]
- Ascertainment method: [Medical records, surveillance, patient report]

Secondary outcomes:
- [Severity measures: hospitalization, ICU, death]
- [Symptom-based outcomes]
- [Pathogen-specific outcomes if applicable]

Outcome validation:
- [Medical record review, adjudication process]
- [Diagnostic criteria or case confirmation methods]`,
    study_design: `Study type: [Choose one]
- Retrospective cohort
- Prospective cohort
- Test-negative case-control
- Screening method
- Indirect cohort method

Data source: [Describe databases, registries, surveillance systems]

Study period: [Start date - End date]

Follow-up: [Duration and censoring rules]

Analysis approach: [Cox regression, logistic regression, Poisson regression, etc.]

VE calculation: [Specify formula: VE = (1 - HR) × 100% or VE = (1 - OR) × 100%]`,
    inclusion_criteria: [
      "Age eligibility: [specify range]",
      "Geographic or enrollment criteria: [specify]",
      "Minimum follow-up duration: [specify]",
      "Data completeness requirements: [specify]",
      "Other: [customize as needed]",
    ],
    exclusion_criteria: [
      "Contraindications to vaccination: [specify]",
      "Pre-existing disease/immunity: [specify]",
      "Participation in clinical trials: [yes/no]",
      "Missing critical data: [specify threshold]",
      "Other: [customize as needed]",
    ],
    data_sources: [
      "Electronic health records",
      "Vaccination registries",
      "Laboratory databases",
      "Disease surveillance systems",
      "Hospital discharge records",
      "Vital statistics",
      "[Add other relevant sources]",
    ],
    endpoints: [
      "Overall vaccine effectiveness",
      "VE by time since vaccination",
      "VE by age group",
      "VE by vaccine product/dose",
      "VE against severe outcomes",
      "[Add other stratifications]",
    ],
    statistical_methods: `Primary analysis:
- [Specify regression model: Cox, logistic, Poisson, etc.]
- Adjustment for confounders: [List variables]
- Handling of time-varying exposures: [If applicable]
- Missing data strategy: [Multiple imputation, complete case, etc.]

Sensitivity analyses:
- [Alternative outcome definitions]
- [Different lag periods]
- [Restriction to specific subgroups]
- [Quantitative bias analysis]

Sample size and power:
- [State assumptions and calculations]`,
    sample_size_rationale:
      "[Describe expected incidence rates, vaccination coverage, minimum detectable effect size, and power calculations]",
    use_cases: [
      "Post-licensure effectiveness monitoring",
      "Policy decision support",
      "Regulatory submissions",
      "Academic publication",
    ],
    typical_duration: "[X months from protocol to analysis]",
    regulatory_context:
      "[Describe if study aligns with FDA, EMA, or WHO guidelines]",
  },
]

export function getTemplateById(id: string): ProtocolTemplate | undefined {
  return PROTOCOL_TEMPLATES.find((template) => template.id === id)
}

export function getTemplatesByCategory(
  category: ProtocolTemplate["category"]
): ProtocolTemplate[] {
  return PROTOCOL_TEMPLATES.filter((template) => template.category === category)
}

export function searchTemplates(query: string): ProtocolTemplate[] {
  const lowerQuery = query.toLowerCase()
  return PROTOCOL_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.use_cases.some((useCase) => useCase.toLowerCase().includes(lowerQuery))
  )
}
