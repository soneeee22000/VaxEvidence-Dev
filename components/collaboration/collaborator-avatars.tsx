"use client";

/**
 * Stacked collaborator avatar circles shown in the protocol header.
 * Displays up to MAX_VISIBLE initials circles with an overflow "+N" badge.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePresence } from "@/lib/collaboration/presence-context";
import {
  COLLABORATOR_BG_CLASSES,
  getUserColorIndex,
} from "@/lib/collaboration/constants";

const MAX_VISIBLE = 5;

/** Extract initials from an email address (e.g. "jane.doe@co.com" -> "JD"). */
function getInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function CollaboratorAvatars() {
  const { collaborators, isConnected } = usePresence();

  if (!isConnected || collaborators.length === 0) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visible.map((c) => {
          const bgClass = COLLABORATOR_BG_CLASSES[getUserColorIndex(c.userId)];
          return (
            <Tooltip key={c.userId}>
              <TooltipTrigger asChild>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white ${bgClass}`}
                >
                  {getInitials(c.email)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{c.email}</p>
                {c.activeField && (
                  <p className="text-xs text-muted-foreground">
                    Editing: {c.activeField}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">
                +{overflow}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                {overflow} more collaborator{overflow > 1 ? "s" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
