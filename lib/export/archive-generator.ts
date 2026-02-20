import archiver from "archiver";
import type { ProtocolRecord } from "@/lib/supabase/protocols";
import { generateProtocolPDF } from "./pdf-generator";
import { generateProtocolWord } from "./word-generator";
import {
  generateEvidenceCSV,
  generateDatasetsCSV,
  generateProtocolsCSV,
} from "./csv-generator";

// =============================================================================
// ARCHIVE GENERATOR
// =============================================================================
// Generate ZIP archives for bulk workspace exports
// =============================================================================

/**
 * Generate a ZIP archive containing all workspace data
 */
export async function generateWorkspaceArchive(
  protocols: ProtocolRecord[],
  evidence: any[],
  datasets: any[],
  linkedEvidence: Record<string, any[]>,
  linkedDatasets: Record<string, any[]>,
  comments: Record<string, any[]>,
  reviews: Record<string, any[]>,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    const buffers: Buffer[] = [];

    // Collect data chunks
    archive.on("data", (chunk: Buffer) => {
      buffers.push(chunk);
    });

    // Handle completion
    archive.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    // Handle errors
    archive.on("error", (err: Error) => {
      reject(err);
    });

    // Add protocols as PDFs
    const protocolPromises = protocols.map(async (protocol) => {
      try {
        const linkedEv = linkedEvidence[protocol.id] || [];
        const linkedDs = linkedDatasets[protocol.id] || [];
        const protocolComments = comments[protocol.id] || [];
        const protocolReviews = reviews[protocol.id] || [];

        const pdfBlob = await generateProtocolPDF(
          protocol,
          linkedEv,
          linkedDs,
          protocolComments,
          protocolReviews,
          {
            includeEvidence: true,
            includeDatasets: true,
            includeComments: true,
            includeReviews: true,
            templateStyle: "professional",
          },
        );

        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
        const safeName = protocol.title
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();
        archive.append(pdfBuffer, {
          name: `protocols/${safeName}-${protocol.id.substring(0, 8)}.pdf`,
        });
      } catch (error) {
        console.error(
          `Error generating PDF for protocol ${protocol.id}:`,
          error,
        );
      }
    });

    // Wait for all PDFs to be added
    Promise.all(protocolPromises)
      .then(() => {
        // Add CSV exports
        archive.append(generateProtocolsCSV(protocols), {
          name: "protocols.csv",
        });

        archive.append(generateEvidenceCSV(evidence), {
          name: "evidence.csv",
        });

        archive.append(generateDatasetsCSV(datasets), {
          name: "datasets.csv",
        });

        // Add JSON export for complete data portability
        const jsonData = {
          protocols,
          evidence,
          datasets,
          linkedEvidence,
          linkedDatasets,
          comments,
          reviews,
          exportDate: new Date().toISOString(),
          version: "1.0",
        };

        archive.append(JSON.stringify(jsonData, null, 2), {
          name: "workspace-data.json",
        });

        // Add README
        const readme = `VaxEvidence Workspace Export
Generated: ${new Date().toLocaleDateString()}

Contents:
- protocols/ - PDF reports for all protocols
- protocols.csv - Protocol metadata
- evidence.csv - Evidence library items
- datasets.csv - Dataset metadata
- workspace-data.json - Complete data export in JSON format

This archive contains all your VaxEvidence workspace data.
Use the CSV files for analysis or the JSON file for backup and data portability.
`;

        archive.append(readme, { name: "README.txt" });

        // Finalize the archive
        archive.finalize();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Generate a simple ZIP with just JSON data (lightweight export)
 */
export async function generateJSONExport(
  protocols: ProtocolRecord[],
  evidence: any[],
  datasets: any[],
  linkedEvidence: Record<string, any[]>,
  linkedDatasets: Record<string, any[]>,
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

    const jsonData = {
      protocols,
      evidence,
      datasets,
      linkedEvidence,
      linkedDatasets,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    archive.append(JSON.stringify(jsonData, null, 2), {
      name: "vaxevidence-export.json",
    });

    archive.finalize();
  });
}
