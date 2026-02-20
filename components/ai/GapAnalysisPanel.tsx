"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { GapAnalysis } from "@/lib/ai/ai-validators";

/**
 * AI-powered evidence gap analysis panel.
 * Analyzes linked evidence against protocol PICO framework.
 */
interface GapAnalysisPanelProps {
  protocolId: string;
  linkedEvidenceCount: number;
}

const ASSESSMENT_COLORS: Record<string, string> = {
  strong: "bg-green-500/10 text-green-600 dark:text-green-400",
  moderate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  weak: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  insufficient: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  important:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  minor: "bg-muted text-muted-foreground",
};

export function GapAnalysisPanel({
  protocolId,
  linkedEvidenceCount,
}: GapAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GapAnalysis | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol_id: protocolId }),
      });

      if (!response.ok) {
        throw new Error("Gap analysis failed");
      }

      const { data } = await response.json();
      setResult(data);
      toast.success("Gap analysis complete");
    } catch (err) {
      console.error("Gap analysis error:", err);
      toast.error("Failed to analyze evidence gaps");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (linkedEvidenceCount === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Link at least one evidence item to analyze evidence gaps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
        {isAnalyzing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isAnalyzing ? "Analyzing..." : "Analyze Evidence Gaps"}
      </Button>

      {result && (
        <div className="space-y-4">
          {/* Overall Assessment */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`capitalize ${ASSESSMENT_COLORS[result.overall_assessment] ?? ""}`}
            >
              {result.overall_assessment}
            </Badge>
            <div className="flex-1">
              <Progress value={result.coverage_score} className="h-2" />
            </div>
            <span className="text-sm font-medium">
              {result.coverage_score}%
            </span>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Strengths ({result.strengths.length})
              </h4>
              <div className="space-y-2">
                {result.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-green-500/20 bg-green-500/5 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{s.area}</span>
                      <Badge variant="secondary" className="text-xs">
                        {s.supporting_evidence_count} studies
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {result.gaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Gaps ({result.gaps.length})
              </h4>
              <div className="space-y-2">
                {result.gaps.map((g, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 ${PRIORITY_COLORS[g.priority] ?? ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{g.area}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {g.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {g.description}
                    </p>
                    <p className="text-xs italic text-muted-foreground">
                      Suggestion: {g.suggested_action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              {result.recommendation_summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
