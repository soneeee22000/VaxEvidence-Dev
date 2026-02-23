"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  IntegrationProvider,
  IntegrationRecord,
} from "@/lib/validators/integration";
import {
  BookOpen,
  Database,
  FileSpreadsheet,
  Loader2,
  Plug,
  RefreshCw,
  Settings2,
  Trash2,
  Unplug,
  Eye,
} from "lucide-react";

// =============================================================================
// INTEGRATION PANEL
// =============================================================================
// Full management panel for Zotero, Mendeley, and REDCap integrations.
// Lists connected integrations, provides config dialogs, and sync controls.
// Communicates with /api/integrations/* routes via fetch().
// =============================================================================

/** Provider display configuration. */
const PROVIDER_CONFIG: Record<
  IntegrationProvider,
  {
    label: string;
    description: string;
    icon: typeof BookOpen;
    color: string;
  }
> = {
  zotero: {
    label: "Zotero",
    description:
      "Sync your Zotero library with VaxEvidence for seamless reference management.",
    icon: BookOpen,
    color: "text-primary",
  },
  mendeley: {
    label: "Mendeley",
    description:
      "Connect your Mendeley library for bidirectional reference synchronization.",
    icon: BookOpen,
    color: "text-primary",
  },
  redcap: {
    label: "REDCap",
    description:
      "Import clinical data from REDCap projects directly into VaxEvidence datasets.",
    icon: Database,
    color: "text-primary",
  },
};

interface IntegrationPanelProps {
  workspaceId: string;
}

// =============================================================================
// Zotero Config Dialog
// =============================================================================

