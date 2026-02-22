// =============================================================================
// SDTM PACKAGE GENERATOR
// =============================================================================
// Bundles all CDISC SDTM v3.3 CSV templates into a single ZIP archive for
// download. The package includes individual domain CSVs, a data dictionary
// (define.csv), and a human-readable README. Uses the same archiver-based
// pattern as the workspace archive generator.
// =============================================================================

import archiver from "archiver";
import type { SDTMProtocolData } from "@/lib/regulatory/sdtm-trial-design";
import { getSDTMDomain } from "@/lib/regulatory/sdtm-domains";
import {
  generateAllDomainCSVs,
  generateDefineCSV,
  generateSDTMReadme,
} from "./sdtm-csv-generator";

/**
 * Generate a ZIP archive containing all SDTM dataset templates.
 *
 * Creates a compressed ZIP package with:
 * - Individual domain CSV files (e.g., TS.csv, DM.csv)
 * - define.csv — data dictionary listing all variables across included domains
 * - README.txt — human-readable summary with protocol info and usage notes
 *
 * Trial design domains (TS, TA, TE, TI, TV) are auto-populated from protocol
 * PICO elements. Clinical domains (DM, AE, EX, IS, LB) contain headers only.
 *
 * @param protocol - Protocol data containing PICO elements and metadata
 * @param selectedDomains - Optional array of domain codes to include; defaults to all 10
 * @returns Promise resolving to a Buffer containing the ZIP archive
 */
export async function generateSDTMPackage(
  protocol: SDTMProtocolData,
  selectedDomains?: string[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    const buffers: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      buffers.push(chunk);
    });

    archive.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });

    // Generate all domain CSVs
    const domainCSVs = generateAllDomainCSVs(protocol, selectedDomains);

    // Add each domain CSV to the archive
    for (const [code, csvContent] of domainCSVs) {
      archive.append(csvContent, { name: `${code}.csv` });
    }

    // Resolve which domain definitions to include in the define.csv
    const includedDomains = Array.from(domainCSVs.keys())
      .map((code) => getSDTMDomain(code))
      .filter(
        (domain): domain is NonNullable<typeof domain> => domain !== undefined,
      );

    // Add the data dictionary
    const defineCSV = generateDefineCSV(includedDomains);
    archive.append(defineCSV, { name: "define.csv" });

    // Add the README
    const domainCodes = Array.from(domainCSVs.keys());
    const readme = generateSDTMReadme(protocol, domainCodes);
    archive.append(readme, { name: "README.txt" });

    archive.finalize();
  });
}
