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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

// =============================================================================
// BIBLIOGRAPHY DIALOG COMPONENT
// =============================================================================
// Modal for exporting evidence bibliography in various formats
// =============================================================================

interface BibliographyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
}

export function BibliographyDialog({
  open,
  onOpenChange,
  protocolId,
}: BibliographyDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<
    "bibtex" | "apa" | "mla" | "chicago" | "ris"
  >("apa");

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/export/bibliography", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          protocolId,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extensions: Record<string, string> = {
        bibtex: "bib",
        apa: "txt",
        mla: "txt",
        chicago: "txt",
        ris: "ris",
      };

      a.download = `bibliography-${protocolId.substring(0, 8)}.${extensions[format]}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Bibliography exported", {
        description: `Bibliography exported in ${format.toUpperCase()} format`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate bibliography",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Export Bibliography</DialogTitle>
          <DialogDescription>
            Export linked evidence as a formatted bibliography
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label className="text-sm font-medium">Citation Format:</Label>
          <RadioGroup
            value={format}
            onValueChange={(value: any) => setFormat(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="apa" id="format-apa" />
              <Label
                htmlFor="format-apa"
                className="font-normal cursor-pointer"
              >
                APA (American Psychological Association)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mla" id="format-mla" />
              <Label
                htmlFor="format-mla"
                className="font-normal cursor-pointer"
              >
                MLA (Modern Language Association)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="chicago" id="format-chicago" />
              <Label
                htmlFor="format-chicago"
                className="font-normal cursor-pointer"
              >
                Chicago (Harvard Style)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bibtex" id="format-bibtex" />
              <Label
                htmlFor="format-bibtex"
                className="font-normal cursor-pointer"
              >
                BibTeX (for LaTeX)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ris" id="format-ris" />
              <Label
                htmlFor="format-ris"
                className="font-normal cursor-pointer"
              >
                RIS (for Zotero, Mendeley, EndNote)
              </Label>
            </div>
          </RadioGroup>

          <p className="text-xs text-muted-foreground mt-4">
            Only academic evidence items with authors will be included in the
            bibliography.
          </p>
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
            {isExporting ? "Generating..." : "Export Bibliography"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
