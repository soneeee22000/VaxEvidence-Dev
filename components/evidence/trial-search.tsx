"use client";

import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { EvidenceItem } from "@/lib/validators/evidence";

interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  sponsor: string;
  conditions: string[];
  interventions: string[];
  summary: string;
  startDate: string | null;
  completionDate: string | null;
  sourceUrl: string;
}

interface TrialSearchProps {
  onImported?: (evidence: EvidenceItem) => void;
}

export function TrialSearch({ onImported }: TrialSearchProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClinicalTrial[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [imported, setImported] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search/clinicaltrials?q=${encodeURIComponent(query.trim())}`,
      );
      const data = await response.json();
      setResults(Array.isArray(data.trials) ? data.trials : []);
    } catch (error) {
      console.error("ClinicalTrials search failed:", error);
      toast({
        title: "Search failed",
        description: "Unable to fetch clinical trials.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (
    trial: ClinicalTrial,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    setImporting((prev) => ({ ...prev, [trial.nctId]: true }));
    try {
      const response = await fetch("/api/import/clinicaltrials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trial),
      });
      const data = await response.json();

      if (!response.ok || !data?.evidence) {
        throw new Error(data?.error ?? "Import failed");
      }

      toast({
        title: data.existing ? "Already imported" : "Imported",
        description: data.existing
          ? "This trial is already in your library."
          : "Clinical trial imported successfully.",
      });

      setImported((prev) => ({ ...prev, [trial.nctId]: true }));
      onImported?.(data.evidence);
    } catch (error) {
      console.error("ClinicalTrials import failed:", error);
      toast({
        title: "Import failed",
        description: "Unable to import clinical trial.",
        variant: "destructive",
      });
    } finally {
      setImporting((prev) => ({ ...prev, [trial.nctId]: false }));
    }
  };

  return (
    <>
      <Button variant="outline" type="button" onClick={() => setOpen(true)}>
        Search Clinical Trials
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Search ClinicalTrials.gov</DialogTitle>
            <DialogDescription>
              Search and import clinical trials from ClinicalTrials.gov into
              your evidence library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="COVID-19 vaccine Phase 3..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {results.length === 0 && !isSearching && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No results yet. Run a search to see clinical trials.
                </div>
              )}

              {results.map((trial) => (
                <div key={trial.nctId} className="rounded-lg border p-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold">{trial.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {trial.sponsor || "ClinicalTrials.gov"} • {trial.nctId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trial.phase || "Phase TBD"} •{" "}
                      {trial.status || "Status TBD"}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [trial.nctId]: !prev[trial.nctId],
                        }))
                      }
                    >
                      {expanded[trial.nctId] ? "Hide Details" : "View Details"}
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      onClick={(event) => handleImport(trial, event)}
                      disabled={importing[trial.nctId]}
                    >
                      {importing[trial.nctId]
                        ? "Importing..."
                        : imported[trial.nctId]
                          ? "Imported"
                          : "Import"}
                    </Button>
                  </div>
                  {expanded[trial.nctId] && (
                    <div className="mt-3 space-y-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Conditions:</span>{" "}
                        {trial.conditions?.join(", ") || "—"}
                      </div>
                      <div>
                        <span className="font-medium">Interventions:</span>{" "}
                        {trial.interventions?.join(", ") || "—"}
                      </div>
                      <div>
                        <span className="font-medium">Summary:</span>{" "}
                        {trial.summary || "No summary available."}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
