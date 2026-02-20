"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact quality score badge for evidence items.
 * Displays AI-generated quality score (1-5) and CEBM grade.
 * Renders nothing when score is null/undefined.
 */
interface QualityScoreBadgeProps {
  score?: number | null;
  grade?: string | null;
  rationale?: string | null;
}

const SCORE_COLORS: Record<number, string> = {
  5: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  4: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  3: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  2: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  1: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

export function QualityScoreBadge({
  score,
  grade,
  rationale,
}: QualityScoreBadgeProps) {
  if (score == null) return null;

  const colorClass = SCORE_COLORS[score] ?? "";
  const label = `${score}/5${grade ? ` (${grade})` : ""}`;

  if (!rationale) {
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        Q: {label}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs cursor-help ${colorClass}`}
          >
            Q: {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{rationale}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
