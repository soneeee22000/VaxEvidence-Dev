"use client";

import { useState, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ScreeningDecisionWithEvidence } from "@/lib/validators/screening";
import {
  detectDuplicates,
  type DuplicateGroup,
} from "@/lib/screening/duplicate-detection";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DuplicateDetectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  decisions: ScreeningDecisionWithEvidence[];
  onResolved: () => Promise<void>;
}

const matchTypeLabels: Record<string, string> = {
  doi: "Same DOI",
  external_id: "Same PMID/ID",
  title_similarity: "Similar title",
};

/** Dialog for detecting and resolving duplicate evidence items. */
export function DuplicateDetectorDialog({
  open,
  onOpenChange,
  protocolId,
  decisions,
  onResolved,
}: DuplicateDetectorDialogProps) {
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [isResolving, setIsResolving] = useState(false);

  const groups = useMemo(
    () => detectDuplicates(decisions.filter((d) => d.decision === "pending")),
    [decisions],
  );

  const handleResolve = async () => {
    setIsResolving(true);
    let totalPatches = 0;
    let failedPatches = 0;

    try {
      for (const group of groups) {
        const keepId = selections[group.groupIndex];
        if (!keepId) continue;

        const duplicateIds = group.items
          .filter((item) => item.id !== keepId)
          .map((item) => item.id);

        for (const id of duplicateIds) {
          totalPatches++;
          try {
            const res = await fetch(`/api/screening/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                decision: "duplicate",
                exclusion_reason: "Duplicate",
              }),
            });
            if (!res.ok) {
              failedPatches++;
              const json = await res.json().catch(() => ({}));
              console.error(
                `Failed to mark ${id} as duplicate:`,
                json.error ?? res.statusText,
              );
            }
          } catch {
            failedPatches++;
          }
        }
      }

      if (failedPatches === 0) {
        toast.success("Duplicates resolved");
        await onResolved();
        onOpenChange(false);
      } else if (failedPatches < totalPatches) {
        toast.warning(
          `${totalPatches - failedPatches} of ${totalPatches} duplicates resolved, ${failedPatches} failed`,
        );
        await onResolved();
      } else {
        toast.error("Failed to resolve duplicates");
      }
    } catch {
      toast.error("Failed to resolve duplicates");
    } finally {
      setIsResolving(false);
    }
  };

  const allSelected = groups.every(
    (g) => selections[g.groupIndex] !== undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplicate Detection</DialogTitle>
          <DialogDescription>
            {groups.length > 0
              ? `Found ${groups.length} potential duplicate group${groups.length > 1 ? "s" : ""}. Select which item to keep in each group.`
              : "No duplicates detected among pending items."}
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>No duplicates found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.groupIndex} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Group {group.groupIndex + 1}</Badge>
                  <Badge variant="secondary">
                    {matchTypeLabels[group.matchType]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {group.items.length} items
                  </span>
                </div>

                <RadioGroup
                  value={selections[group.groupIndex] ?? ""}
                  onValueChange={(value) =>
                    setSelections((prev) => ({
                      ...prev,
                      [group.groupIndex]: value,
                    }))
                  }
                >
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                    >
                      <RadioGroupItem
                        value={item.id}
                        id={`keep-${item.id}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`keep-${item.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium">
                          {item.evidence_items.title}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          {item.evidence_items.authors && (
                            <span>{item.evidence_items.authors}</span>
                          )}
                          {item.evidence_items.doi && (
                            <span>DOI: {item.evidence_items.doi}</span>
                          )}
                          {item.evidence_items.external_id && (
                            <span>
                              {item.evidence_items.external_source}:{" "}
                              {item.evidence_items.external_id}
                            </span>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {groups.length > 0 && (
            <Button
              onClick={handleResolve}
              disabled={!allSelected || isResolving}
            >
              {isResolving && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              Resolve {groups.length} Group{groups.length > 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
