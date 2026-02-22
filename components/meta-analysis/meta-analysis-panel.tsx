"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ForestPlot } from "@/components/meta-analysis/forest-plot";
import { MetaAnalysisTable } from "@/components/meta-analysis/meta-analysis-table";
import { useMetaAnalysisEntries, queryKeys } from "@/lib/query/hooks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MetaAnalysisPanelProps {
  protocolId: string;
}

/** Container for meta-analysis data entry and forest plot. */
export function MetaAnalysisPanel({ protocolId }: MetaAnalysisPanelProps) {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useMetaAnalysisEntries(protocolId);
  const [logScale, setLogScale] = useState(false);

  /** Invalidate query cache after mutation. */
  const invalidateEntries = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.metaAnalysis.byProtocol(protocolId),
    });
  };

  const handleAdd = async (entry: {
    study_label: string;
    effect_size: number;
    ci_lower: number;
    ci_upper: number;
    weight: number | null;
    subgroup: string | null;
  }) => {
    const res = await fetch("/api/meta-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, protocol_id: protocolId }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error);
    }
    toast.success("Entry added");
    invalidateEntries();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/meta-analysis/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error);
    }
    toast.success("Entry removed");
    invalidateEntries();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Meta-Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Enter study-level effect sizes and confidence intervals to generate a
          forest plot.
        </p>
      </div>

      {/* Data entry table */}
      <MetaAnalysisTable
        entries={entries}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />

      {/* Forest plot */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Forest Plot</h4>
            <div className="flex items-center gap-2">
              <Label htmlFor="log-scale" className="text-sm">
                Log scale (OR/RR)
              </Label>
              <Switch
                id="log-scale"
                checked={logScale}
                onCheckedChange={setLogScale}
              />
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <ForestPlot entries={entries} logScale={logScale} />
          </div>
        </div>
      )}
    </div>
  );
}
