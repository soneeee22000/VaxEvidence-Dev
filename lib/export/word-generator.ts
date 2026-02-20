import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import type { ProtocolRecord } from "@/lib/supabase/protocols";
import type { ProtocolExportOptions } from "./types";
import { format } from "date-fns";

// =============================================================================
// WORD DOCUMENT GENERATOR
// =============================================================================
// Generate Microsoft Word documents for protocols
// =============================================================================

/**
 * Generate a Word document for a protocol
 */
export async function generateProtocolWord(
  protocol: ProtocolRecord,
  linkedEvidence: any[],
  linkedDatasets: any[],
  comments: any[],
  reviews: any[],
  options: ProtocolExportOptions,
): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: protocol.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  );

  // Metadata table
  children.push(
    new Paragraph({
      text: "Protocol Information",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
  );

  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Status", bold: true })],
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: protocol.status.toUpperCase() })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Created", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: format(new Date(protocol.created_at), "MMMM d, yyyy"),
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Last Updated", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: format(new Date(protocol.updated_at), "MMMM d, yyyy"),
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Protocol ID", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: protocol.id })],
          }),
        ],
      }),
    ],
  });

  children.push(metadataTable);
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Study Question
  children.push(
    new Paragraph({
      text: "Study Question",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.study_question || "Not specified",
      spacing: { after: 300 },
    }),
  );

  // PICO Framework
  children.push(
    new Paragraph({
      text: "PICO Framework",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      text: "Population",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 100 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.population || "Not specified",
      spacing: { after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      text: "Intervention",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 100 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.intervention || "Not specified",
      spacing: { after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      text: "Comparator",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 100 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.comparator || "Not specified",
      spacing: { after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      text: "Outcomes",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 100, after: 100 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.outcomes || "Not specified",
      spacing: { after: 200 },
    }),
  );

  // Study Design
  children.push(
    new Paragraph({
      text: "Study Design",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
  );
  children.push(
    new Paragraph({
      text: protocol.design || "Not specified",
      spacing: { after: 300 },
    }),
  );

  // Linked Evidence
  if (options.includeEvidence && linkedEvidence.length > 0) {
    children.push(
      new Paragraph({
        text: `Linked Evidence (${linkedEvidence.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    linkedEvidence.forEach((link, index) => {
      const evidence = link.evidence_items;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: evidence.title, bold: true }),
          ],
          spacing: { before: 150, after: 100 },
        }),
      );

      if (evidence.type === "academic") {
        if (evidence.authors) {
          children.push(
            new Paragraph({
              text: `Authors: ${evidence.authors}`,
              spacing: { after: 50 },
              indent: { left: 400 },
            }),
          );
        }
        if (evidence.journal) {
          children.push(
            new Paragraph({
              text: `Journal: ${evidence.journal}`,
              spacing: { after: 50 },
              indent: { left: 400 },
            }),
          );
        }
        if (evidence.doi) {
          children.push(
            new Paragraph({
              text: `DOI: ${evidence.doi}`,
              spacing: { after: 50 },
              indent: { left: 400 },
            }),
          );
        }
      } else if (evidence.type === "regulatory") {
        if (evidence.regulatory_body) {
          children.push(
            new Paragraph({
              text: `Regulatory Body: ${evidence.regulatory_body}`,
              spacing: { after: 50 },
              indent: { left: 400 },
            }),
          );
        }
        if (evidence.document_type) {
          children.push(
            new Paragraph({
              text: `Document Type: ${evidence.document_type}`,
              spacing: { after: 50 },
              indent: { left: 400 },
            }),
          );
        }
      }

      if (evidence.description) {
        children.push(
          new Paragraph({
            text: evidence.description,
            spacing: { after: 100 },
            indent: { left: 400 },
          }),
        );
      }

      if (link.note) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Note: ", italics: true }),
              new TextRun({ text: link.note, italics: true }),
            ],
            spacing: { after: 100 },
            indent: { left: 400 },
          }),
        );
      }
    });
  }

  // Linked Datasets
  if (options.includeDatasets && linkedDatasets.length > 0) {
    children.push(
      new Paragraph({
        text: `Linked Datasets (${linkedDatasets.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    linkedDatasets.forEach((link, index) => {
      const dataset = link.datasets;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: dataset.name, bold: true }),
          ],
          spacing: { before: 150, after: 100 },
        }),
      );

      children.push(
        new Paragraph({
          text: dataset.description,
          spacing: { after: 50 },
          indent: { left: 400 },
        }),
      );

      children.push(
        new Paragraph({
          text: `Type: ${dataset.dataset_type}`,
          spacing: { after: 50 },
          indent: { left: 400 },
        }),
      );

      children.push(
        new Paragraph({
          text: `Size: ${(dataset.file_size / 1024).toFixed(2)} KB`,
          spacing: { after: 50 },
          indent: { left: 400 },
        }),
      );

      if (dataset.row_count) {
        children.push(
          new Paragraph({
            text: `Rows: ${dataset.row_count.toLocaleString()} × ${dataset.column_count} columns`,
            spacing: { after: 50 },
            indent: { left: 400 },
          }),
        );
      }

      if (link.note) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Note: ", italics: true }),
              new TextRun({ text: link.note, italics: true }),
            ],
            spacing: { after: 100 },
            indent: { left: 400 },
          }),
        );
      }
    });
  }

  // Comments
  if (options.includeComments && comments.length > 0) {
    children.push(
      new Paragraph({
        text: `Comments (${comments.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    comments.forEach((comment) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${comment.user?.email || "Unknown User"} - `,
              bold: true,
            }),
            new TextRun({
              text: format(new Date(comment.created_at), "MMM d, yyyy HH:mm"),
            }),
          ],
          spacing: { before: 100, after: 50 },
        }),
      );

      children.push(
        new Paragraph({
          text: comment.content,
          spacing: { after: 150 },
          indent: { left: 400 },
        }),
      );
    });
  }

  // Reviews
  if (options.includeReviews && reviews.length > 0) {
    children.push(
      new Paragraph({
        text: `Review History (${reviews.length})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    reviews.forEach((review) => {
      const reviewerEmail = review.reviewer?.email || "Unknown Reviewer";

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${reviewerEmail} - `, bold: true }),
            new TextRun({ text: review.status.toUpperCase(), bold: true }),
          ],
          spacing: { before: 100, after: 50 },
        }),
      );

      children.push(
        new Paragraph({
          text: `Requested: ${format(new Date(review.requested_at), "MMM d, yyyy")}`,
          spacing: { after: 50 },
          indent: { left: 400 },
        }),
      );

      if (review.decision_at) {
        children.push(
          new Paragraph({
            text: `Reviewed: ${format(new Date(review.decision_at), "MMM d, yyyy")}`,
            spacing: { after: 50 },
            indent: { left: 400 },
          }),
        );
      }

      if (review.decision) {
        children.push(
          new Paragraph({
            text: `Decision: ${review.decision}`,
            spacing: { after: 150 },
            indent: { left: 400 },
          }),
        );
      }
    });
  }

  // Footer
  children.push(
    new Paragraph({
      text: "",
      spacing: { before: 500 },
    }),
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by VaxEvidence on ${format(new Date(), "MMMM d, yyyy")}`,
          size: 18,
          color: "808080",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
