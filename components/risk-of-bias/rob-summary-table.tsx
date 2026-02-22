"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RobDomainBadge } from "@/components/risk-of-bias/rob-domain-badge";
import { RobAssessmentForm } from "@/components/risk-of-bias/rob-assessment-form";
import { useRiskOfBiasAssessments, queryKeys } from "@/lib/query/hooks";
import type {
  RobJudgment,
  RobTool,
  RobDomainAssessment,
} from "@/lib/validators/risk-of-bias";
import {
  rob2Domains,
  robinsIDomains,
  judgmentLabels,
  judgmentColors,
} from "@/lib/validators/risk-of-bias";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RobSummaryTableProps {
  protocolId: string;
  includedEvidence: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

/** Traffic-light summary table for risk of bias assessments. */
export function RobSummaryTable({
  protocolId,
  includedEvidence,
}: RobSummaryTableProps) {
  const queryClient = useQueryClient();
  const { data: assessments = [], isLoading } =
    useRiskOfBiasAssessments(protocolId);
  const [editingEvidence, setEditingEvidence] = useState<{
    id: string;
    title: string;
  } | null>(null);

  /** Invalidate query cache after mutation. */
  const invalidateAssessments = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.riskOfBias.byProtocol(protocolId),
    });
  };

  const handleSubmit = async (data: {
    protocol_id: string;
    evidence_id: string;
    tool: RobTool;
    domains: Record<string, RobDomainAssessment>;
    overall_judgment: RobJudgment;
  }) => {
    const res = await fetch("/api/risk-of-bias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error);
    }
    toast.success("Assessment saved");
    invalidateAssessments();
    setEditingEvidence(null);
  };

  /** Get assessment for a specific evidence item. */
  const getAssessment = (evidenceId: string) =>
    assessments.find((a) => a.evidence_id === evidenceId);

  /** Determine which domains to show based on assessments. */
  const activeTool: RobTool =
    assessments.length > 0 ? assessments[0].tool : "rob2";
  const domainList = activeTool === "rob2" ? rob2Domains : robinsIDomains;

  if (includedEvidence.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No included studies to assess.</p>
        <p className="text-sm mt-1">
          Include studies through the screening pipeline first.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Risk of Bias Summary</h3>
          <p className="text-sm text-muted-foreground">
            {assessments.length} of {includedEvidence.length} studies assessed
          </p>
        </div>
        {/* Legend */}
        <div className="flex gap-3 text-xs">
          {(["low", "some_concerns", "high", "critical"] as const).map((j) => (
            <div key={j} className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded-full ${judgmentColors[j]}`} />
              <span>{judgmentLabels[j]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic-light table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium">Study</th>
              {domainList.map((domain) => (
                <th
                  key={domain}
                  className="px-2 py-2 font-medium text-center"
                  title={domain}
                >
                  <span className="text-xs">
                    {domain.length > 15 ? domain.slice(0, 12) + "..." : domain}
                  </span>
                </th>
              ))}
              <th className="px-2 py-2 font-medium text-center">Overall</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {includedEvidence.map((evidence) => {
              const assessment = getAssessment(evidence.id);
              return (
                <tr key={evidence.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 max-w-[200px]">
                    <span className="line-clamp-1 text-sm">
                      {evidence.title}
                    </span>
                  </td>
                  {domainList.map((domain) => (
                    <td key={domain} className="px-2 py-2 text-center">
                      {assessment?.domains[domain] ? (
                        <div className="flex justify-center">
                          <RobDomainBadge
                            judgment={
                              assessment.domains[domain].judgment as RobJudgment
                            }
                            justification={
                              assessment.domains[domain].justification
                            }
                            size="sm"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    {assessment?.overall_judgment ? (
                      <div className="flex justify-center">
                        <RobDomainBadge
                          judgment={assessment.overall_judgment}
                          size="sm"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setEditingEvidence({
                          id: evidence.id,
                          title: evidence.title,
                        })
                      }
                    >
                      {assessment ? "Edit" : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assessment form dialog */}
      <Dialog
        open={!!editingEvidence}
        onOpenChange={(open) => !open && setEditingEvidence(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Risk of Bias Assessment</DialogTitle>
          </DialogHeader>
          {editingEvidence && (
            <RobAssessmentForm
              protocolId={protocolId}
              evidenceId={editingEvidence.id}
              evidenceTitle={editingEvidence.title}
              initialTool={getAssessment(editingEvidence.id)?.tool}
              initialDomains={getAssessment(editingEvidence.id)?.domains}
              initialOverall={
                getAssessment(editingEvidence.id)?.overall_judgment
              }
              onSubmit={handleSubmit}
              onCancel={() => setEditingEvidence(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
