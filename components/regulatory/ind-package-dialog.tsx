"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileType,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  evaluateINDCompleteness,
  type INDSectionCompleteness,
  type INDSectionStatus,
} from "@/lib/regulatory/ind-sections";

// =============================================================================
// IND PACKAGE DIALOG
// =============================================================================
// Pre-generation dialog showing section completeness before generating
// an FDA IND submission package.
// =============================================================================

interface INDPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  protocolTitle: string;
  /** Protocol data for completeness evaluation */
  protocol?: {
    title?: string;
    study_question?: string;
    population?: string;
    intervention?: string;
    comparator?: string;
    outcomes?: string;
    design?: string;
    status?: string;
  };
  evidenceCount?: number;
  robCount?: number;
  metaAnalysisCount?: number;
}

/**
 * Status badge color mapping.
 */
function statusBadge(status: INDSectionStatus) {
  switch (status) {
    case "complete":
      return (
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-500/10 text-green-400 text-xs"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Auto-populated
        </Badge>
      );
    case "partial":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-xs"
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          Partial
        </Badge>
      );
    case "template-only":
      return (
        <Badge
          variant="outline"
          className="border-zinc-500/50 bg-zinc-500/10 text-zinc-400 text-xs"
        >
          Template only
        </Badge>
      );
  }
}

export function INDPackageDialog({
  open,
  onOpenChange,
  protocolId,
  protocolTitle,
  protocol,
  evidenceCount = 0,
  robCount = 0,
  metaAnalysisCount = 0,
}: INDPackageDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "word">("pdf");

  // Evaluate section completeness
  const completeness: INDSectionCompleteness[] = protocol
    ? evaluateINDCompleteness({
        protocol,
        evidenceCount,
        robCount,
        metaAnalysisCount,
      })
    : [];

  const completeCount = completeness.filter(
    (c) => c.status === "complete",
  ).length;
  const totalCount = completeness.length;

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const endpoint =
        exportFormat === "pdf"
          ? `/api/export/protocol/${protocolId}/ind`
          : `/api/export/protocol/${protocolId}/ind/word`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extension = exportFormat === "pdf" ? "pdf" : "docx";
      const safeTitle = protocolTitle
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .substring(0, 40);
      a.download = `IND-${safeTitle}.${extension}`;

      document.body.appendChild(a);
      try {
        a.click();
      } finally {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success("IND package generated", {
        description: `FDA IND submission package exported as ${extension.toUpperCase()}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("IND package generation failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, protocolId, protocolTitle, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            FDA IND Submission Package
          </DialogTitle>
          <DialogDescription>
            Generate a structured IND application (21 CFR 312.23) for &ldquo;
            {protocolTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {/* Section Completeness Preview */}
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">
              Section Completeness
            </p>
            <p className="text-sm text-zinc-500">
              {completeCount}/{totalCount} sections auto-populated
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
              style={{
                width: `${totalCount > 0 ? (completeCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Section list */}
          <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
            {completeness.map((section) => (
              <div
                key={section.sectionNumber}
                className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {section.sectionNumber}: {section.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {section.reason}
                  </p>
                </div>
                <div className="shrink-0">{statusBadge(section.status)}</div>
              </div>
            ))}
          </div>

          {/* Draft warning */}
          {protocol?.status === "draft" && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-400">
                This protocol is in <strong>draft</strong> status. Regulatory
                submissions typically require finalized protocols. You can still
                generate the package for review.
              </p>
            </div>
          )}

          {/* Format selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">Export Format</p>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("pdf")}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant={exportFormat === "word" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("word")}
                className="flex-1"
              >
                <FileType className="mr-2 h-4 w-4" />
                Word (.docx)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? "Generating..." : "Generate IND Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
