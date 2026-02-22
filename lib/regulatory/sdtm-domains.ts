// =============================================================================
// CDISC SDTM DOMAIN DEFINITIONS
// =============================================================================
// CDISC Study Data Tabulation Model (SDTM) v3.3 domain structures.
// Defines 10 domains (5 trial design + 5 clinical) with full variable specs
// for vaccine clinical trial data tabulation and regulatory submission.
// =============================================================================

/** SDTM variable data types per CDISC v3.3 */
export type SDTMVariableType = "Char" | "Num";

/** SDTM variable role */
export type SDTMVariableRole =
  | "Identifier"
  | "Topic"
  | "Synonym Qualifier"
  | "Record Qualifier"
  | "Timing"
  | "Rule";

/** A single SDTM variable definition */
export interface SDTMVariable {
  /** Variable name, e.g. "STUDYID", "DOMAIN" */
  name: string;
  /** Human-readable label */
  label: string;
  /** Data type per CDISC v3.3 */
  type: SDTMVariableType;
  /** Role within the observation */
  role: SDTMVariableRole;
  /** Whether the variable is Core/Required per CDISC */
  required: boolean;
  /** Controlled terminology reference, if any */
  codeList?: string;
  /** Description of the variable's purpose */
  description: string;
}

/** Category of SDTM domain */
export type SDTMDomainCategory = "trial-design" | "clinical";

/** A single SDTM domain definition */
export interface SDTMDomainDefinition {
  /** Two-letter domain code, e.g. "TS", "DM" */
  code: string;
  /** Human-readable domain label, e.g. "Trial Summary" */
  label: string;
  /** Description of the domain's purpose */
  description: string;
  /** Whether this is a trial-design or clinical domain */
  category: SDTMDomainCategory;
  /** Variable definitions for this domain */
  variables: SDTMVariable[];
  /** Whether VaxEvidence can auto-fill this domain from protocol data */
  autoPopulate: boolean;
}

// =============================================================================
// TRIAL DESIGN DOMAINS (auto-populated from protocol PICO)
// =============================================================================

const TS_DOMAIN: SDTMDomainDefinition = {
  code: "TS",
  label: "Trial Summary",
  description:
    "Trial-level summary parameters describing the overall design, objectives, " +
    "and characteristics of the clinical study. Auto-populated from VaxEvidence " +
    "protocol metadata and PICO elements.",
  category: "trial-design",
  autoPopulate: true,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study, mapped from protocol ID.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'TS'.",
    },
    {
      name: "TSSEQ",
      label: "Sequence Number",
      type: "Num",
      role: "Identifier",
      required: true,
      description: "Sequence number for ordering parameters within the domain.",
    },
    {
      name: "TSPARMCD",
      label: "Trial Summary Parameter Short Name",
      type: "Char",
      role: "Topic",
      required: true,
      codeList: "TSPARMCD",
      description:
        "Short name of the trial summary parameter (controlled terminology).",
    },
    {
      name: "TSPARM",
      label: "Trial Summary Parameter",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full descriptive name of the trial summary parameter.",
    },
    {
      name: "TSVAL",
      label: "Parameter Value",
      type: "Char",
      role: "Record Qualifier",
      required: true,
      description: "Value of the trial summary parameter.",
    },
    {
      name: "TSVALNF",
      label: "Parameter Null Flavor",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Null flavor for the parameter value when no value is provided.",
    },
    {
      name: "TSVALCD",
      label: "Parameter Value Code",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Coded value for the parameter when controlled terminology applies.",
    },
  ],
};

const TA_DOMAIN: SDTMDomainDefinition = {
  code: "TA",
  label: "Trial Arms",
  description:
    "Defines the planned arms (treatment groups) of the study and their " +
    "associated elements and epochs. Auto-populated from protocol intervention " +
    "and comparator fields.",
  category: "trial-design",
  autoPopulate: true,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'TA'.",
    },
    {
      name: "ARMCD",
      label: "Planned Arm Code",
      type: "Char",
      role: "Topic",
      required: true,
      description:
        "Short code for the planned arm (e.g., 'TRT' for treatment).",
    },
    {
      name: "ARM",
      label: "Description of Planned Arm",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full description of the planned treatment arm.",
    },
    {
      name: "TAETORD",
      label: "Planned Order of Element within Arm",
      type: "Char",
      role: "Timing",
      required: true,
      description: "Number indicating the order of the element within the arm.",
    },
    {
      name: "ETCD",
      label: "Element Code",
      type: "Char",
      role: "Record Qualifier",
      required: true,
      description: "Short code for the trial element.",
    },
    {
      name: "ELEMENT",
      label: "Description of Element",
      type: "Char",
      role: "Synonym Qualifier",
      required: false,
      description: "Full description of the trial element.",
    },
    {
      name: "TABRANCH",
      label: "Branch",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Branching logic for the element within the arm.",
    },
    {
      name: "EPOCH",
      label: "Epoch",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Trial epoch to which the element belongs.",
    },
  ],
};

