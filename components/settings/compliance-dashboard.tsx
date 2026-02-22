"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// COMPLIANCE DASHBOARD
// =============================================================================
// Client component that fetches and displays compliance status from
// /api/workspaces/[id]/compliance. Shows a categorized checklist grid
// with pass/warn/fail badges and an overall compliance score.
// =============================================================================

/** Status values for compliance checks. */
type CheckStatus = "pass" | "warn" | "fail";

/** A single compliance check from the API. */
interface ComplianceCheck {
  name: string;
  status: CheckStatus;
  description: string;
  category: string;
}

/** Status badge configuration. */
const STATUS_CONFIG: Record<
  CheckStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className: "border-green-500/50 bg-green-500/10 text-green-400",
  },
  warn: {
    label: "Warning",
    icon: AlertTriangle,
    className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  },
  fail: {
    label: "Fail",
    icon: XCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-400",
  },
};

/** Ordered categories for grouping. */
const CATEGORY_ORDER = [
  "Security",
  "Data Protection",
  "Audit Trail",
  "Access Control",
];

interface ComplianceDashboardProps {
  /** The workspace ID to display compliance data for. */
  workspaceId: string;
}

export function ComplianceDashboard({ workspaceId }: ComplianceDashboardProps) {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches compliance checks from the API.
   */
  const loadCompliance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/compliance`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Failed to load compliance status",
        );
      }

      const json = (await res.json()) as {
        data: { checks: ComplianceCheck[] };
      };
      setChecks(json.data.checks);
    } catch (err) {
      toast.error("Failed to load compliance status", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);

  /**
   * Group checks by category for organized display.
   */
  const groupedChecks = CATEGORY_ORDER.map((category) => ({
    category,
    checks: checks.filter((c) => c.category === category),
  })).filter((group) => group.checks.length > 0);

  /**
   * Calculate overall compliance score as percentage of passing checks.
   */
  const totalChecks = checks.length;
  const passingChecks = checks.filter((c) => c.status === "pass").length;
  const scorePercent =
    totalChecks > 0 ? Math.round((passingChecks / totalChecks) * 100) : 0;

  /**
   * Get the color class for the overall score.
   */
  function getScoreColor(): string {
    if (scorePercent >= 80) return "text-green-400";
    if (scorePercent >= 50) return "text-yellow-400";
    return "text-red-400";
  }

  /* Loading state */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Compliance Dashboard
            </CardTitle>
            <CardDescription>Loading compliance status...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score skeleton */}
            <div className="flex items-center justify-center py-6">
              <Skeleton className="h-20 w-20 rounded-full" />
            </div>
            {/* Check skeletons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card with overall score */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Compliance Dashboard
            </CardTitle>
            <CardDescription>
              Overview of security, data protection, and audit compliance for
              this workspace
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCompliance}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Overall score */}
          <div className="flex items-center justify-center gap-6 py-4 border-b mb-6">
            <div className="text-center">
              <p
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  getScoreColor(),
                )}
              >
                {scorePercent}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compliance Score
              </p>
            </div>
            <div className="text-left space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                {passingChecks} passing
              </p>
              <p className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                {checks.filter((c) => c.status === "warn").length} warnings
              </p>
              <p className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                {checks.filter((c) => c.status === "fail").length} failing
              </p>
            </div>
          </div>

          {/* Categorized check grid */}
          <div className="space-y-6">
            {groupedChecks.map(({ category, checks: categoryChecks }) => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3">{category}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {categoryChecks.map((check) => {
                    const config = STATUS_CONFIG[check.status];
                    const StatusIcon = config.icon;

                    return (
                      <div
                        key={check.name}
                        className="rounded-lg border border-border p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                check.status === "pass" && "text-green-400",
                                check.status === "warn" && "text-yellow-400",
                                check.status === "fail" && "text-red-400",
                              )}
                            />
                            <span className="text-sm font-medium">
                              {check.name}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs shrink-0", config.className)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          {check.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
