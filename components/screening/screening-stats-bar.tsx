"use client";

import type {
  ScreeningStageCounts,
  ScreeningStage,
} from "@/lib/validators/screening";
import { cn } from "@/lib/utils";

interface ScreeningStatsBarProps {
  counts: ScreeningStageCounts;
  activeStage: ScreeningStage;
  onStageClick: (stage: ScreeningStage) => void;
}

const stageLabels: Record<ScreeningStage, string> = {
  identification: "Identification",
  screening: "Screening",
  eligibility: "Eligibility",
  included: "Included",
};

const stageColors: Record<ScreeningStage, string> = {
  identification: "bg-blue-500",
  screening: "bg-amber-500",
  eligibility: "bg-purple-500",
  included: "bg-green-500",
};

/** Horizontal progress bar showing counts per PRISMA stage. */
export function ScreeningStatsBar({
  counts,
  activeStage,
  onStageClick,
}: ScreeningStatsBarProps) {
  const stages: ScreeningStage[] = [
    "identification",
    "screening",
    "eligibility",
    "included",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stage) => {
        const c = counts[stage];
        const isActive = stage === activeStage;

        return (
          <button
            key={stage}
            onClick={() => onStageClick(stage)}
            className={cn(
              "flex flex-col items-center rounded-lg border px-4 py-3 transition-colors min-w-[140px]",
              isActive
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("h-2 w-2 rounded-full", stageColors[stage])} />
              <span className="text-sm font-medium">{stageLabels[stage]}</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{c.total}</div>
            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
              {c.pending > 0 && (
                <span className="text-amber-500">{c.pending} pending</span>
              )}
              {c.include > 0 && (
                <span className="text-green-500">{c.include} included</span>
              )}
              {c.exclude > 0 && (
                <span className="text-red-500">{c.exclude} excluded</span>
              )}
              {c.duplicate > 0 && (
                <span className="text-gray-500">{c.duplicate} dupes</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
