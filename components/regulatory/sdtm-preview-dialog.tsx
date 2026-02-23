"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, Database, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  SDTM_DOMAINS,
  getTrialDesignDomains,
  getClinicalDomains,
} from "@/lib/regulatory/sdtm-domains";

// =============================================================================
// SDTM PREVIEW DIALOG
// =============================================================================
// Domain selection + preview dialog for CDISC/SDTM dataset template export.
// Users select which SDTM domains to include before downloading a ZIP package.
// =============================================================================

/** All domain codes for initial selection */
const ALL_DOMAIN_CODES = SDTM_DOMAINS.map((d) => d.code);

interface SDTMPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  protocolTitle: string;
  /** Protocol data for trial design auto-population */
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
}

export function SDTMPreviewDialog({
  open,
  onOpenChange,
  protocolId,
  protocolTitle,
  protocol,
}: SDTMPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    () => new Set(ALL_DOMAIN_CODES),
  );

  const trialDesignDomains = useMemo(() => getTrialDesignDomains(), []);
  const clinicalDomains = useMemo(() => getClinicalDomains(), []);

  /** Total variable count across all selected domains */
  const variableCount = useMemo(() => {
    return SDTM_DOMAINS.filter((d) => selectedDomains.has(d.code)).reduce(
      (sum, d) => sum + d.variables.length,
      0,
    );
  }, [selectedDomains]);

  const allSelected = selectedDomains.size === ALL_DOMAIN_CODES.length;

  /**
   * Toggle a single domain in/out of the selection set.
   */
  const toggleDomain = useCallback((code: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  /**
   * Select all or deselect all domains.
   */
  const toggleAll = useCallback(() => {
    setSelectedDomains((prev) => {
      if (prev.size === ALL_DOMAIN_CODES.length) {
        return new Set<string>();
      }
      return new Set(ALL_DOMAIN_CODES);
    });
  }, []);

  /**
   * Download the SDTM ZIP package via the API route.
   */
  const handleDownload = useCallback(async () => {
    if (selectedDomains.size === 0) {
      toast.error("No domains selected", {
        description: "Select at least one SDTM domain to download.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/export/protocol/${protocolId}/sdtm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDomains: [...selectedDomains],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const safeTitle = protocolTitle
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .substring(0, 40);
      a.download = `SDTM-${safeTitle}.zip`;

      document.body.appendChild(a);
      try {
        a.click();
      } finally {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success("SDTM templates generated", {
        description: `${selectedDomains.size} domain templates exported as ZIP`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("SDTM template generation failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDomains, protocolId, protocolTitle, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            CDISC/SDTM Dataset Templates
          </DialogTitle>
          <DialogDescription>
            Select domains to include in the download package for &ldquo;
            {protocolTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select All / Deselect All toggle */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
            <p className="text-sm text-zinc-500">
              {variableCount} variables across {selectedDomains.size} domains
            </p>
          </div>

          {/* Trial Design Domains */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Trial Design (Auto-populated)
            </p>
            <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
              {trialDesignDomains.map((domain) => (
                <label
                  key={domain.code}
                  className="flex items-start gap-3 py-1.5 border-b border-zinc-800/50 last:border-0 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDomains.has(domain.code)}
                    onCheckedChange={() => toggleDomain(domain.code)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-blue-500/50 bg-blue-500/10 text-blue-400 text-xs font-mono"
                      >
                        {domain.code}
                      </Badge>
                      <span className="text-sm font-medium text-zinc-200">
                        {domain.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Auto-populated from PICO &middot;{" "}
                      {domain.variables.length} variables
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Clinical Domains */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Clinical (Empty Templates)
            </p>
            <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
              {clinicalDomains.map((domain) => (
                <label
                  key={domain.code}
                  className="flex items-start gap-3 py-1.5 border-b border-zinc-800/50 last:border-0 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDomains.has(domain.code)}
                    onCheckedChange={() => toggleDomain(domain.code)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-zinc-500/50 bg-zinc-500/10 text-zinc-400 text-xs font-mono"
                      >
                        {domain.code}
                      </Badge>
                      <span className="text-sm font-medium text-zinc-200">
                        {domain.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {domain.code === "IS"
                        ? "Vaccine-specific immunogenicity domain"
                        : "Headers only \u2014 populate during data collection"}{" "}
                      &middot; {domain.variables.length} variables
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Draft warning */}
          {protocol?.status === "draft" && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-400">
                This protocol is in <strong>draft</strong> status. Trial design
                domains will be populated with available data, but some fields
                may be incomplete.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating || selectedDomains.size === 0}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating
              ? "Generating..."
              : `Download ZIP (${selectedDomains.size} domains)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
