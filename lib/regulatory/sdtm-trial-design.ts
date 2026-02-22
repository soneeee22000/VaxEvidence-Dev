// =============================================================================
// SDTM TRIAL DESIGN AUTO-POPULATION
// =============================================================================
// Maps VaxEvidence protocol data (PICO elements) to CDISC SDTM v3.3 trial
// design domain rows. Generates TS, TA, TE, TI, and TV domain data that can
// be exported as define.xml or tabular datasets for regulatory submission.
// =============================================================================

/** Default placeholder for missing protocol data */
const NOT_SPECIFIED = "[Not specified]";

/** Placeholder for dates that require manual entry */
const TBD = "[TBD]";

/** A row of data for an SDTM domain */
export type SDTMRow = Record<string, string | number>;

/** Protocol data needed for SDTM auto-population */
export interface SDTMProtocolData {
  /** Protocol unique identifier */
  id: string;
  /** Protocol title */
  title: string;
  /** Primary study question or objective */
  study_question?: string;
  /** Population description (inclusion/exclusion criteria) */
  population?: string;
  /** Intervention description */
  intervention?: string;
  /** Comparator description */
  comparator?: string;
  /** Primary outcome measures */
  outcomes?: string;
  /** Study design type (e.g., "Randomized Controlled Trial") */
  design?: string;
  /** Protocol status */
  status?: string;
}

/**
 * Generate Trial Summary (TS) domain rows from protocol data.
 *
 * Maps protocol metadata and PICO elements to CDISC trial summary parameters.
 * Each row represents a single trial-level parameter with its coded name and value.
 *
 * @param protocol - Protocol data containing PICO elements and metadata
 * @returns Array of SDTM rows for the TS domain
 */
export function generateTSRows(protocol: SDTMProtocolData): SDTMRow[] {
  const parameters: Array<{
    code: string;
    name: string;
    value: string;
  }> = [
    {
      code: "TITLE",
      name: "Trial Title",
      value: protocol.title || NOT_SPECIFIED,
    },
    {
      code: "OBJPRIM",
      name: "Trial Primary Objective",
      value: protocol.study_question || NOT_SPECIFIED,
    },
    {
      code: "SSTDTC",
      name: "Study Start Date",
      value: TBD,
    },
    {
      code: "SENDTC",
      name: "Study End Date",
      value: TBD,
    },
    {
      code: "TTYPE",
      name: "Trial Type",
      value: protocol.design || "Interventional",
    },
    {
      code: "TRT",
      name: "Investigational Therapy",
      value: protocol.intervention || NOT_SPECIFIED,
    },
    {
      code: "COMPTRT",
      name: "Comparator Treatment",
      value: protocol.comparator || NOT_SPECIFIED,
    },
    {
      code: "INDIC",
      name: "Trial Disease/Condition Indication",
      value: deriveIndication(protocol.population),
    },
    {
      code: "TPHASE",
      name: "Trial Phase Classification",
      value: TBD,
    },
    {
      code: "PCLAS",
      name: "Pharmacologic Class",
      value: "VACCINE",
    },
    {
      code: "STYPE",
      name: "Study Type",
      value: protocol.design || NOT_SPECIFIED,
    },
    {
      code: "OUTMSPRI",
      name: "Primary Outcome Measure",
      value: protocol.outcomes || NOT_SPECIFIED,
    },
  ];

  return parameters.map((param, index) => ({
    STUDYID: protocol.id,
    DOMAIN: "TS",
    TSSEQ: index + 1,
    TSPARMCD: param.code,
    TSPARM: param.name,
    TSVAL: param.value,
  }));
}

/**
 * Generate Trial Arms (TA) domain rows from protocol data.
 *
 * Creates arm definitions from the protocol's intervention and comparator fields.
 * Generates two arms by default: a treatment arm and a control arm.
 *
 * @param protocol - Protocol data containing intervention and comparator
 * @returns Array of SDTM rows for the TA domain
 */
export function generateTARows(protocol: SDTMProtocolData): SDTMRow[] {
  const interventionName = protocol.intervention || NOT_SPECIFIED;
  const comparatorName = protocol.comparator || NOT_SPECIFIED;

  return [
    {
      STUDYID: protocol.id,
      DOMAIN: "TA",
      ARMCD: "TRT",
      ARM: interventionName,
      TAETORD: 1,
      ETCD: "TRT",
      ELEMENT: interventionName,
    },
    {
      STUDYID: protocol.id,
      DOMAIN: "TA",
      ARMCD: "CTRL",
      ARM: comparatorName,
      TAETORD: 1,
      ETCD: "CTRL",
      ELEMENT: comparatorName,
    },
  ];
}

/**
 * Generate Trial Elements (TE) domain rows from protocol data.
 *
 * Creates standard trial elements for a vaccine clinical trial:
 * Screening, Treatment, and Follow-up periods.
 *
 * @param protocol - Protocol data (used for study ID)
 * @returns Array of SDTM rows for the TE domain
 */