const TE_DOMAIN: SDTMDomainDefinition = {
  code: "TE",
  label: "Trial Elements",
  description:
    "Defines the basic building blocks (elements) of the trial design, " +
    "including screening, treatment, and follow-up periods. Auto-populated " +
    "with standard vaccine trial elements.",
  category: "trial-design",
  autoPopulate: true,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'TE'.",
    },
    {
      name: "ETCD",
      label: "Element Code",
      type: "Char",
      role: "Topic",
      required: true,
      description: "Short code for the trial element.",
    },
    {
      name: "ELEMENT",
      label: "Description of Element",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full description of the trial element.",
    },
    {
      name: "TESTRL",
      label: "Rule for Start of Element",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Rule or condition that triggers the start of this element.",
    },
    {
      name: "TEENRL",
      label: "Rule for End of Element",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Rule or condition that triggers the end of this element.",
    },
    {
      name: "TEDUR",
      label: "Planned Duration of Element",
      type: "Char",
      role: "Timing",
      required: false,
      description:
        "Planned duration of the element in ISO 8601 duration format.",
    },
  ],
};

const TI_DOMAIN: SDTMDomainDefinition = {
  code: "TI",
  label: "Trial Inclusion/Exclusion Criteria",
  description:
    "Defines the inclusion and exclusion criteria for trial enrollment. " +
    "Auto-populated by parsing the protocol population field into " +
    "individual criteria.",
  category: "trial-design",
  autoPopulate: true,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'TI'.",
    },
    {
      name: "IETESTCD",
      label: "Inclusion/Exclusion Criterion Short Name",
      type: "Char",
      role: "Topic",
      required: true,
      description:
        "Short code for the criterion (e.g., 'IN01' for inclusion #1).",
    },
    {
      name: "IETEST",
      label: "Inclusion/Exclusion Criterion",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full text of the inclusion or exclusion criterion.",
    },
    {
      name: "IECAT",
      label: "Inclusion/Exclusion Category",
      type: "Char",
      role: "Record Qualifier",
      required: true,
      codeList: "IECAT",
      description: "Category: 'INCLUSION' or 'EXCLUSION'.",
    },
    {
      name: "IESCAT",
      label: "Inclusion/Exclusion Subcategory",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Subcategory for further classification of the criterion.",
    },
    {
      name: "TIRL",
      label: "Inclusion/Exclusion Criterion Rule",
      type: "Char",
      role: "Rule",
      required: false,
      description:
        "Algorithmic rule describing how the criterion is evaluated.",
    },
    {
      name: "TIVERS",
      label: "Protocol Criteria Versions",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Protocol version in which this criterion was first introduced.",
    },
  ],
};

const TV_DOMAIN: SDTMDomainDefinition = {
  code: "TV",
  label: "Trial Visits",
  description:
    "Defines the planned visit schedule for the trial including visit numbers, " +
    "names, and target study days. Auto-populated with a standard vaccine " +
    "trial visit template.",
  category: "trial-design",
  autoPopulate: true,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'TV'.",
    },
    {
      name: "VISITNUM",
      label: "Visit Number",
      type: "Num",
      role: "Topic",
      required: true,
      description: "Clinical encounter number for the planned visit.",
    },
    {
      name: "VISIT",
      label: "Visit Name",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Descriptive name of the planned visit.",
    },
    {
      name: "VISITDY",
      label: "Planned Study Day of Visit",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Target study day for the visit relative to the reference date.",
    },
    {
      name: "ARMCD",
      label: "Planned Arm Code",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Arm code if this visit applies only to a specific arm.",
    },
    {
      name: "ARM",
      label: "Description of Planned Arm",
      type: "Char",
      role: "Synonym Qualifier",
      required: false,
      description:
        "Arm description if this visit applies only to a specific arm.",
    },
    {
      name: "TVSTRL",
      label: "Visit Start Rule",
      type: "Char",
      role: "Rule",
      required: false,
      description: "Rule for when the visit window opens.",
    },
    {
      name: "TVENRL",
      label: "Visit End Rule",
      type: "Char",
      role: "Rule",
      required: false,
      description: "Rule for when the visit window closes.",
    },
  ],
};

