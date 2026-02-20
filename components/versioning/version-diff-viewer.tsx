"use client";

import { useState, useEffect } from "react";
import { diffWords } from "diff";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProtocolVersionDiff } from "@/lib/validators/protocol-version";

interface VersionDiffViewerProps {
  protocolId: string;
  versionAId: string;
  versionBId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Side-by-side field-by-field diff viewer with word-level highlighting.
 * Fetches the diff from the compare API endpoint.
 */
export function VersionDiffViewer({
  protocolId,
  versionAId,
  versionBId,
  open,
  onOpenChange,
}: VersionDiffViewerProps) {
  const [diff, setDiff] = useState<ProtocolVersionDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchDiff = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/protocols/${protocolId}/versions/compare?a=${versionAId}&b=${versionBId}`,
        );
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Failed to compare versions");
        }
        const json = await res.json();
        setDiff(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [open, protocolId, versionAId, versionBId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {diff
              ? `Compare v${diff.versionA} vs v${diff.versionB}`
              : "Compare Versions"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading diff...</p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {diff && (
          <div className="space-y-4">
            {diff.fields.map((field) => (
              <div key={field.field} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.changed ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Changed
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Unchanged
                    </span>
                  )}
                </div>
                {field.changed ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded border bg-red-50 dark:bg-red-950/20 text-sm">
                      <WordDiff
                        oldValue={field.oldValue}
                        newValue={field.newValue}
                        side="old"
                      />
                    </div>
                    <div className="p-2 rounded border bg-green-50 dark:bg-green-950/20 text-sm">
                      <WordDiff
                        oldValue={field.oldValue}
                        newValue={field.newValue}
                        side="new"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded border bg-muted/50 text-sm text-muted-foreground">
                    {field.oldValue || "(empty)"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders word-level diff highlighting for one side of the comparison.
 */
function WordDiff({
  oldValue,
  newValue,
  side,
}: {
  oldValue: string;
  newValue: string;
  side: "old" | "new";
}) {
  const changes = diffWords(oldValue, newValue);

  return (
    <span>
      {changes.map((change, i) => {
        if (change.added && side === "new") {
          return (
            <span
              key={i}
              className="bg-green-200 dark:bg-green-800 rounded px-0.5"
            >
              {change.value}
            </span>
          );
        }
        if (change.removed && side === "old") {
          return (
            <span
              key={i}
              className={cn(
                "bg-red-200 dark:bg-red-800 rounded px-0.5",
                "line-through",
              )}
            >
              {change.value}
            </span>
          );
        }
        if (!change.added && !change.removed) {
          return <span key={i}>{change.value}</span>;
        }
        return null;
      })}
    </span>
  );
}
