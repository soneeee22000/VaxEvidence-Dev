import { jsPDF } from "jspdf";
import { format } from "date-fns";
import type { ProtocolVersionRecord } from "@/lib/validators/protocol-version";
import {
  VERSIONABLE_FIELDS,
  FIELD_LABELS,
} from "@/lib/validators/protocol-version";

// =============================================================================
// COMPLIANCE PDF GENERATOR
// =============================================================================
// Generates 21 CFR Part 11 compliance reports with version history,
// digital signatures, hash verification, and audit trail.
// =============================================================================

interface ComplianceReportData {
  protocol: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  versions: ProtocolVersionRecord[];
  activityLogs: Array<{
    action_type: string;
    resource_type: string;
    created_at: string;
    metadata: Record<string, unknown>;
    user_email?: string;
  }>;
  hashVerifications: Array<{
    versionNumber: number;
    hashValid: boolean;
    contentHash: string;
  }>;
}

/**
 * Generate a 21 CFR Part 11 compliance PDF report.
 */
export async function generateCompliancePDF(
  data: ComplianceReportData,
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const contentWidth = pageWidth - marginLeft * 2;

  const checkPageBreak = (needed: number = 20) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    fontSize: number = 10,
    isBold: boolean = false,
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, marginLeft, y);
      y += fontSize * 0.4 + 1;
    }
  };

  const addLine = () => {
    checkPageBreak(5);
    doc.setDrawColor(180);
    doc.line(marginLeft, y, pageWidth - marginLeft, y);
    y += 5;
  };

  // ── Title Page ──
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("21 CFR Part 11", marginLeft, 50);
  doc.text("Compliance Report", marginLeft, 62);
  addLine();
  y = 75;

  addText(`Protocol: ${data.protocol.title}`, 14, true);
  y += 5;
  addText(`Protocol ID: ${data.protocol.id}`, 10);
  addText(`Status: ${data.protocol.status}`, 10);
  addText(
    `Created: ${format(new Date(data.protocol.created_at), "MMMM d, yyyy")}`,
    10,
  );
  addText(
    `Last Updated: ${format(new Date(data.protocol.updated_at), "MMMM d, yyyy")}`,
    10,
  );
  addText(
    `Report Generated: ${format(new Date(), "MMMM d, yyyy HH:mm:ss")}`,
    10,
  );
  y += 5;
  addText(`Total Versions: ${data.versions.length}`, 10);
  addText(
    `Signed Versions: ${data.versions.filter((v) => v.signed_by).length}`,
    10,
  );

  // ── Section 1: Version History ──
  doc.addPage();
  y = 20;
  addText("1. Version History", 16, true);
  y += 3;
  addLine();

  if (data.versions.length === 0) {
    addText("No versions have been saved for this protocol.", 10);
  } else {
    for (const version of data.versions) {
      checkPageBreak(40);
      addText(`Version ${version.version_number}`, 12, true);
      addText(
        `Created: ${format(new Date(version.created_at), "MMMM d, yyyy HH:mm:ss")}`,
        9,
      );
      if (version.change_summary) {
        addText(`Summary: ${version.change_summary}`, 9);
      }
      addText(`Content Hash: ${version.content_hash}`, 8);

      if (version.signed_by) {
        addText("Digital Signature:", 9, true);
        addText(`  Meaning: ${version.signature_meaning ?? "N/A"}`, 9);
        addText(
          `  Signed At: ${version.signed_at ? format(new Date(version.signed_at), "MMMM d, yyyy HH:mm:ss") : "N/A"}`,
          9,
        );
        addText(`  Signed By: ${version.signed_by}`, 9);
      }

      y += 3;
    }
  }

  // ── Section 2: Digital Signatures ──
  doc.addPage();
  y = 20;
  addText("2. Digital Signatures", 16, true);
  y += 3;
  addLine();

  const signedVersions = data.versions.filter((v) => v.signed_by);
  if (signedVersions.length === 0) {
    addText("No versions have been digitally signed.", 10);
  } else {
    for (const version of signedVersions) {
      checkPageBreak(30);
      addText(
        `Version ${version.version_number} — ${version.signature_meaning ?? "No meaning provided"}`,
        11,
        true,
      );
      addText(`Signed by: ${version.signed_by}`, 9);
      addText(
        `Signed at: ${version.signed_at ? format(new Date(version.signed_at), "MMMM d, yyyy HH:mm:ss") : "N/A"}`,
        9,
      );
      y += 3;
    }
  }

  // ── Section 3: Hash Verification ──
  doc.addPage();
  y = 20;
  addText("3. Content Integrity Verification", 16, true);
  y += 3;
  addLine();

  addText(
    "Each version snapshot is hashed using SHA-256 with deterministic JSON serialization. " +
      "The following table shows the verification status of each version at report generation time.",
    9,
  );
  y += 5;

  for (const hv of data.hashVerifications) {
    checkPageBreak(15);
    const status = hv.hashValid ? "PASS" : "FAIL";
    const statusColor = hv.hashValid ? "green" : "red";
    doc.setTextColor(
      statusColor === "green" ? 0 : 200,
      statusColor === "green" ? 128 : 0,
      0,
    );
    addText(`[${status}] Version ${hv.versionNumber}`, 10, true);
    doc.setTextColor(0, 0, 0);
    addText(`  Hash: ${hv.contentHash}`, 8);
    y += 2;
  }

  // ── Section 4: Audit Trail ──
  doc.addPage();
  y = 20;
  addText("4. Audit Trail", 16, true);
  y += 3;
  addLine();

  if (data.activityLogs.length === 0) {
    addText("No audit trail entries found.", 10);
  } else {
    for (const log of data.activityLogs) {
      checkPageBreak(15);
      const timestamp = format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss");
      const user = log.user_email ?? "Unknown";
      addText(
        `[${timestamp}] ${user} — ${log.action_type} on ${log.resource_type}`,
        9,
      );
    }
  }

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `VaxEvidence — 21 CFR Part 11 Compliance Report — Page ${i} of ${totalPages}`,
      marginLeft,
      pageHeight - 10,
    );
    doc.text(
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
      pageWidth - marginLeft - 50,
      pageHeight - 10,
    );
  }

  doc.setTextColor(0, 0, 0);
  return doc.output("blob");
}