export function generateTERows(protocol: SDTMProtocolData): SDTMRow[] {
  const elements: Array<{
    code: string;
    name: string;
    startRule?: string;
    duration?: string;
  }> = [
    {
      code: "SCRN",
      name: "Screening",
    },
    {
      code: "TRT",
      name: "Treatment",
      startRule: "P1D",
    },
    {
      code: "FU",
      name: "Follow-up",
    },
  ];

  return elements.map((element) => {
    const row: SDTMRow = {
      STUDYID: protocol.id,
      DOMAIN: "TE",
      ETCD: element.code,
      ELEMENT: element.name,
    };

    if (element.startRule) {
      row.TESTRL = element.startRule;
    }

    if (element.duration) {
      row.TEDUR = element.duration;
    }

    return row;
  });
}

/**
 * Generate Trial Inclusion/Exclusion (TI) domain rows from protocol data.
 *
 * Parses the protocol population field into individual inclusion criteria.
 * Splits on newlines, semicolons, or numbered items (e.g., "1.", "2.").
 * Falls back to a placeholder row if no criteria can be parsed.
 *
 * @param protocol - Protocol data containing the population field
 * @returns Array of SDTM rows for the TI domain
 */
export function generateTIRows(protocol: SDTMProtocolData): SDTMRow[] {
  const criteria = parseCriteria(protocol.population);

  if (criteria.length === 0) {
    return [
      {
        STUDYID: protocol.id,
        DOMAIN: "TI",
        IETESTCD: "IN01",
        IETEST: NOT_SPECIFIED,
        IECAT: "INCLUSION",
      },
    ];
  }

  return criteria.map((criterion, index) => {
    const seqNum = String(index + 1).padStart(2, "0");

    return {
      STUDYID: protocol.id,
      DOMAIN: "TI",
      IETESTCD: `IN${seqNum}`,
      IETEST: criterion,
      IECAT: "INCLUSION",
    };
  });
}

/**
 * Generate Trial Visits (TV) domain rows from protocol data.
 *
 * Creates a standard vaccine trial visit schedule template with 8 visits
 * spanning from screening through end of study at 1 year.
 *
 * @param protocol - Protocol data (used for study ID)
 * @returns Array of SDTM rows for the TV domain
 */
export function generateTVRows(protocol: SDTMProtocolData): SDTMRow[] {
  const visits: Array<{
    num: number;
    name: string;
    day: number;
  }> = [
    { num: 1, name: "Screening", day: -14 },
    { num: 2, name: "Baseline/Day 1", day: 1 },
    { num: 3, name: "Day 7", day: 7 },
    { num: 4, name: "Day 14", day: 14 },
    { num: 5, name: "Day 28", day: 28 },
    { num: 6, name: "Day 90", day: 90 },
    { num: 7, name: "Day 180", day: 180 },
    { num: 8, name: "End of Study", day: 365 },
  ];

  return visits.map((visit) => ({
    STUDYID: protocol.id,
    DOMAIN: "TV",
    VISITNUM: visit.num,
    VISIT: visit.name,
    VISITDY: visit.day,
  }));
}

/**
 * Generate all trial design domain data from a protocol.
 *
 * Master function that invokes all five trial design domain generators
 * and returns the results as a Map keyed by domain code.
 *
 * @param protocol - Protocol data containing PICO elements and metadata
 * @returns Map of domain code to array of SDTM rows
 */
export function generateTrialDesignData(
  protocol: SDTMProtocolData,
): Map<string, SDTMRow[]> {
  const result = new Map<string, SDTMRow[]>();

  result.set("TS", generateTSRows(protocol));
  result.set("TA", generateTARows(protocol));
  result.set("TE", generateTERows(protocol));
  result.set("TI", generateTIRows(protocol));
  result.set("TV", generateTVRows(protocol));

  return result;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Derive the disease/condition indication from the population description.
 *
 * Extracts a concise indication string from the protocol's population field.
 * Falls back to the full population text if no specific pattern is found.
 *
 * @param population - Raw population description from the protocol
 * @returns Derived indication string
 */
function deriveIndication(population: string | undefined): string {
  if (!population || population.trim().length === 0) {
    return NOT_SPECIFIED;
  }

  return population.trim();
}

/**
 * Parse a population description into individual inclusion criteria.
 *
 * Attempts to split the text using multiple delimiters:
 * 1. Numbered items (e.g., "1. Criterion", "2. Criterion")
 * 2. Newline-separated items
 * 3. Semicolon-separated items
 *
 * Filters out empty strings and whitespace-only items.
 *
 * @param population - Raw population description from the protocol
 * @returns Array of individual criterion strings
 */
function parseCriteria(population: string | undefined): string[] {
  if (!population || population.trim().length === 0) {
    return [];
  }

  const text = population.trim();

  // Try numbered items first (e.g., "1. Criterion\n2. Criterion")
  const numberedPattern = /\d+\.\s+/;
  if (numberedPattern.test(text)) {
    const items = text
      .split(/\d+\.\s+/)
      .slice(1)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length > 1) {
      return items;
    }
  }

  // Try newline separation
  const newlineItems = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (newlineItems.length > 1) {
    return newlineItems;
  }

  // Try semicolon separation
  const semicolonItems = text
    .split(/;\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (semicolonItems.length > 1) {
    return semicolonItems;
  }

  // Return the entire text as a single criterion
  return [text];
}