// =============================================================================
// CLINICAL DOMAINS (empty templates for subject-level data)
// =============================================================================

const DM_DOMAIN: SDTMDomainDefinition = {
  code: "DM",
  label: "Demographics",
  description:
    "Subject-level demographic information including age, sex, race, ethnicity, " +
    "and treatment arm assignment. This domain serves as the primary identifier " +
    "domain linking subjects across all other clinical domains.",
  category: "clinical",
  autoPopulate: false,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'DM'.",
    },
    {
      name: "USUBJID",
      label: "Unique Subject Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description:
        "Globally unique subject identifier (STUDYID + SITEID + SUBJID).",
    },
    {
      name: "SUBJID",
      label: "Subject Identifier for the Study",
      type: "Char",
      role: "Topic",
      required: true,
      description: "Subject identifier unique within the study site.",
    },
    {
      name: "RFSTDTC",
      label: "Subject Reference Start Date/Time",
      type: "Char",
      role: "Timing",
      required: false,
      description:
        "Reference start date/time for the subject (usually first dose).",
    },
    {
      name: "RFENDTC",
      label: "Subject Reference End Date/Time",
      type: "Char",
      role: "Timing",
      required: false,
      description:
        "Reference end date/time for the subject (usually last visit).",
    },
    {
      name: "RFXSTDTC",
      label: "Date/Time of First Study Treatment",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Date/time of the subject's first exposure to treatment.",
    },
    {
      name: "RFXENDTC",
      label: "Date/Time of Last Study Treatment",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Date/time of the subject's last exposure to treatment.",
    },
    {
      name: "SITEID",
      label: "Study Site Identifier",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Unique identifier for the study site.",
    },
    {
      name: "BRTHDTC",
      label: "Date/Time of Birth",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Subject's date of birth in ISO 8601 format.",
    },
    {
      name: "AGE",
      label: "Age",
      type: "Num",
      role: "Record Qualifier",
      required: false,
      description: "Subject's age at the reference start date.",
    },
    {
      name: "AGEU",
      label: "Age Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "AGEU",
      description: "Units for the AGE variable (e.g., 'YEARS').",
    },
    {
      name: "SEX",
      label: "Sex",
      type: "Char",
      role: "Record Qualifier",
      required: true,
      codeList: "SEX",
      description: "Subject's biological sex (M, F, U, or UNDIFFERENTIATED).",
    },
    {
      name: "RACE",
      label: "Race",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "RACE",
      description:
        "Subject's race per regulatory classification (e.g., FDA categories).",
    },
    {
      name: "ETHNIC",
      label: "Ethnicity",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "ETHNIC",
      description:
        "Subject's ethnicity: 'HISPANIC OR LATINO' or 'NOT HISPANIC OR LATINO'.",
    },
    {
      name: "ARMCD",
      label: "Planned Arm Code",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Code for the arm to which the subject was assigned.",
    },
    {
      name: "ARM",
      label: "Description of Planned Arm",
      type: "Char",
      role: "Synonym Qualifier",
      required: false,
      description: "Description of the arm to which the subject was assigned.",
    },
    {
      name: "COUNTRY",
      label: "Country",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "COUNTRY",
      description: "Country of the study site (ISO 3166-1 alpha-3).",
    },
    {
      name: "DMDTC",
      label: "Date/Time of Collection",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Date/time of demographic data collection.",
    },
    {
      name: "DMDY",
      label: "Study Day of Collection",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Study day of demographic data collection relative to reference date.",
    },
  ],
};

