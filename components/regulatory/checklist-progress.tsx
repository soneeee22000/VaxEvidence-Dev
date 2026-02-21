"use client";

import type { ChecklistItemStatus } from "@/lib/validators/reporting-checklist";

interface ChecklistProgressProps {
  items: Array<{ status: ChecklistItemStatus }>;
  total: number;
}

/**
 * Visual progress bar for checklist completion.
 */
export function ChecklistProgress({ items, total }: ChecklistProgressProps) {
  const complete = items.filter((i) => i.status === "complete").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const na = items.filter((i) => i.status === "not_applicable").length;
  const done = complete + na;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {done}/{total} items completed
        </span>
        <span className="font-medium text-zinc-200">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
        {complete > 0 && (
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(complete / total) * 100}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${(partial / total) * 100}%` }}
          />
        )}
        {na > 0 && (
          <div
            className="h-full bg-zinc-600 transition-all"
            style={{ width: `${(na / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Complete ({complete})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
          Partial ({partial})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
          N/A ({na})
        </span>
      </div>
    </div>
  );
}
