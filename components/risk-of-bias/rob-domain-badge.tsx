"use client";

import type { RobJudgment } from "@/lib/validators/risk-of-bias";
import { judgmentColors, judgmentLabels } from "@/lib/validators/risk-of-bias";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RobDomainBadgeProps {
  judgment: RobJudgment;
  justification?: string;
  size?: "sm" | "md";
}

/** Traffic-light circle for a single RoB domain judgment. */
export function RobDomainBadge({
  judgment,
  justification,
  size = "md",
}: RobDomainBadgeProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  const badge = (
    <div
      className={cn(
        "rounded-full shrink-0",
        sizeClass,
        judgmentColors[judgment],
      )}
      title={judgmentLabels[judgment]}
    />
  );

  if (!justification) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <p className="font-medium">{judgmentLabels[judgment]}</p>
          <p className="text-xs text-muted-foreground">{justification}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