const AE_DOMAIN: SDTMDomainDefinition = {
  code: "AE",
  label: "Adverse Events",
  description:
    "Records all adverse events experienced by subjects during the study, " +
    "including severity, seriousness, relationship to treatment, action taken, " +
    "and outcome. Critical for vaccine safety assessment.",
  category: "clinical",
  autoPopulate: false,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'AE'.",
    },
    {
      name: "USUBJID",
      label: "Unique Subject Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Globally unique subject identifier.",
    },
    {
      name: "AESEQ",
      label: "Sequence Number",
      type: "Num",
      role: "Identifier",
      required: true,
      description:
        "Sequence number for ordering adverse events within a subject.",
    },
    {
      name: "AETERM",
      label: "Reported Term for the Adverse Event",
      type: "Char",
      role: "Topic",
      required: true,
      description:
        "Verbatim term for the adverse event as reported by the investigator.",
    },
    {
      name: "AEDECOD",
      label: "Dictionary-Derived Term",
      type: "Char",
      role: "Synonym Qualifier",
      required: false,
      codeList: "MedDRA",
      description:
        "Standardized term from the medical dictionary (MedDRA preferred term).",
    },
    {
      name: "AECAT",
      label: "Category for Adverse Event",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Category of the adverse event (e.g., 'SOLICITED', 'UNSOLICITED').",
    },
    {
      name: "AESCAT",
      label: "Subcategory for Adverse Event",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Subcategory for further classification.",
    },
    {
      name: "AEBODSYS",
      label: "Body System or Organ Class",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "MedDRA",
      description: "MedDRA System Organ Class (SOC) for the adverse event.",
    },
    {
      name: "AESEV",
      label: "Severity/Intensity",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "AESEV",
      description:
        "Severity or intensity of the adverse event (MILD, MODERATE, SEVERE).",
    },
    {
      name: "AESER",
      label: "Serious Event",
      type: "Char",
      role: "Record Qualifier",
      required: true,
      codeList: "NY",
      description:
        "Whether the adverse event is a serious adverse event (Y/N).",
    },
    {
      name: "AEACN",
      label: "Action Taken with Study Treatment",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "ACN",
      description:
        "Action taken with the study treatment as a result of the event.",
    },
    {
      name: "AEREL",
      label: "Causality",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Investigator's assessment of the relationship to study treatment.",
    },
    {
      name: "AEOUT",
      label: "Outcome of Adverse Event",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "OUT",
      description: "Outcome of the adverse event (e.g., 'RECOVERED/RESOLVED').",
    },
    {
      name: "AESTDTC",
      label: "Start Date/Time of Adverse Event",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Start date/time of the adverse event in ISO 8601 format.",
    },
    {
      name: "AEENDTC",
      label: "End Date/Time of Adverse Event",
      type: "Char",
      role: "Timing",
      required: false,
      description: "End date/time of the adverse event in ISO 8601 format.",
    },
    {
      name: "AESTDY",
      label: "Study Day of Start of Adverse Event",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Study day of the start of the adverse event relative to reference date.",
    },
    {
      name: "AEENDY",
      label: "Study Day of End of Adverse Event",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Study day of the end of the adverse event relative to reference date.",
    },
  ],
};

const EX_DOMAIN: SDTMDomainDefinition = {
  code: "EX",
  label: "Exposure",
  description:
    "Records the subject's exposure to study treatment (vaccine or comparator), " +
    "including dose, dosage form, route of administration, and timing. " +
    "Essential for vaccine dose tracking and lot accountability.",
  category: "clinical",
  autoPopulate: false,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'EX'.",
    },
    {
      name: "USUBJID",
      label: "Unique Subject Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Globally unique subject identifier.",
    },
    {
      name: "EXSEQ",
      label: "Sequence Number",
      type: "Num",
      role: "Identifier",
      required: true,
      description:
        "Sequence number for ordering exposure records within a subject.",
    },
    {
      name: "EXTRT",
      label: "Name of Treatment",
      type: "Char",
      role: "Topic",
      required: true,
      description:
        "Name of the treatment administered (vaccine or comparator).",
    },
    {
      name: "EXCAT",
      label: "Category of Treatment",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Category of the treatment (e.g., 'INVESTIGATIONAL', 'COMPARATOR').",
    },
    {
      name: "EXDOSE",
      label: "Dose",
      type: "Num",
      role: "Record Qualifier",
      required: false,
      description: "Numeric dose administered.",
    },
    {
      name: "EXDOSU",
      label: "Dose Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "UNIT",
      description: "Units for the dose (e.g., 'mcg', 'mL').",
    },
    {
      name: "EXDOSFRM",
      label: "Dose Form",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "FRM",
      description:
        "Pharmaceutical dose form (e.g., 'INJECTION', 'SUSPENSION').",
    },
    {
      name: "EXDOSFRQ",
      label: "Dosing Frequency per Interval",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "FREQ",
      description: "How often the dose is administered (e.g., 'ONCE').",
    },
    {
      name: "EXROUTE",
      label: "Route of Administration",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "ROUTE",
      description:
        "Route of administration (e.g., 'INTRAMUSCULAR', 'SUBCUTANEOUS').",
    },
    {
      name: "EXLOT",
      label: "Lot Number",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Lot number of the vaccine/treatment administered.",
    },
    {
      name: "EXSTDTC",
      label: "Start Date/Time of Treatment",
      type: "Char",
      role: "Timing",
      required: false,
      description:
        "Start date/time of the treatment exposure in ISO 8601 format.",
    },
    {
      name: "EXENDTC",
      label: "End Date/Time of Treatment",
      type: "Char",
      role: "Timing",
      required: false,
      description:
        "End date/time of the treatment exposure in ISO 8601 format.",
    },
    {
      name: "EXSTDY",
      label: "Study Day of Start of Treatment",
      type: "Num",
      role: "Timing",
      required: false,
      description: "Study day of treatment start relative to reference date.",
    },
    {
      name: "EXENDY",
      label: "Study Day of End of Treatment",
      type: "Num",
      role: "Timing",
      required: false,
      description: "Study day of treatment end relative to reference date.",
    },
  ],
};

