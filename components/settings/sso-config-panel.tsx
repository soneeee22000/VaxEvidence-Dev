"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ssoDefaultRoles,
  type SsoConfigRecord,
  type SsoDefaultRole,
} from "@/lib/validators/sso";
import {
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Globe,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";

// =============================================================================
// SSO CONFIGURATION PANEL
// =============================================================================
// Full CRUD interface for workspace SAML SSO configurations: list, create,
// edit, toggle, test, delete. Communicates with /api/workspaces/[id]/sso/*
// routes via fetch(). Follows the same patterns as webhook-manager.tsx.
// =============================================================================

/** Human-readable labels for default roles. */
const ROLE_LABELS: Record<SsoDefaultRole, string> = {
  admin: "Admin",
  lead: "Lead",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

/** Color mapping for role badges. */
const ROLE_BADGE_CLASSES: Record<SsoDefaultRole, string> = {
  admin: "border-red-500/50 bg-red-500/10 text-red-400",
  lead: "border-primary/50 bg-primary/10 text-primary",
  reviewer: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  viewer: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
};

interface SsoConfigPanelProps {
  /** The workspace ID to manage SSO configurations for. */
  workspaceId: string;
}

/**
 * Formats an ISO date string to a user-friendly locale string.
 */
function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SsoConfigPanel({ workspaceId }: SsoConfigPanelProps) {
  const [configs, setConfigs] = useState<SsoConfigRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Create dialog state */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [createMetadataUrl, setCreateMetadataUrl] = useState("");
  const [createMetadataXml, setCreateMetadataXml] = useState("");
  const [createMetadataTab, setCreateMetadataTab] = useState("url");
  const [createAutoProvision, setCreateAutoProvision] = useState(true);
  const [createDefaultRole, setCreateDefaultRole] =
    useState<SsoDefaultRole>("viewer");
  const [createEnforceSSO, setCreateEnforceSSO] = useState(false);
  const [createAttrKeys, setCreateAttrKeys] = useState<
    { key: string; value: string }[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);

  /* Edit dialog state */
  const [editTarget, setEditTarget] = useState<SsoConfigRecord | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editMetadataUrl, setEditMetadataUrl] = useState("");
  const [editMetadataXml, setEditMetadataXml] = useState("");
  const [editAutoProvision, setEditAutoProvision] = useState(true);
  const [editDefaultRole, setEditDefaultRole] =
    useState<SsoDefaultRole>("viewer");
  const [editEnforceSSO, setEditEnforceSSO] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  /* Delete confirmation dialog state */
  const [deleteTarget, setDeleteTarget] = useState<SsoConfigRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  /* Test state */
  const [testingId, setTestingId] = useState<string | null>(null);

  const basePath = `/api/workspaces/${workspaceId}/sso`;

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  /**
   * Fetch all SSO configurations for the workspace.
   */
  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(basePath);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Failed to load SSO configurations",
        );
      }
      const { data } = (await res.json()) as { data: SsoConfigRecord[] };
      setConfigs(data);
    } catch (err) {
      toast.error("Failed to load SSO configurations", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Add a new attribute mapping key-value pair.
   */
  function addAttrMapping() {
    setCreateAttrKeys((prev) => [...prev, { key: "", value: "" }]);
  }

  /**
   * Remove an attribute mapping pair by index.
   */
  function removeAttrMapping(index: number) {
    setCreateAttrKeys((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Update an attribute mapping pair.
   */
  function updateAttrMapping(
    index: number,
    field: "key" | "value",
    val: string,
  ) {
    setCreateAttrKeys((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  }

  /**
   * Handles SSO configuration creation via POST.
   */
  async function handleCreate() {
    if (!createDisplayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!createDomain.trim()) {
      toast.error("Domain is required");
      return;
    }

    setIsCreating(true);
    try {
      /* Build attribute mapping from key-value pairs. */
      const attributeMapping: Record<string, string> = {};
      for (const pair of createAttrKeys) {
        if (pair.key.trim() && pair.value.trim()) {
          attributeMapping[pair.key.trim()] = pair.value.trim();
        }
      }

      const body: Record<string, unknown> = {
        display_name: createDisplayName.trim(),
        domain: createDomain.trim().toLowerCase(),
        auto_provision: createAutoProvision,
        default_role: createDefaultRole,
        enforce_sso: createEnforceSSO,
      };

      if (createMetadataTab === "url" && createMetadataUrl.trim()) {
        body.metadata_url = createMetadataUrl.trim();
      } else if (createMetadataTab === "xml" && createMetadataXml.trim()) {
        body.metadata_xml = createMetadataXml.trim();
      }

      if (Object.keys(attributeMapping).length > 0) {
        body.attribute_mapping = attributeMapping;
      }

      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(
          (responseBody as { error?: string }).error ??
            "Failed to create SSO configuration",
        );
      }

      const responseData = (await res.json()) as {
        data: SsoConfigRecord;
        warning?: string;
      };

      if (responseData.warning) {
        toast.warning("SSO provider not registered", {
          description: responseData.warning,
        });
      } else {
        toast.success("SSO configuration created");
      }

      handleCreateDialogClose(false);
      await loadConfigs();
    } catch (err) {
      toast.error("Failed to create SSO configuration", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  /**
   * Resets the create dialog state when closing.
   */
  function handleCreateDialogClose(open: boolean) {
    setIsCreateOpen(open);
    if (!open) {
      setCreateDisplayName("");
      setCreateDomain("");
      setCreateMetadataUrl("");
      setCreateMetadataXml("");
      setCreateMetadataTab("url");
      setCreateAutoProvision(true);
      setCreateDefaultRole("viewer");
      setCreateEnforceSSO(false);
      setCreateAttrKeys([]);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  /**
   * Opens the edit dialog pre-filled with a config's current values.
   */
  function openEditDialog(config: SsoConfigRecord) {
    setEditTarget(config);
    setEditDisplayName(config.display_name);
    setEditDomain(config.domain);
    setEditMetadataUrl(config.metadata_url ?? "");
    setEditMetadataXml(config.metadata_xml ?? "");
    setEditAutoProvision(config.auto_provision);
    setEditDefaultRole(config.default_role);
    setEditEnforceSSO(config.enforce_sso);
    setEditIsActive(config.is_active);
  }

  /**
   * Handles SSO configuration update via PATCH.
   */
  async function handleEdit() {
    if (!editTarget) return;
    if (!editDisplayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch(`${basePath}/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: editDisplayName.trim(),
          domain: editDomain.trim().toLowerCase(),
          metadata_url: editMetadataUrl.trim() || null,
          metadata_xml: editMetadataXml.trim() || null,
          auto_provision: editAutoProvision,
          default_role: editDefaultRole,
          enforce_sso: editEnforceSSO,
          is_active: editIsActive,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Failed to update SSO configuration",
        );
      }

      toast.success("SSO configuration updated");
      setEditTarget(null);
      await loadConfigs();
    } catch (err) {
      toast.error("Failed to update SSO configuration", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsEditing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Toggle active
  // ---------------------------------------------------------------------------

  /**
   * Toggles the active state of an SSO configuration.
   */
  async function handleToggleActive(config: SsoConfigRecord) {
    try {
      const res = await fetch(`${basePath}/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !config.is_active }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to toggle status",
        );
      }

      toast.success(
        config.is_active
          ? "SSO configuration disabled"
          : "SSO configuration enabled",
      );
      await loadConfigs();
    } catch (err) {
      toast.error("Failed to toggle status", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Handles SSO configuration deletion via DELETE.
   */
  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${basePath}/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Failed to delete SSO configuration",
        );
      }

      toast.success("SSO configuration deleted", {
        description: `SSO for "${deleteTarget.domain}" has been permanently deleted.`,
      });

      setDeleteTarget(null);
      await loadConfigs();
    } catch (err) {
      toast.error("Failed to delete SSO configuration", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Test connection
  // ---------------------------------------------------------------------------

  /**
   * Tests that the metadata URL is reachable.
   */
  async function handleTestConnection(config: SsoConfigRecord) {
    if (!config.metadata_url) {
      toast.error("No metadata URL configured to test");
      return;
    }

    setTestingId(config.id);
    try {
      const res = await fetch(config.metadata_url, {
        method: "GET",
        mode: "no-cors",
      });

      /* In no-cors mode we get an opaque response, so we can only confirm
       * the request did not throw. That is enough for a basic reachability test. */
      toast.success("Metadata URL is reachable", {
        description:
          "The IdP metadata endpoint responded. Verify the XML content is valid SAML metadata.",
      });
    } catch {
      toast.error("Metadata URL is not reachable", {
        description:
          "Could not connect to the IdP metadata endpoint. Check the URL and ensure the server is accessible.",
      });
    } finally {
      setTestingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Enterprise warning banner */}
      <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-400">
          SAML SSO requires Supabase Enterprise plan. Configuration will be
          saved but SSO login will not work until Enterprise is enabled.
        </p>
      </div>

      {/* Header card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>SAML SSO</CardTitle>
            <CardDescription>
              Configure Single Sign-On with your organization&apos;s identity
              provider for streamlined access
            </CardDescription>
          </div>

          {/* Create SSO Config Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add SSO Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add SAML SSO Provider</DialogTitle>
                <DialogDescription>
                  Configure a SAML identity provider for your workspace. Users
                  with matching email domains will be able to sign in via SSO.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="sso-display-name">Display Name</Label>
                  <Input
                    id="sso-display-name"
                    placeholder="e.g., Acme Corp Okta"
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label htmlFor="sso-domain">Email Domain</Label>
                  <Input
                    id="sso-domain"
                    placeholder="e.g., acme.com"
                    value={createDomain}
                    onChange={(e) => setCreateDomain(e.target.value)}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Users with this email domain will be prompted to use SSO.
                  </p>
                </div>

                {/* Metadata: URL or XML tabs */}
                <div className="space-y-2">
                  <Label>IdP Metadata</Label>
                  <Tabs
                    value={createMetadataTab}
                    onValueChange={setCreateMetadataTab}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">Metadata URL</TabsTrigger>
                      <TabsTrigger value="xml">Metadata XML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="space-y-2">
                      <Input
                        placeholder="https://idp.example.com/saml/metadata"
                        value={createMetadataUrl}
                        onChange={(e) => setCreateMetadataUrl(e.target.value)}
                        disabled={isCreating}
                      />
                    </TabsContent>
                    <TabsContent value="xml" className="space-y-2">
                      <Textarea
                        placeholder="Paste your SAML metadata XML here..."
                        value={createMetadataXml}
                        onChange={(e) => setCreateMetadataXml(e.target.value)}
                        disabled={isCreating}
                        rows={6}
                        className="resize-none font-mono text-xs"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Attribute mapping */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Attribute Mapping (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAttrMapping}
                      disabled={isCreating}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  {createAttrKeys.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Map SAML attributes to user profile fields (e.g., email,
                      name).
                    </p>
                  )}
                  {createAttrKeys.map((pair, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="SAML attribute"
                        value={pair.key}
                        onChange={(e) =>
                          updateAttrMapping(i, "key", e.target.value)
                        }
                        disabled={isCreating}
                        className="text-xs"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        -&gt;
                      </span>
                      <Input
                        placeholder="User field"
                        value={pair.value}
                        onChange={(e) =>
                          updateAttrMapping(i, "value", e.target.value)
                        }
                        disabled={isCreating}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttrMapping(i)}
                        disabled={isCreating}
                        className="shrink-0 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Default Role */}
                <div className="space-y-2">
                  <Label>Default Role for New Users</Label>
                  <Select
                    value={createDefaultRole}
                    onValueChange={(v) =>
                      setCreateDefaultRole(v as SsoDefaultRole)
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ssoDefaultRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Provision toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="sso-auto-provision" className="text-sm">
                      Auto-Provision Users
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically add SSO users to the workspace on first
                      login
                    </p>
                  </div>
                  <Switch
                    id="sso-auto-provision"
                    checked={createAutoProvision}
                    onCheckedChange={setCreateAutoProvision}
                    disabled={isCreating}
                  />
                </div>

                {/* Enforce SSO toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="sso-enforce" className="text-sm">
                      Enforce SSO
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Require SSO for all users with this email domain
                    </p>
                  </div>
                  <Switch
                    id="sso-enforce"
                    checked={createEnforceSSO}
                    onCheckedChange={setCreateEnforceSSO}
                    disabled={isCreating}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateDialogClose(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCreating ? "Creating..." : "Create Configuration"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading SSO configurations...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && configs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No SSO providers configured
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add a SAML SSO provider to enable Single Sign-On for users in your
              organization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* SSO configuration list */}
      {!isLoading &&
        configs.map((config) => (
          <Card key={config.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Config info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">
                      {config.display_name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        config.is_active
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
                      )}
                    >
                      {config.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {!config.sso_provider_id && (
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      >
                        No Provider
                      </Badge>
                    )}
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs border-blue-500/50 bg-blue-500/10 text-blue-400"
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      {config.domain}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        ROLE_BADGE_CLASSES[config.default_role],
                      )}
                    >
                      Default: {ROLE_LABELS[config.default_role]}
                    </Badge>
                    {config.enforce_sso && (
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-500/50 bg-orange-500/10 text-orange-400"
                      >
                        Enforced
                      </Badge>
                    )}
                    {config.auto_provision && (
                      <Badge
                        variant="outline"
                        className="text-xs border-green-500/50 bg-green-500/10 text-green-400"
                      >
                        Auto-Provision
                      </Badge>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(config.created_at)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Test connection */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleTestConnection(config)}
                          disabled={
                            testingId === config.id || !config.metadata_url
                          }
                        >
                          {testingId === config.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wifi className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Test metadata URL</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Toggle active */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleActive(config)}
                        >
                          {config.is_active ? (
                            <WifiOff className="h-4 w-4" />
                          ) : (
                            <Wifi className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {config.is_active ? "Disable" : "Enable"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Edit */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit configuration</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Delete */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(config)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete configuration</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* ----- Edit Dialog ----- */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SSO Configuration</DialogTitle>
            <DialogDescription>
              Update the SAML SSO provider settings for this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-sso-display-name">Display Name</Label>
              <Input
                id="edit-sso-display-name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                disabled={isEditing}
              />
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <Label htmlFor="edit-sso-domain">Email Domain</Label>
              <Input
                id="edit-sso-domain"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                disabled={isEditing}
              />
            </div>

            {/* Metadata URL */}
            <div className="space-y-2">
              <Label htmlFor="edit-sso-metadata-url">
                Metadata URL (optional)
              </Label>
              <Input
                id="edit-sso-metadata-url"
                placeholder="https://idp.example.com/saml/metadata"
                value={editMetadataUrl}
                onChange={(e) => setEditMetadataUrl(e.target.value)}
                disabled={isEditing}
              />
            </div>

            {/* Metadata XML */}
            <div className="space-y-2">
              <Label htmlFor="edit-sso-metadata-xml">
                Metadata XML (optional)
              </Label>
              <Textarea
                id="edit-sso-metadata-xml"
                placeholder="Paste SAML metadata XML..."
                value={editMetadataXml}
                onChange={(e) => setEditMetadataXml(e.target.value)}
                disabled={isEditing}
                rows={4}
                className="resize-none font-mono text-xs"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-sso-active" className="text-sm">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive configurations will not allow SSO login
                </p>
              </div>
              <Switch
                id="edit-sso-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                disabled={isEditing}
              />
            </div>

            {/* Default Role */}
            <div className="space-y-2">
              <Label>Default Role for New Users</Label>
              <Select
                value={editDefaultRole}
                onValueChange={(v) => setEditDefaultRole(v as SsoDefaultRole)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ssoDefaultRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Provision toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-sso-auto-provision" className="text-sm">
                  Auto-Provision Users
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically add SSO users to the workspace on first login
                </p>
              </div>
              <Switch
                id="edit-sso-auto-provision"
                checked={editAutoProvision}
                onCheckedChange={setEditAutoProvision}
                disabled={isEditing}
              />
            </div>

            {/* Enforce SSO toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-sso-enforce" className="text-sm">
                  Enforce SSO
                </Label>
                <p className="text-xs text-muted-foreground">
                  Require SSO for all users with this email domain
                </p>
              </div>
              <Switch
                id="edit-sso-enforce"
                checked={editEnforceSSO}
                onCheckedChange={setEditEnforceSSO}
                disabled={isEditing}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isEditing}>
                {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----- Delete Confirmation Dialog ----- */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete SSO Configuration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this SSO configuration? This
              action cannot be undone. Users will no longer be able to sign in
              via SSO for this domain.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-sm font-medium">{deleteTarget.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {deleteTarget.domain}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