function ZoteroConfigDialog({
  workspaceId,
  existing,
  onSaved,
}: {
  workspaceId: string;
  existing?: IntegrationRecord | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(
    (existing?.credentials?.api_key as string) ?? "",
  );
  const [userId, setUserId] = useState(
    (existing?.credentials?.user_id as string) ?? "",
  );
  const [saving, setSaving] = useState(false);

  /** Save or update the Zotero integration credentials. */
  const handleSave = useCallback(async () => {
    if (!apiKey.trim() || !userId.trim()) {
      toast.error("API Key and User ID are required.");
      return;
    }
    setSaving(true);
    try {
      const url = existing
        ? `/api/workspaces/${workspaceId}/integrations/${existing.id}`
        : `/api/workspaces/${workspaceId}/integrations`;

      const body = existing
        ? { credentials: { api_key: apiKey, user_id: userId } }
        : {
            provider: "zotero",
            display_name: "Zotero",
            credentials: { api_key: apiKey, user_id: userId },
          };

      const res = await fetch(url, {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save integration");
      }

      toast.success(
        existing
          ? "Zotero credentials updated."
          : "Zotero integration connected.",
      );
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [apiKey, userId, workspaceId, existing, onSaved]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {existing ? "Configure" : "Connect"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Zotero Integration</DialogTitle>
          <DialogDescription>
            Enter your Zotero API key and User ID. You can find these at{" "}
            <a
              href="https://www.zotero.org/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              zotero.org/settings/keys
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="zotero-api-key">API Key</Label>
            <Input
              id="zotero-api-key"
              type="password"
              placeholder="Enter your Zotero API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zotero-user-id">User ID</Label>
            <Input
              id="zotero-user-id"
              placeholder="Enter your Zotero User ID (numeric)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Update" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Mendeley Config Dialog
// =============================================================================

function MendeleyConfigDialog({
  workspaceId,
  existing,
  onSaved,
}: {
  workspaceId: string;
  existing?: IntegrationRecord | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(
    (existing?.credentials?.access_token as string) ?? "",
  );
  const [saving, setSaving] = useState(false);

  /** Save or update the Mendeley integration credentials. */
  const handleSave = useCallback(async () => {
    if (!accessToken.trim()) {
      toast.error("Access token is required.");
      return;
    }
    setSaving(true);
    try {
      const url = existing
        ? `/api/workspaces/${workspaceId}/integrations/${existing.id}`
        : `/api/workspaces/${workspaceId}/integrations`;

      const body = existing
        ? { credentials: { access_token: accessToken } }
        : {
            provider: "mendeley",
            display_name: "Mendeley",
            credentials: { access_token: accessToken },
          };

      const res = await fetch(url, {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save integration");
      }

      toast.success(
        existing
          ? "Mendeley token updated."
          : "Mendeley integration connected.",
      );
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [accessToken, workspaceId, existing, onSaved]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {existing ? "Configure" : "Connect"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Mendeley Integration</DialogTitle>
          <DialogDescription>
            Enter your Mendeley access token. You can generate one from the
            Mendeley developer portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mendeley-token">Access Token</Label>
            <Input
              id="mendeley-token"
              type="password"
              placeholder="Enter your Mendeley access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Update" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// REDCap Import Dialog
// =============================================================================

interface REDCapPreviewData {
  metadata: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
  }>;
  sample_records: Record<string, string>[];
  total_records: number;
  suggested_mapping: {
    fieldMap: Record<string, string>;
    dateFields: string[];
    numericFields: string[];
  };
}

function REDCapImportDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [projectName, setProjectName] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<REDCapPreviewData | null>(null);

  /** Preview REDCap data before import. */
  const handlePreview = useCallback(async () => {
    if (!apiUrl.trim() || !apiToken.trim()) {
      toast.error("API URL and API Token are required.");
      return;
    }
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await fetch("/api/integrations/redcap/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_url: apiUrl, api_token: apiToken }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Preview failed");
      }
      const { data } = await res.json();
      setPreview(data);
      toast.success(`Found ${data.total_records} records.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }, [apiUrl, apiToken]);

  /** Import REDCap data as a VaxEvidence dataset. */
  const handleImport = useCallback(async () => {
    if (!apiUrl.trim() || !apiToken.trim()) {
      toast.error("API URL and API Token are required.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/integrations/redcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_url: apiUrl,
          api_token: apiToken,
          project_name: projectName || "REDCap Project",
          mapping_config: preview?.suggested_mapping,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Import failed");
      }
      const { data } = await res.json();
      toast.success(`Imported ${data.row_count} records as dataset.`);
      setOpen(false);
      setPreview(null);
      setApiUrl("");
      setApiToken("");
      setProjectName("");
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [apiUrl, apiToken, projectName, preview, onImported]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from REDCap</DialogTitle>
          <DialogDescription>
            Enter your REDCap API endpoint and token to preview and import
            project data into VaxEvidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="redcap-url">API URL</Label>
            <Input
              id="redcap-url"
              placeholder="https://redcap.example.edu/api/"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redcap-token">API Token</Label>
            <Input
              id="redcap-token"
              type="password"
              placeholder="Enter your REDCap API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redcap-project-name">Project Name (optional)</Label>
            <Input
              id="redcap-project-name"
              placeholder="My REDCap Study"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* Preview button */}
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={previewing || !apiUrl || !apiToken}
            className="gap-2"
          >
            {previewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Preview Data
          </Button>

          {/* Preview results */}
          {preview && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {preview.total_records} records, {preview.metadata.length}{" "}
                  fields
                </p>
                <Badge variant="secondary">
                  {Object.keys(preview.suggested_mapping.fieldMap).length}{" "}
                  mapped fields
                </Badge>
              </div>

              {/* Field mapping table */}
              <div className="max-h-48 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>REDCap Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mapped To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.metadata.slice(0, 20).map((field) => (
                      <TableRow key={field.field_name}>
                        <TableCell className="font-mono text-xs">
                          {field.field_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {field.field_type}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {preview.suggested_mapping.fieldMap[
                            field.field_name
                          ] ?? field.field_name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Sample records preview */}
              {preview.sample_records.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(preview.sample_records[0])
                          .slice(0, 6)
                          .map((key) => (
                            <TableHead key={key} className="font-mono text-xs">
                              {key}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sample_records.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row)
                            .slice(0, 6)
                            .map((val, j) => (
                              <TableCell key={j} className="text-xs">
                                {val || "-"}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !apiUrl || !apiToken}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function IntegrationPanel({ workspaceId }: IntegrationPanelProps) {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  /** Load integrations from the server. */
  const loadIntegrations = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`);
      if (res.ok) {
        const { data } = await res.json();
        setIntegrations(data ?? []);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  /** Find an existing integration record for a provider. */
  const getIntegration = (
    provider: IntegrationProvider,
  ): IntegrationRecord | undefined =>
    integrations.find((i) => i.provider === provider && i.is_active);

  /** Trigger sync for a reference manager integration. */
  const handleSync = useCallback(
    async (provider: "zotero" | "mendeley") => {
      setSyncing(provider);
      try {
        const res = await fetch(`/api/integrations/${provider}/sync`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Sync failed");
        }
        const { data } = await res.json();
        toast.success(
          `Sync complete: ${data.pulled} pulled, ${data.pushed} pushed`,
        );
        loadIntegrations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sync failed");
      } finally {
        setSyncing(null);
      }
    },
    [loadIntegrations],
  );

  /** Disconnect (delete) an integration. */
  const handleDisconnect = useCallback(
    async (integration: IntegrationRecord) => {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/integrations/${integration.id}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Disconnect failed");
        }
        toast.success(
          `${PROVIDER_CONFIG[integration.provider].label} disconnected.`,
        );
        loadIntegrations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Disconnect failed");
      }
    },
    [workspaceId, loadIntegrations],
  );

  /** Format a timestamp for display. */
  const formatLastSynced = (isoString: string | null): string => {
    if (!isoString) return "Never";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading integrations...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Tool Integrations</CardTitle>
        <CardDescription>
          Connect VaxEvidence with external research tools for seamless data
          synchronization and import.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference Managers */}
        {(["zotero", "mendeley"] as const).map((provider) => {
          const config = PROVIDER_CONFIG[provider];
          const integration = getIntegration(provider);
          const Icon = config.icon;
          const isSyncing = syncing === provider;

          return (
            <div
              key={provider}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
                    config.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    {integration ? (
                      <Badge
                        variant="default"
                        className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      >
                        <Plug className="mr-1 h-3 w-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Unplug className="mr-1 h-3 w-3" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                  {integration?.last_synced_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last synced:{" "}
                      {formatLastSynced(integration.last_synced_at)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {integration && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleSync(provider)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(integration)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {provider === "zotero" ? (
                  <ZoteroConfigDialog
                    workspaceId={workspaceId}
                    existing={integration}
                    onSaved={loadIntegrations}
                  />
                ) : (
                  <MendeleyConfigDialog
                    workspaceId={workspaceId}
                    existing={integration}
                    onSaved={loadIntegrations}
                  />
                )}
              </div>
            </div>
          );
        })}

        <Separator />

        {/* REDCap */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
                PROVIDER_CONFIG.redcap.color,
              )}
            >
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {PROVIDER_CONFIG.redcap.label}
                </span>
                <Badge variant="secondary">Data Import</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {PROVIDER_CONFIG.redcap.description}
              </p>
            </div>
          </div>

          <REDCapImportDialog onImported={loadIntegrations} />
        </div>
      </CardContent>
    </Card>
  );
}
