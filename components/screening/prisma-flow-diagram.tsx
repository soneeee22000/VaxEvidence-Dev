"use client";

import type { ScreeningStageCounts } from "@/lib/validators/screening";
import { computePrismaCounts } from "@/lib/screening/prisma-counts";

interface PrismaFlowDiagramProps {
  counts: ScreeningStageCounts;
}

/** A box in the PRISMA flow diagram. */
function FlowBox({
  label,
  count,
  variant = "default",
}: {
  label: string;
  count: number;
  variant?: "default" | "exclude" | "final";
}) {
  const bgClass =
    variant === "exclude"
      ? "border-red-500/30 bg-red-500/5"
      : variant === "final"
        ? "border-green-500/30 bg-green-500/5"
        : "border-muted bg-card";

  return (
    <div
      className={`rounded-lg border-2 px-4 py-3 text-center min-w-[180px] ${bgClass}`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{count}</div>
    </div>
  );
}

/** Vertical arrow connecting flow boxes. */
function Arrow({ direction = "down" }: { direction?: "down" | "right" }) {
  if (direction === "right") {
    return (
      <div className="flex items-center px-2">
        <div className="w-8 h-0.5 bg-muted-foreground/30" />
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-muted-foreground/30" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-0.5 h-6 bg-muted-foreground/30" />
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-muted-foreground/30" />
    </div>
  );
}

/** PRISMA 2020 flow diagram rendered with Tailwind CSS. */
export function PrismaFlowDiagram({ counts }: PrismaFlowDiagramProps) {
  const flow = computePrismaCounts(counts);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">PRISMA 2020 Flow Diagram</h3>
      <p className="text-sm text-muted-foreground">
        Preferred Reporting Items for Systematic Reviews and Meta-Analyses
      </p>

      <div className="flex flex-col items-center gap-0 py-6">
        {/* Row 1: Identification */}
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Identification
        </div>
        <FlowBox
          label="Records identified from databases/registers"
          count={flow.identified}
        />
        <Arrow />

        {/* Row 2: Duplicates removed */}
        <div className="flex items-center gap-0">
          <FlowBox
            label="Records after duplicates removed"
            count={flow.identified - flow.duplicatesRemoved}
          />
          <Arrow direction="right" />
          <FlowBox
            label="Duplicate records removed"
            count={flow.duplicatesRemoved}
            variant="exclude"
          />
        </div>
        <Arrow />

        {/* Row 3: Screening */}
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Screening
        </div>
        <div className="flex items-center gap-0">
          <FlowBox label="Records screened" count={flow.screened} />
          <Arrow direction="right" />
          <FlowBox
            label="Records excluded"
            count={flow.screeningExcluded}
            variant="exclude"
          />
        </div>
        <Arrow />

        {/* Row 4: Eligibility */}
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Eligibility
        </div>
        <div className="flex items-center gap-0">
          <FlowBox
            label="Reports assessed for eligibility"
            count={flow.eligibilityAssessed}
          />
          <Arrow direction="right" />
          <FlowBox
            label="Reports excluded"
            count={flow.eligibilityExcluded}
            variant="exclude"
          />
        </div>
        <Arrow />

        {/* Row 5: Included */}
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Included
        </div>
        <FlowBox
          label="Studies included in review"
          count={flow.included}
          variant="final"
        />
      </div>
    </div>
  );
}
