"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileType,
  BookOpen,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportDialog } from "./export-dialog";
import { BibliographyDialog } from "./bibliography-dialog";

// =============================================================================
// EXPORT MENU COMPONENT
// =============================================================================
// Dropdown menu for protocol export options
// =============================================================================

interface ExportMenuProps {
  protocolId: string;
  protocolTitle: string;
  hasEvidence?: boolean;
}

export function ExportMenu({
  protocolId,
  protocolTitle,
  hasEvidence = false,
}: ExportMenuProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "word">("pdf");
  const [bibliographyDialogOpen, setBibliographyDialogOpen] = useState(false);

  const handleExportClick = (format: "pdf" | "word") => {
    setExportFormat(format);
    setExportDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExportClick("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("word")}>
            <FileType className="mr-2 h-4 w-4" />
            Export as Word
          </DropdownMenuItem>
          {hasEvidence && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBibliographyDialogOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Export Bibliography
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              try {
                const { generatePrismaPDF } =
                  await import("@/lib/export/prisma-pdf-generator");
                const res = await fetch(
                  `/api/screening?protocol_id=${protocolId}`,
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);

                const decisions = json.data ?? [];
                const emptyCounts = () => ({
                  total: 0,
                  pending: 0,
                  include: 0,
                  exclude: 0,
                  duplicate: 0,
                });
                const counts = {
                  identification: emptyCounts(),
                  screening: emptyCounts(),
                  eligibility: emptyCounts(),
                  included: emptyCounts(),
                };
                for (const d of decisions) {
                  const stage = d.stage as keyof typeof counts;
                  if (counts[stage]) {
                    counts[stage].total++;
                    const key = d.decision as string;
                    if (key in counts[stage]) {
                      (counts[stage] as Record<string, number>)[key]++;
                    }
                  }
                }

                const blob = await generatePrismaPDF(counts, protocolTitle);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `PRISMA-${protocolTitle.replace(/\s+/g, "-").slice(0, 40)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("PRISMA diagram exported");
              } catch {
                toast.error("Failed to export PRISMA diagram");
              }
            }}
          >
            <GitBranch className="mr-2 h-4 w-4" />
            PRISMA Diagram (PDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        protocolId={protocolId}
        protocolTitle={protocolTitle}
        format={exportFormat}
      />

      <BibliographyDialog
        open={bibliographyDialogOpen}
        onOpenChange={setBibliographyDialogOpen}
        protocolId={protocolId}
      />
    </>
  );
}
