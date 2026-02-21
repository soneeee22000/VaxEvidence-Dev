"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScreeningCard } from "@/components/screening/screening-card";
import { ScreeningStatsBar } from "@/components/screening/screening-stats-bar";
import type {
  ScreeningDecisionWithEvidence,
  ScreeningStageCounts,
  ScreeningStage,
} from "@/lib/validators/screening";
import { screeningStages } from "@/lib/validators/screening";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScreeningPipelineProps {
  protocolId: string;
  decisions: ScreeningDecisionWithEvidence[];
  counts: ScreeningStageCounts;
  onDecision: (
    id: string,
    decision: "include" | "exclude" | "duplicate",
    exclusionReason?: string,
    notes?: string,
  ) => Promise<void>;
  onRevert: (id: string) => Promise<void>;
  onAdvanceIncluded: (stage: ScreeningStage) => Promise<void>;
  onDetectDuplicates?: () => void;
  isLoading?: boolean;
}

/** Tabbed screening pipeline with include/exclude at each PRISMA stage. */
export function ScreeningPipeline({
  protocolId,
  decisions,
  counts,
  onDecision,
  onRevert,
  onAdvanceIncluded,
  onDetectDuplicates,
  isLoading,
}: ScreeningPipelineProps) {
  const [activeStage, setActiveStage] =
    useState<ScreeningStage>("identification");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const stageDecisions = decisions.filter((d) => d.stage === activeStage);
  const pendingItems = stageDecisions.filter((d) => d.decision === "pending");
  const decidedItems = stageDecisions.filter((d) => d.decision !== "pending");

  const nextStageIndex = screeningStages.indexOf(activeStage) + 1;
  const nextStage =
    nextStageIndex < screeningStages.length
      ? screeningStages[nextStageIndex]
      : null;

  const includedCount = stageDecisions.filter(
    (d) => d.decision === "include",
  ).length;

  const handleDecision = useCallback(
    async (
      id: string,
      decision: "include" | "exclude" | "duplicate",
      exclusionReason?: string,
      notes?: string,
    ) => {
      setUpdatingId(id);
      try {
        await onDecision(id, decision, exclusionReason, notes);
      } finally {
        setUpdatingId(null);
      }
    },
    [onDecision],
  );

  const handleRevert = useCallback(
    async (id: string) => {
      setUpdatingId(id);
      try {
        await onRevert(id);
      } finally {
        setUpdatingId(null);
      }
    },
    [onRevert],
  );

  const handleAdvance = useCallback(async () => {
    if (!nextStage) return;
    setIsAdvancing(true);
    try {
      await onAdvanceIncluded(activeStage);
      toast.success(`Advanced ${includedCount} items to ${nextStage}`);
      setActiveStage(nextStage);
    } catch {
      toast.error("Failed to advance items");
    } finally {
      setIsAdvancing(false);
    }
  }, [activeStage, nextStage, includedCount, onAdvanceIncluded]);

  return (
    <div className="space-y-6">
      <ScreeningStatsBar
        counts={counts}
        activeStage={activeStage}
        onStageClick={setActiveStage}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {pendingItems.length} pending &middot; {decidedItems.length} decided
        </div>
        <div className="flex gap-2">
          {activeStage === "identification" && onDetectDuplicates && (
            <Button variant="outline" size="sm" onClick={onDetectDuplicates}>
              Detect Duplicates
            </Button>
          )}
          {nextStage && includedCount > 0 && pendingItems.length === 0 && (
            <Button size="sm" onClick={handleAdvance} disabled={isAdvancing}>
              {isAdvancing ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="mr-1 h-3.5 w-3.5" />
              )}
              Advance {includedCount} to{" "}
              {nextStage.charAt(0).toUpperCase() + nextStage.slice(1)}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stageDecisions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No items at this stage yet.
          {activeStage !== "identification" && (
            <p className="text-sm mt-1">
              Include items from the previous stage and advance them here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {/* Pending items first */}
          {pendingItems.map((item) => (
            <ScreeningCard
              key={item.id}
              item={item}
              stage={activeStage}
              onDecision={handleDecision}
              onRevert={handleRevert}
              isUpdating={updatingId === item.id}
            />
          ))}
          {/* Decided items below */}
          {decidedItems.length > 0 && pendingItems.length > 0 && (
            <div className="border-t my-2" />
          )}
          {decidedItems.map((item) => (
            <ScreeningCard
              key={item.id}
              item={item}
              stage={activeStage}
              onDecision={handleDecision}
              onRevert={handleRevert}
              isUpdating={updatingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
