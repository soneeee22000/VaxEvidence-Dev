"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  versionNumber: number;
  isSigned?: boolean;
  isCurrent?: boolean;
  className?: string;
}

/**
 * Compact version badge displaying v{N} with status-based colors.
 * Signed versions show green, current version shows blue, others show muted.
 */
export function VersionBadge({
  versionNumber,
  isSigned = false,
  isCurrent = false,
  className,
}: VersionBadgeProps) {
  return (
    <Badge
      variant={isSigned ? "default" : "outline"}
      className={cn(
        "text-xs font-mono",
        isSigned && "bg-green-600 hover:bg-green-700 text-white",
        isCurrent && !isSigned && "border-blue-500 text-blue-500",
        className,
      )}
    >
      v{versionNumber}
      {isSigned && " (signed)"}
    </Badge>
  );
}
