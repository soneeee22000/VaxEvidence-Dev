"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, ExternalLink } from "lucide-react";

// =============================================================================
// SYNC STATUS BADGE
// =============================================================================
// Small badge component displayed on evidence cards to indicate the external
// sync source (Zotero, Mendeley). Clicking opens the external URL if available.
// =============================================================================

/** Color and label configuration per external source. */
const SOURCE_CONFIG: Record<
  string,
  { label: string; className: string; url?: (id: string) => string }
> = {
  zotero: {
    label: "Zotero",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
    url: (id: string) => `https://www.zotero.org/search?q=${id}`,
  },
  mendeley: {
    label: "Mendeley",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  },
};

interface SyncStatusBadgeProps {
  /** The external source (e.g., 'zotero', 'mendeley'). */
  externalSource?: string | null;
  /** The external ID in the source system. */
  externalId?: string | null;
}

/**
 * Renders a colored badge showing the sync source.
 * Returns null if no external source is set.
 */
export function SyncStatusBadge({
  externalSource,
  externalId,
}: SyncStatusBadgeProps) {
  if (!externalSource) return null;

  const config = SOURCE_CONFIG[externalSource];
  if (!config) return null;

  const externalUrl = externalId && config.url ? config.url(externalId) : null;

  const badge = (
    <Badge
      variant="outline"
      className={config.className}
      role={externalUrl ? "link" : undefined}
    >
      <BookOpen className="mr-1 h-3 w-3" />
      {config.label}
      {externalUrl && <ExternalLink className="ml-1 h-3 w-3" />}
    </Badge>
  );

  if (externalUrl) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              {badge}
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open in {config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Synced from {config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
