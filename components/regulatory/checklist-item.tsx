"use client";

import { CheckCircle2, Circle, AlertCircle, MinusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ChecklistItemStatus } from "@/lib/validators/reporting-checklist";

interface ChecklistItemRowProps {
  itemId: string;
  section: string;
  description: string;
  status: ChecklistItemStatus;
  notes: string;
  pageReference: string;
  picoMapping?: string;
  onStatusChange: (status: ChecklistItemStatus) => void;
  onNotesChange: (notes: string) => void;
  onPageReferenceChange: (pageRef: string) => void;
}

/** Status icon mapping. */
function statusIcon(status: ChecklistItemStatus) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "partial":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "not_applicable":
      return <MinusCircle className="h-4 w-4 text-zinc-500" />;
    default:
      return <Circle className="h-4 w-4 text-zinc-600" />;
  }
}

/**
 * A single checklist item row with status, notes, and page reference.
 */
export function ChecklistItemRow({
  itemId,
  section,
  description,
  status,
  notes,
  pageReference,
  picoMapping,
  onStatusChange,
  onNotesChange,
  onPageReferenceChange,
}: ChecklistItemRowProps) {
  return (
    <div className="group rounded-lg border border-zinc-800 p-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{statusIcon(status)}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-zinc-500 mr-2">
                {itemId}
              </span>
              <span className="text-sm text-zinc-200">{description}</span>
              {picoMapping && (
                <span className="ml-2 text-xs text-blue-400/70">
                  (auto: {picoMapping})
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => onStatusChange(v as ChecklistItemStatus)}
            >
              <SelectTrigger className="h-7 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not started</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="not_applicable">N/A</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Notes..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="h-7 text-xs flex-1 min-w-[120px]"
            />
            <Input
              placeholder="Page"
              value={pageReference}
              onChange={(e) => onPageReferenceChange(e.target.value)}
              className="h-7 text-xs w-[70px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