const IS_DOMAIN: SDTMDomainDefinition = {
  code: "IS",
  label: "Immunogenicity Specimen Assessments",
  description:
    "Vaccine-specific domain for immunogenicity data including antibody titers, " +
    "seroconversion rates, and other immune response measurements. This is the " +
    "primary efficacy domain for vaccine clinical trials.",
  category: "clinical",
  autoPopulate: false,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'IS'.",
    },
    {
      name: "USUBJID",
      label: "Unique Subject Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Globally unique subject identifier.",
    },
    {
      name: "ISSEQ",
      label: "Sequence Number",
      type: "Num",
      role: "Identifier",
      required: true,
      description:
        "Sequence number for ordering immunogenicity records within a subject.",
    },
    {
      name: "ISTESTCD",
      label: "Immunogenicity Test Short Name",
      type: "Char",
      role: "Topic",
      required: true,
      description:
        "Short code for the immunogenicity test (e.g., 'NEUTAB' for neutralizing antibody).",
    },
    {
      name: "ISTEST",
      label: "Immunogenicity Test Name",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full descriptive name of the immunogenicity test.",
    },
    {
      name: "ISCAT",
      label: "Category for Immunogenicity Test",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Category of the test (e.g., 'HUMORAL', 'CELL-MEDIATED').",
    },
    {
      name: "ISSCAT",
      label: "Subcategory for Immunogenicity Test",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Subcategory for further classification of the test.",
    },
    {
      name: "ISORRES",
      label: "Result or Finding in Original Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Result value as originally reported.",
    },
    {
      name: "ISORRESU",
      label: "Original Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Units for the original result value.",
    },
    {
      name: "ISSTRESC",
      label: "Character Result/Finding in Std Format",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Standardized character result value.",
    },
    {
      name: "ISSTRESN",
      label: "Numeric Result/Finding in Standard Units",
      type: "Num",
      role: "Record Qualifier",
      required: false,
      description: "Standardized numeric result value.",
    },
    {
      name: "ISSTRESU",
      label: "Standard Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Standard units for the numeric result value.",
    },
    {
      name: "ISSTAT",
      label: "Completion Status",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "STAT",
      description:
        "Completion status of the test (e.g., 'NOT DONE' if not performed).",
    },
    {
      name: "ISBLFL",
      label: "Baseline Flag",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "NY",
      description:
        "Indicates whether this is the baseline measurement (Y/null).",
    },
    {
      name: "VISITNUM",
      label: "Visit Number",
      type: "Num",
      role: "Timing",
      required: false,
      description: "Clinical encounter number corresponding to the assessment.",
    },
    {
      name: "VISIT",
      label: "Visit Name",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Descriptive name of the visit.",
    },
    {
      name: "ISDTC",
      label: "Date/Time of Collection",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Date/time of specimen collection in ISO 8601 format.",
    },
    {
      name: "ISDY",
      label: "Study Day of Collection",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Study day of specimen collection relative to reference date.",
    },
  ],
};

