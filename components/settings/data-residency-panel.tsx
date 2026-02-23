"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  FIELD_CLASSIFICATIONS,
  classificationLevels,
  getClassificationSummary,
  type ClassificationLevel,
} from "@/lib/security/data-classification";
import { Globe, ExternalLink, Database, Lock } from "lucide-react";

// =============================================================================
// DATA RESIDENCY PANEL
// =============================================================================
// Informational panel showing data residency configuration and field-level
// data classification summary for compliance transparency. Data residency
// is configured at the Supabase project level — this panel provides
// visibility into the current setup.
// =============================================================================

/** Color mapping for classification level badges. */
const CLASSIFICATION_BADGE_CLASSES: Record<ClassificationLevel, string> = {
  public: "border-green-500/50 bg-green-500/10 text-green-400",
  internal: "border-primary/50 bg-primary/10 text-primary",
  confidential: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  phi: "border-red-500/50 bg-red-500/10 text-red-400",
};

/** Human-readable labels for classification levels. */
const CLASSIFICATION_LABELS: Record<ClassificationLevel, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  phi: "PHI",
};

/** Human-readable labels for resource types. */
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  protocols: "Protocols",
  evidence_items: "Evidence Items",
  datasets: "Datasets",
  screening_decisions: "Screening Decisions",
};

interface DataResidencyPanelProps {
  /** The workspace ID (for future region-specific queries). */
  workspaceId: string;
}

export function DataResidencyPanel({ workspaceId }: DataResidencyPanelProps) {
  /**
   * Compute classification summaries for all resource types.
   */
  const classificationSummaries = useMemo(() => {
    return Object.keys(FIELD_CLASSIFICATIONS).map((resourceType) => ({
      resourceType,
      label: RESOURCE_TYPE_LABELS[resourceType] ?? resourceType,
      summary: getClassificationSummary(resourceType),
      fields: FIELD_CLASSIFICATIONS[resourceType],
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Region info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Data Residency
          </CardTitle>
          <CardDescription>
            Data storage region and residency configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Database className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Region: Configured at Supabase Project Level
              </p>
              <p className="text-xs text-muted-foreground">
                Data residency, including the geographic region where your
                database and storage are hosted, is managed through your
                Supabase project settings. The region is selected at project
                creation and determines where all data at rest resides.
              </p>
              <a
                href="https://supabase.com/dashboard/project/_/settings/general"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Supabase Dashboard to view region settings
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Encryption at Rest</p>
              <p className="text-xs text-muted-foreground">
                All data stored in Supabase PostgreSQL is encrypted at rest
                using AES-256. File storage (datasets, attachments) uses
                server-side encryption. Data in transit is protected by TLS
                1.2+.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Field-Level Data Classification
          </CardTitle>
          <CardDescription>
            Classification of fields per resource type for export filtering and
            access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-2">
            {classificationLevels.map((level) => (
              <Badge
                key={level}
                variant="outline"
                className={cn("text-xs", CLASSIFICATION_BADGE_CLASSES[level])}
              >
                {CLASSIFICATION_LABELS[level]}
              </Badge>
            ))}
          </div>

          {/* Summary table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource Type</TableHead>
                {classificationLevels.map((level) => (
                  <TableHead key={level} className="text-center">
                    {CLASSIFICATION_LABELS[level]}
                  </TableHead>
                ))}
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificationSummaries.map(
                ({ resourceType, label, summary }) => {
                  const total = summary
                    ? Object.values(summary).reduce((a, b) => a + b, 0)
                    : 0;

                  return (
                    <TableRow key={resourceType}>
                      <TableCell className="text-sm font-medium">
                        {label}
                      </TableCell>
                      {classificationLevels.map((level) => (
                        <TableCell key={level} className="text-center text-xs">
                          {summary?.[level] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-xs font-medium">
                        {total}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
            </TableBody>
          </Table>

          {/* Detailed field listing */}
          <div className="mt-6 space-y-4">
            {classificationSummaries.map(({ resourceType, label, fields }) => (
              <details key={resourceType} className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {label} field details
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(fields).map(([field, level]) => (
                    <div
                      key={field}
                      className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                    >
                      <span className="font-mono text-xs">{field}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          CLASSIFICATION_BADGE_CLASSES[level],
                        )}
                      >
                        {level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
