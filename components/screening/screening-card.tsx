"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ScreeningDecisionWithEvidence,
  ScreeningStage,
} from "@/lib/validators/screening";
import { exclusionReasonCategories } from "@/lib/validators/screening";
import {
  Check,
  X,
  Copy,
  FileText,
  Building2,
  Database,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ScreeningCardProps {
  item: ScreeningDecisionWithEvidence;
  stage: ScreeningStage;
  onDecision: (
    id: string,
    decision: "include" | "exclude" | "duplicate",
    exclusionReason?: string,
    notes?: string,
  ) => void;
  onRevert: (id: string) => void;
  isUpdating?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  academic: FileText,
  regulatory: Building2,
  dataset: Database,
  note: StickyNote,
};

const typeColors: Record<string, string> = {
  academic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  regulatory: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  dataset: "bg-green-500/10 text-green-400 border-green-500/20",
  note: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const decisionColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  include: "bg-green-500/10 text-green-400 border-green-500/20",
  exclude: "bg-red-500/10 text-red-400 border-red-500/20",
  duplicate: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

/** Card for a single evidence item in the screening pipeline. */
export function ScreeningCard({
  item,
  stage,
  onDecision,
  onRevert,
  isUpdating,
}: ScreeningCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [exclusionReason, setExclusionReason] = useState(
    item.exclusion_reason ?? "",
  );
  const [notes, setNotes] = useState(item.notes ?? "");
  const [showExcludeForm, setShowExcludeForm] = useState(false);

  const evidence = item.evidence_items;
  const Icon = typeIcons[evidence.type] ?? FileText;
  const isPending = item.decision === "pending";

  return (
    <Card className="border-muted/70">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={typeColors[evidence.type]} variant="outline">
                <Icon className="mr-1 h-3 w-3" />
                {evidence.type}
              </Badge>
              <Badge
                className={decisionColors[item.decision]}
                variant="outline"
              >
                {item.decision}
              </Badge>
            </div>
            <CardTitle className="text-base line-clamp-2">
              {evidence.title}
            </CardTitle>
            {evidence.authors && (
              <p className="text-sm text-muted-foreground mt-1">
                {evidence.authors}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-2">
          {evidence.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {evidence.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {evidence.doi && <span>DOI: {evidence.doi}</span>}
            {evidence.external_id && (
              <span>
                {evidence.external_source}: {evidence.external_id}
              </span>
            )}
          </div>
          {evidence.tags && evidence.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {evidence.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {item.exclusion_reason && (
            <p className="text-sm text-red-400 mt-2">
              Reason: {item.exclusion_reason}
            </p>
          )}
          {item.notes && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              {item.notes}
            </p>
          )}
        </CardContent>
      )}

      <CardContent className="pt-0">
        {isPending && !showExcludeForm && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-500 hover:bg-green-500/10"
              disabled={isUpdating}
              onClick={() => onDecision(item.id, "include")}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Include
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:bg-red-500/10"
              disabled={isUpdating}
              onClick={() => setShowExcludeForm(true)}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Exclude
            </Button>
            {stage === "identification" && (
              <Button
                size="sm"
                variant="outline"
                className="text-gray-500 hover:bg-gray-500/10"
                disabled={isUpdating}
                onClick={() => onDecision(item.id, "duplicate")}
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                Duplicate
              </Button>
            )}
          </div>
        )}

        {isPending && showExcludeForm && (
          <div className="space-y-2 border-t pt-2 mt-2">
            <Select value={exclusionReason} onValueChange={setExclusionReason}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Exclusion reason..." />
              </SelectTrigger>
              <SelectContent>
                {exclusionReasonCategories.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              className="text-sm min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={!exclusionReason || isUpdating}
                onClick={() =>
                  onDecision(item.id, "exclude", exclusionReason, notes)
                }
              >
                Confirm Exclude
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowExcludeForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isPending && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={isUpdating}
            onClick={() => onRevert(item.id)}
          >
            Revert to Pending
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