const LB_DOMAIN: SDTMDomainDefinition = {
  code: "LB",
  label: "Laboratory Test Results",
  description:
    "Records laboratory test results including hematology, chemistry, and " +
    "serology measurements. Used alongside the IS domain to capture supporting " +
    "safety laboratory data in vaccine trials.",
  category: "clinical",
  autoPopulate: false,
  variables: [
    {
      name: "STUDYID",
      label: "Study Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Unique identifier for the study.",
    },
    {
      name: "DOMAIN",
      label: "Domain Abbreviation",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Two-character domain abbreviation: 'LB'.",
    },
    {
      name: "USUBJID",
      label: "Unique Subject Identifier",
      type: "Char",
      role: "Identifier",
      required: true,
      description: "Globally unique subject identifier.",
    },
    {
      name: "LBSEQ",
      label: "Sequence Number",
      type: "Num",
      role: "Identifier",
      required: true,
      description: "Sequence number for ordering lab results within a subject.",
    },
    {
      name: "LBTESTCD",
      label: "Lab Test or Examination Short Name",
      type: "Char",
      role: "Topic",
      required: true,
      description: "Short code for the laboratory test.",
    },
    {
      name: "LBTEST",
      label: "Lab Test or Examination Name",
      type: "Char",
      role: "Synonym Qualifier",
      required: true,
      description: "Full descriptive name of the laboratory test.",
    },
    {
      name: "LBCAT",
      label: "Category for Lab Test",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description:
        "Category of the lab test (e.g., 'HEMATOLOGY', 'CHEMISTRY').",
    },
    {
      name: "LBSCAT",
      label: "Subcategory for Lab Test",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Subcategory for further classification.",
    },
    {
      name: "LBORRES",
      label: "Result or Finding in Original Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Lab result as originally reported.",
    },
    {
      name: "LBORRESU",
      label: "Original Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Units for the original result.",
    },
    {
      name: "LBSTRESC",
      label: "Character Result/Finding in Std Format",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Standardized character result value.",
    },
    {
      name: "LBSTRESN",
      label: "Numeric Result/Finding in Standard Units",
      type: "Num",
      role: "Record Qualifier",
      required: false,
      description: "Standardized numeric result value.",
    },
    {
      name: "LBSTRESU",
      label: "Standard Units",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      description: "Standard units for the numeric result.",
    },
    {
      name: "LBNRIND",
      label: "Reference Range Indicator",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "NRIND",
      description:
        "Indicator of where the result falls relative to reference range (LOW, NORMAL, HIGH).",
    },
    {
      name: "LBSTAT",
      label: "Completion Status",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "STAT",
      description: "Completion status of the test (e.g., 'NOT DONE').",
    },
    {
      name: "LBBLFL",
      label: "Baseline Flag",
      type: "Char",
      role: "Record Qualifier",
      required: false,
      codeList: "NY",
      description:
        "Indicates whether this is the baseline measurement (Y/null).",
    },
    {
      name: "VISITNUM",
      label: "Visit Number",
      type: "Num",
      role: "Timing",
      required: false,
      description: "Clinical encounter number corresponding to the lab test.",
    },
    {
      name: "VISIT",
      label: "Visit Name",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Descriptive name of the visit.",
    },
    {
      name: "LBDTC",
      label: "Date/Time of Specimen Collection",
      type: "Char",
      role: "Timing",
      required: false,
      description: "Date/time of specimen collection in ISO 8601 format.",
    },
    {
      name: "LBDY",
      label: "Study Day of Specimen Collection",
      type: "Num",
      role: "Timing",
      required: false,
      description:
        "Study day of specimen collection relative to reference date.",
    },
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================

/** All SDTM domain definitions (5 trial design + 5 clinical) */
export const SDTM_DOMAINS: SDTMDomainDefinition[] = [
  // Trial design domains
  TS_DOMAIN,
  TA_DOMAIN,
  TE_DOMAIN,
  TI_DOMAIN,
  TV_DOMAIN,
  // Clinical domains
  DM_DOMAIN,
  AE_DOMAIN,
  EX_DOMAIN,
  IS_DOMAIN,
  LB_DOMAIN,
];

/** Total number of SDTM domains defined */
export const SDTM_DOMAIN_COUNT: number = SDTM_DOMAINS.length;

/**
 * Look up an SDTM domain definition by its two-letter code.
 *
 * @param code - The domain code (e.g., "TS", "DM", "IS")
 * @returns The domain definition, or undefined if not found
 */
export function getSDTMDomain(code: string): SDTMDomainDefinition | undefined {
  return SDTM_DOMAINS.find((d) => d.code === code.toUpperCase());
}

/**
 * Get all trial design domains that can be auto-populated from protocol data.
 *
 * @returns Array of trial design domain definitions
 */
export function getTrialDesignDomains(): SDTMDomainDefinition[] {
  return SDTM_DOMAINS.filter((d) => d.category === "trial-design");
}

/**
 * Get all clinical domains (empty templates for subject-level data).
 *
 * @returns Array of clinical domain definitions
 */
export function getClinicalDomains(): SDTMDomainDefinition[] {
  return SDTM_DOMAINS.filter((d) => d.category === "clinical");
}
