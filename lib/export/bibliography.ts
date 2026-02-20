import Cite from "citation-js";
import type { BibliographyFormat } from "./types";

// =============================================================================
// BIBLIOGRAPHY GENERATOR
// =============================================================================
// Generate formatted bibliographies from evidence items
// Supports multiple citation styles: BibTeX, APA, MLA, Chicago, RIS
// =============================================================================

/**
 * Generate a formatted bibliography from evidence items
 */
export function generateBibliography(
  evidenceItems: any[],
  format: BibliographyFormat,
): string {
  // Filter for academic evidence only (papers with authors/journals)
  const academicEvidence = evidenceItems.filter((item) => {
    const evidence = item.evidence_items || item;
    return evidence.type === "academic" && (evidence.authors || evidence.doi);
  });

  if (academicEvidence.length === 0) {
    return "No academic evidence items found to generate bibliography.";
  }

  // Convert evidence items to citation-js format
  const citations = academicEvidence.map((item) => {
    const evidence = item.evidence_items || item;

    // Parse authors
    const authors = evidence.authors
      ? evidence.authors.split(",").map((name: string) => {
          const trimmed = name.trim();
          const parts = trimmed.split(" ");
          const family = parts[parts.length - 1];
          const given = parts.slice(0, -1).join(" ");
          return { family, given: given || family };
        })
      : [];

    // Parse publication date
    let issued;
    if (evidence.publication_date) {
      const date = new Date(evidence.publication_date);
      issued = {
        "date-parts": [
          [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        ],
      };
    }

    return {
      type: "article-journal",
      title: evidence.title,
      author: authors,
      "container-title": evidence.journal || undefined,
      DOI: evidence.doi || undefined,
      URL: evidence.source_url || undefined,
      issued: issued,
      abstract: evidence.description || undefined,
    };
  });

  try {
    const cite = new Cite(citations);

    switch (format) {
      case "bibtex":
        return cite.format("bibtex", {
          format: "text",
        });

      case "apa":
        return cite.format("bibliography", {
          format: "text",
          template: "apa",
          lang: "en-US",
        });

      case "mla":
        // citation-js lacks a built-in MLA CSL; vancouver (numbered) is the
        // closest available approximation until a proper MLA CSL is registered.
        return cite.format("bibliography", {
          format: "text",
          template: "vancouver",
          lang: "en-US",
        });

      case "chicago":
        // harvard1 (author-date) approximates Chicago Author-Date style.
        // For full Chicago compliance, register the official CSL XML.
        return cite.format("bibliography", {
          format: "text",
          template: "harvard1",
          lang: "en-US",
        });

      case "ris":
        return cite.format("ris", {
          format: "text",
        });

      default:
        return cite.format("bibliography", {
          format: "text",
          template: "apa",
          lang: "en-US",
        });
    }
  } catch (error) {
    console.error("Error generating bibliography:", error);
    return `Error generating bibliography: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Generate a plain text bibliography with minimal formatting
 */
export function generatePlainTextBibliography(evidenceItems: any[]): string {
  const academicEvidence = evidenceItems.filter((item) => {
    const evidence = item.evidence_items || item;
    return evidence.type === "academic";
  });

  if (academicEvidence.length === 0) {
    return "No academic evidence items found.";
  }

  const lines: string[] = [];

  academicEvidence.forEach((item, index) => {
    const evidence = item.evidence_items || item;

    let citation = `${index + 1}. ${evidence.title}`;

    if (evidence.authors) {
      citation += `. ${evidence.authors}`;
    }

    if (evidence.journal) {
      citation += `. ${evidence.journal}`;
    }

    if (evidence.publication_date) {
      const year = new Date(evidence.publication_date).getFullYear();
      citation += `. ${year}`;
    }

    if (evidence.doi) {
      citation += `. DOI: ${evidence.doi}`;
    }

    lines.push(citation);
  });

  return lines.join("\n\n");
}

/**
 * Export regulatory documents as a formatted list
 */
export function generateRegulatoryDocumentList(evidenceItems: any[]): string {
  const regulatoryEvidence = evidenceItems.filter((item) => {
    const evidence = item.evidence_items || item;
    return evidence.type === "regulatory";
  });

  if (regulatoryEvidence.length === 0) {
    return "No regulatory documents found.";
  }

  const lines: string[] = ["REGULATORY DOCUMENTS\n"];

  regulatoryEvidence.forEach((item, index) => {
    const evidence = item.evidence_items || item;

    let entry = `${index + 1}. ${evidence.title}`;

    if (evidence.regulatory_body) {
      entry += `\n   Agency: ${evidence.regulatory_body}`;
    }

    if (evidence.document_type) {
      entry += `\n   Type: ${evidence.document_type}`;
    }

    if (evidence.publication_date) {
      entry += `\n   Date: ${new Date(evidence.publication_date).toLocaleDateString()}`;
    }

    if (evidence.source_url) {
      entry += `\n   URL: ${evidence.source_url}`;
    }

    lines.push(entry);
  });

  return lines.join("\n\n");
}
