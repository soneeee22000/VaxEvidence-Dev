"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Loader2,
  ScrollText,
  Filter,
} from "lucide-react";

// =============================================================================
// AUDIT LOG VIEWER
// =============================================================================
// Client component for viewing compliance audit logs with table display,
// expandable row details, filtering, pagination, and CSV export.
// Communicates with /api/workspaces/[id]/audit-log via fetch().
// =============================================================================

/** Shape of an audit log entry from the API. */
interface AuditLogEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Pagination metadata from the API. */
interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Action options for the filter dropdown. */
const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "export", label: "Export" },
  { value: "login", label: "Login" },
  { value: "api_key.create", label: "API Key Create" },
  { value: "api_key.revoke", label: "API Key Revoke" },
  { value: "webhook.create", label: "Webhook Create" },
  { value: "sso.configure", label: "SSO Configure" },
];

/** Resource type options for the filter dropdown. */
const RESOURCE_TYPE_OPTIONS = [
  { value: "all", label: "All Resources" },
  { value: "protocol", label: "Protocol" },
  { value: "evidence", label: "Evidence" },
  { value: "dataset", label: "Dataset" },
  { value: "api_key", label: "API Key" },
  { value: "webhook", label: "Webhook" },
  { value: "sso_config", label: "SSO Config" },
];

/** Color mapping for action badges. */
const ACTION_BADGE_CLASSES: Record<string, string> = {
  create: "border-green-500/50 bg-green-500/10 text-green-400",
  update: "border-primary/50 bg-primary/10 text-primary",
  delete: "border-red-500/50 bg-red-500/10 text-red-400",
  export: "border-muted-foreground/50 bg-muted text-muted-foreground",
  login: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
};

interface AuditLogViewerProps {
  /** The workspace ID to display audit logs for. */
  workspaceId: string;
}

/**
 * Formats an ISO date string to a compact locale string.
 */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Truncates a user ID for display purposes.
 */
function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...`;
}

/**
 * Gets the badge class for an action, falling back to a default style.
 */
function getActionBadgeClass(action: string): string {
  const baseAction = action.split(".")[0];
  return (
    ACTION_BADGE_CLASSES[baseAction] ??
    "border-zinc-500/50 bg-zinc-500/10 text-zinc-400"
  );
}

export function AuditLogViewer({ workspaceId }: AuditLogViewerProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Filter state */
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [resourceIdSearch, setResourceIdSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const basePath = `/api/workspaces/${workspaceId}/audit-log`;

  /**
   * Fetches audit logs from the API with current filters and page.
   */
  const loadLogs = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("per_page", "25");

        if (actionFilter !== "all") params.set("action", actionFilter);
        if (resourceTypeFilter !== "all")
          params.set("resource_type", resourceTypeFilter);
        if (resourceIdSearch.trim())
          params.set("resource_id", resourceIdSearch.trim());
        if (fromDate) params.set("from_date", fromDate);
        if (toDate) params.set("to_date", toDate);

        const res = await fetch(`${basePath}?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "Failed to load audit logs",
          );
        }

        const json = (await res.json()) as {
          data: AuditLogEntry[];
          pagination: PaginationInfo;
        };
        setEntries(json.data);
        setPagination(json.pagination);
      } catch (err) {
        toast.error("Failed to load audit logs", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      basePath,
      actionFilter,
      resourceTypeFilter,
      resourceIdSearch,
      fromDate,
      toDate,
    ],
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  /**
   * Exports all visible audit log entries as a CSV download.
   */
  async function handleExportCsv() {
    try {
      /* Fetch up to 1000 entries for CSV export. */
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("per_page", "1000");

      if (actionFilter !== "all") params.set("action", actionFilter);
      if (resourceTypeFilter !== "all")
        params.set("resource_type", resourceTypeFilter);
      if (resourceIdSearch.trim())
        params.set("resource_id", resourceIdSearch.trim());
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);

      const res = await fetch(`${basePath}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data for export");

      const json = (await res.json()) as { data: AuditLogEntry[] };

      /* Build CSV content. */
      const headers = [
        "Timestamp",
        "User ID",
        "Action",
        "Resource Type",
        "Resource ID",
        "IP Address",
        "User Agent",
      ];
      const rows = json.data.map((entry) => [
        entry.created_at,
        entry.user_id,
        entry.action,
        entry.resource_type,
        entry.resource_id ?? "",
        entry.ip_address ?? "",
        `"${(entry.user_agent ?? "").replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );

      /* Download the CSV. */
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Audit log exported");
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  /**
   * Resets all filters and reloads page 1.
   */
  function handleClearFilters() {
    setActionFilter("all");
    setResourceTypeFilter("all");
    setResourceIdSearch("");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              Immutable record of all compliance-relevant events in this
              workspace
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Action filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Resource type filter */}
            <Select
              value={resourceTypeFilter}
              onValueChange={setResourceTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Resource ID search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Resource ID..."
                value={resourceIdSearch}
                onChange={(e) => setResourceIdSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Date range */}
            <Input
              type="date"
              placeholder="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Clear filters button */}
          {(actionFilter !== "all" ||
            resourceTypeFilter !== "all" ||
            resourceIdSearch ||
            fromDate ||
            toDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading audit logs...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No audit log entries
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Audit events will appear here as actions are performed in the
              workspace. Try adjusting your filters if you expect results.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && entries.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Resource ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <>
                    {/* Main row */}
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === entry.id ? null : entry.id,
                        )
                      }
                    >
                      <TableCell>
                        {expandedId === entry.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateId(entry.user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getActionBadgeClass(entry.action),
                          )}
                        >
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.resource_type}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.resource_id
                          ? truncateId(entry.resource_id)
                          : "-"}
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {expandedId === entry.id && (
                      <TableRow key={`${entry.id}-details`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-3 text-xs">
                            {/* Full IDs */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Full User ID:
                                </span>{" "}
                                <span className="font-mono">
                                  {entry.user_id}
                                </span>
                              </div>
                              {entry.resource_id && (
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Full Resource ID:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {entry.resource_id}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* IP & User Agent */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  IP Address:
                                </span>{" "}
                                {entry.ip_address ?? "N/A"}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  User Agent:
                                </span>{" "}
                                <span className="break-all">
                                  {entry.user_agent ?? "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Changes diff */}
                            {entry.changes && (
                              <div className="space-y-2">
                                <span className="font-medium text-muted-foreground">
                                  Changes:
                                </span>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {entry.changes.before && (
                                    <div>
                                      <p className="font-medium text-red-400 mb-1">
                                        Before:
                                      </p>
                                      <pre className="overflow-auto rounded-md bg-background p-2 text-xs">
                                        {JSON.stringify(
                                          entry.changes.before,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                  {entry.changes.after && (
                                    <div>
                                      <p className="font-medium text-green-400 mb-1">
                                        After:
                                      </p>
                                      <pre className="overflow-auto rounded-md bg-background p-2 text-xs">
                                        {JSON.stringify(
                                          entry.changes.after,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            {Object.keys(entry.metadata).length > 0 && (
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Metadata:
                                </span>
                                <pre className="mt-1 overflow-auto rounded-md bg-background p-2 text-xs">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.per_page + 1}
                {" - "}
                {Math.min(
                  pagination.page * pagination.per_page,
                  pagination.total,
                )}{" "}
                of {pagination.total} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => loadLogs(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
