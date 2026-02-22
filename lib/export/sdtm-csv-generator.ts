// =============================================================================
// SDTM CSV GENERATOR
// =============================================================================
// Generate CSV content for individual CDISC SDTM v3.3 domains and supporting
// metadata files (define.csv, README). Trial design domains (TS, TA, TE, TI, TV)
// are auto-populated from protocol PICO elements. Clinical domains (DM, AE, EX,
// IS, LB) are exported as header-only templates for data collection.
// =============================================================================

import {
  getSDTMDomain,
  getTrialDesignDomains,
  SDTM_DOMAINS,
} from "@/lib/regulatory/sdtm-domains";
import type { SDTMDomainDefinition } from "@/lib/regulatory/sdtm-domains";
import type {
  SDTMRow,
  SDTMProtocolData,
} from "@/lib/regulatory/sdtm-trial-design";
import { generateTrialDesignData } from "@/lib/regulatory/sdtm-trial-design";

/** Set of trial design domain codes for quick lookup */
const TRIAL_DESIGN_CODES = new Set(getTrialDesignDomains().map((d) => d.code));

/**
 * Escape a single CSV cell value per RFC 4180.
 *
 * Wraps the value in double quotes if it contains commas, double quotes,
 * or newlines. Any embedded double quotes are doubled.
 *
 * @param value - The raw cell value to escape
 * @returns The properly escaped CSV cell string
 */
function escapeCSVCell(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert an SDTMRow value to a string representation.
 *
 * Handles string, number, undefined, and null values. Numbers are converted
 * to their string representation; missing values default to empty string.
 *
 * @param value - The row value (string, number, or missing)
 * @returns String representation of the value
 */
function rowValueToString(value: string | number | undefined | null): string {
  if (value == null) {
    return "";
  }
  return String(value);
}

/**
 * Generate CSV content for a single SDTM domain.
 *
 * Creates a comma-separated file with the domain's variable names as the
 * header row and provided data rows mapped to those variables. Values are
 * properly escaped per RFC 4180 to handle commas, quotes, and newlines.
 *
 * @param domain - The SDTM domain definition containing variable specs
 * @param rows - Array of data rows to include (may be empty for clinical domains)
 * @returns Complete CSV string with header and data rows
 */
export function generateDomainCSV(
  domain: SDTMDomainDefinition,
  rows: SDTMRow[],
): string {
  const variableNames = domain.variables.map((v) => v.name);

  const headerRow = variableNames.map(escapeCSVCell).join(",");

  const dataRows = rows.map((row) =>
    variableNames
      .map((name) =>
        escapeCSVCell(
          rowValueToString(row[name] as string | number | undefined),
        ),
      )
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate a data dictionary CSV (define.csv) for the included SDTM domains.
 *
 * Creates a comprehensive metadata file listing every variable across all
 * specified domains with its label, type, role, requirement status, codelist
 * reference, and description. This serves as a lightweight alternative to
 * a full define.xml for planning purposes.
 *
 * @param domains - Array of SDTM domain definitions to include
 * @returns CSV string with one row per variable across all domains
 */
export function generateDefineCSV(domains: SDTMDomainDefinition[]): string {
  const headers = [
    "Domain",
    "Variable Name",
    "Variable Label",
    "Type",
    "Role",
    "Required",
    "CodeList",
    "Description",
  ];

  const headerRow = headers.map(escapeCSVCell).join(",");

  const dataRows: string[] = [];

  for (const domain of domains) {
    for (const variable of domain.variables) {
      const cells = [
        domain.code,
        variable.name,
        variable.label,
        variable.type,
        variable.role,
        variable.required ? "Yes" : "No",
        variable.codeList ?? "",
        variable.description,
      ];

      dataRows.push(cells.map(escapeCSVCell).join(","));
    }
  }

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate a plain-text README for the SDTM dataset package.
 *
 * Produces a human-readable summary of the exported SDTM templates including
 * the protocol title, generation date, domain listing with row counts, and
 * important notes about auto-population and manual data entry requirements.
 *
 * @param protocol - Protocol data used for title and ID
 * @param domainCodes - Array of domain codes included in the export
 * @returns Plain text README string
 */
export function generateSDTMReadme(
  protocol: SDTMProtocolData,
  domainCodes: string[],
): string {
  const generatedDate = new Date().toISOString().split("T")[0];
  const protocolTitle = protocol.title || "[Untitled Protocol]";

  const domainLines = domainCodes
    .map((code) => {
      const domain = getSDTMDomain(code);
      if (!domain) {
        return `  ${code} - Unknown domain`;
      }

      const populationNote = domain.autoPopulate
        ? "auto-populated from protocol"
        : "header-only template";

      return `  ${code} - ${domain.label} (${populationNote})`;
    })
    .join("\n");

  return [
    `SDTM Dataset Templates — ${protocolTitle}`,
    `${"=".repeat(60)}`,
    "",
    `Generated: ${generatedDate}`,
    `Protocol ID: ${protocol.id}`,
    "",
    "Domains Included:",
    domainLines,
    "",
    "Notes:",
    "- Trial design domains (TS, TA, TE, TI, TV) are auto-populated from protocol PICO elements.",
    "- Clinical domains (DM, AE, EX, IS, LB) contain headers only — populate during data collection.",
    "",
    "CDISC Version: Based on CDISC SDTM v3.3",
    "",
    "Disclaimer:",
    "These templates are generated for planning purposes. Review against the",
    "latest CDISC standards before submission.",
    "",
  ].join("\n");
}

/**
 * Generate CSV content for all requested SDTM domains.
 *
 * For trial design domains (TS, TA, TE, TI, TV), data is auto-populated from
 * the protocol's PICO elements via generateTrialDesignData. For clinical domains
 * (DM, AE, EX, IS, LB), header-only CSVs are generated as templates.
 *
 * @param protocol - Protocol data containing PICO elements and metadata
 * @param selectedDomains - Optional array of domain codes to include; defaults to all 10
 * @returns Map of domain code to CSV content string
 */
export function generateAllDomainCSVs(
  protocol: SDTMProtocolData,
  selectedDomains?: string[],
): Map<string, string> {
  const result = new Map<string, string>();

  const targetCodes = selectedDomains
    ? selectedDomains.map((code) => code.toUpperCase())
    : SDTM_DOMAINS.map((d) => d.code);

  const trialDesignData = generateTrialDesignData(protocol);

  for (const code of targetCodes) {
    const domain = getSDTMDomain(code);
    if (!domain) {
      continue;
    }

    if (TRIAL_DESIGN_CODES.has(code)) {
      const rows = trialDesignData.get(code) ?? [];
      result.set(code, generateDomainCSV(domain, rows));
    } else {
      result.set(code, generateDomainCSV(domain, []));
    }
  }

  return result;
}
