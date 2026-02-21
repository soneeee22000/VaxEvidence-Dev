"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  robTools,
  rob2Domains,
  robinsIDomains,
  robJudgments,
  judgmentLabels,
  type RobTool,
  type RobJudgment,
  type RobDomainAssessment,
} from "@/lib/validators/risk-of-bias";
import { Loader2 } from "lucide-react";

interface RobAssessmentFormProps {
  protocolId: string;
  evidenceId: string;
  evidenceTitle: string;
  initialTool?: RobTool;
  initialDomains?: Record<string, RobDomainAssessment>;
  initialOverall?: RobJudgment;
  onSubmit: (data: {
    protocol_id: string;
    evidence_id: string;
    tool: RobTool;
    domains: Record<string, RobDomainAssessment>;
    overall_judgment: RobJudgment;
  }) => Promise<void>;
  onCancel?: () => void;
}

/** Form for assessing risk of bias using RoB 2 or ROBINS-I. */
export function RobAssessmentForm({
  protocolId,
  evidenceId,
  evidenceTitle,
  initialTool = "rob2",
  initialDomains = {},
  initialOverall,
  onSubmit,
  onCancel,
}: RobAssessmentFormProps) {
  const [tool, setTool] = useState<RobTool>(initialTool);
  const [domains, setDomains] =
    useState<Record<string, RobDomainAssessment>>(initialDomains);
  const [overallJudgment, setOverallJudgment] = useState<RobJudgment | "">(
    initialOverall ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const domainList = tool === "rob2" ? rob2Domains : robinsIDomains;

  const updateDomain = (
    domain: string,
    field: keyof RobDomainAssessment,
    value: string,
  ) => {
    setDomains((prev) => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        judgment: prev[domain]?.judgment ?? "low",
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!overallJudgment) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        protocol_id: protocolId,
        evidence_id: evidenceId,
        tool,
        domains,
        overall_judgment: overallJudgment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allDomainsAssessed = domainList.every((d) => domains[d]?.judgment);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">{evidenceTitle}</h4>
        <p className="text-sm text-muted-foreground">Risk of Bias Assessment</p>
      </div>

      {/* Tool selector */}
      <div className="space-y-1">
        <Label>Assessment Tool</Label>
        <Select
          value={tool}
          onValueChange={(v) => {
            setTool(v as RobTool);
            setDomains({});
            setOverallJudgment("");
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rob2">RoB 2 (RCTs)</SelectItem>
            <SelectItem value="robins_i">ROBINS-I (Observational)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Domain assessments */}
      <div className="space-y-3">
        {domainList.map((domain) => (
          <div key={domain} className="border rounded-lg p-3 space-y-2">
            <Label className="text-sm font-medium">{domain}</Label>
            <div className="flex gap-3">
              <Select
                value={domains[domain]?.judgment ?? ""}
                onValueChange={(v) => updateDomain(domain, "judgment", v)}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="Select judgment" />
                </SelectTrigger>
                <SelectContent>
                  {robJudgments.map((j) => (
                    <SelectItem key={j} value={j}>
                      {judgmentLabels[j]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={domains[domain]?.justification ?? ""}
                onChange={(e) =>
                  updateDomain(domain, "justification", e.target.value)
                }
                placeholder="Justification (optional)"
                className="text-sm min-h-[36px] h-9 flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall judgment */}
      <div className="space-y-1 border-t pt-3">
        <Label className="font-medium">Overall Judgment</Label>
        <Select
          value={overallJudgment}
          onValueChange={(v) => setOverallJudgment(v as RobJudgment)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select overall judgment" />
          </SelectTrigger>
          <SelectContent>
            {robJudgments.map((j) => (
              <SelectItem key={j} value={j}>
                {judgmentLabels[j]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!allDomainsAssessed || !overallJudgment || isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          )}
          Save Assessment
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
