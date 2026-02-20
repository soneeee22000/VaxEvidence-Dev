"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

// =============================================================================
// EXPORT DIALOG COMPONENT
// =============================================================================
// Modal for configuring protocol export options
// =============================================================================

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  protocolTitle: string;
  format: "pdf" | "word";
}

export function ExportDialog({
  open,
  onOpenChange,
  protocolId,
  protocolTitle,
  format,
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Export options
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeDatasets, setIncludeDatasets] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [includeReviews, setIncludeReviews] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<
    "professional" | "academic" | "regulatory"
  >("professional");

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const endpoint =
        format === "pdf"
          ? `/api/export/protocol/${protocolId}`
          : `/api/export/protocol/${protocolId}/word`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          includeEvidence,
          includeDatasets,
          includeComments,
          includeReviews,
          templateStyle,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extension = format === "pdf" ? "pdf" : "docx";
      const safeTitle = protocolTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `${safeTitle}.${extension}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export successful", {
        description: `Protocol exported as ${format.toUpperCase()}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "Failed to generate export. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Export Protocol as {format === "pdf" ? "PDF" : "Word"}
          </DialogTitle>
          <DialogDescription>
            Configure export options for "{protocolTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Include Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Include in Export:</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-evidence"
                checked={includeEvidence}
                onCheckedChange={(checked) =>
                  setIncludeEvidence(checked as boolean)
                }
              />
              <Label
                htmlFor="include-evidence"
                className="text-sm font-normal cursor-pointer"
              >
                Linked Evidence
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-datasets"
                checked={includeDatasets}
                onCheckedChange={(checked) =>
                  setIncludeDatasets(checked as boolean)
                }
              />
              <Label
                htmlFor="include-datasets"
                className="text-sm font-normal cursor-pointer"
              >
                Linked Datasets
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-comments"
                checked={includeComments}
                onCheckedChange={(checked) =>
                  setIncludeComments(checked as boolean)
                }
              />
              <Label
                htmlFor="include-comments"
                className="text-sm font-normal cursor-pointer"
              >
                Comments
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-reviews"
                checked={includeReviews}
                onCheckedChange={(checked) =>
                  setIncludeReviews(checked as boolean)
                }
              />
              <Label
                htmlFor="include-reviews"
                className="text-sm font-normal cursor-pointer"
              >
                Review History
              </Label>
            </div>
          </div>

          {/* Template Style */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Template Style:</Label>
            <RadioGroup
              value={templateStyle}
              onValueChange={(value: any) => setTemplateStyle(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="style-professional" />
                <Label
                  htmlFor="style-professional"
                  className="font-normal cursor-pointer"
                >
                  Professional
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="academic" id="style-academic" />
                <Label
                  htmlFor="style-academic"
                  className="font-normal cursor-pointer"
                >
                  Academic
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regulatory" id="style-regulatory" />
                <Label
                  htmlFor="style-regulatory"
                  className="font-normal cursor-pointer"
                >
                  Regulatory Submission
                </Label>
              </div>
            </RadioGroup>
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
            {isExporting ? "Generating..." : `Generate ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
