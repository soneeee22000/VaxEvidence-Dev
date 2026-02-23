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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ApiUsageChart } from "@/components/settings/api-usage-chart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ApiKeyRecord,
  ApiKeyScope,
  RateLimitTier,
} from "@/lib/validators/api-key";
import {
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Key,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// =============================================================================
// API KEY MANAGER
// =============================================================================
// Full CRUD interface for workspace API keys: list, create, revoke, rotate.
// Communicates with /api/workspaces/[id]/api-keys/* routes via fetch().
// =============================================================================

/** All available scopes with human-readable descriptions. */
const SCOPE_OPTIONS: {
  value: ApiKeyScope;
  label: string;
  description: string;
}[] = [
  {
    value: "read",
    label: "Read",
    description: "Read protocols, evidence, and datasets",
  },
  {
    value: "write",
    label: "Write",
    description: "Create and update resources",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage workspace settings and members",
  },
];

/** Color mapping for rate limit tier badges. */
const TIER_BADGE_CLASSES: Record<RateLimitTier, string> = {
  free: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
  pro: "border-primary/50 bg-primary/10 text-primary",
  enterprise: "border-primary/50 bg-primary/20 text-primary",
};

/** Color mapping for scope badges. */
const SCOPE_BADGE_CLASSES: Record<ApiKeyScope, string> = {
  read: "border-green-500/50 bg-green-500/10 text-green-400",
  write: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  admin: "border-red-500/50 bg-red-500/10 text-red-400",
};

interface ApiKeyManagerProps {
  /** The workspace ID to manage API keys for. */
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
  });
}

export function ApiKeyManager({ workspaceId }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

  /* Create dialog state */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createScopes, setCreateScopes] = useState<ApiKeyScope[]>(["read"]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  /* Revoke confirmation dialog state */
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  /* Rotate state */
  const [rotateTarget, setRotateTarget] = useState<ApiKeyRecord | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedRawKey, setRotatedRawKey] = useState<string | null>(null);

  const basePath = `/api/workspaces/${workspaceId}/api-keys`;

  /**
   * Fetch all active API keys for the workspace.
   */
  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(basePath);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to load API keys",
        );
      }
      const { data } = (await res.json()) as { data: ApiKeyRecord[] };
      setApiKeys(data);
    } catch (err) {
      toast.error("Failed to load API keys", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Toggles a scope in the create form's selected scopes list.
   */
  function toggleScope(scope: ApiKeyScope) {
    setCreateScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  /**
   * Handles API key creation via POST.
   */
  async function handleCreate() {
    if (!createName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (createScopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), scopes: createScopes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to create API key",
        );
      }

      const { data } = (await res.json()) as {
        data: ApiKeyRecord & { raw_key: string };
      };
      setNewRawKey(data.raw_key);

      /* Refresh the list. */
      await loadApiKeys();
      toast.success("API key created");
    } catch (err) {
      toast.error("Failed to create API key", {
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
      setCreateName("");
      setCreateScopes(["read"]);
      setNewRawKey(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Revoke
  // ---------------------------------------------------------------------------

  /**
   * Handles API key revocation via DELETE.
   */
  async function handleRevoke() {
    if (!revokeTarget) return;

    setIsRevoking(true);
    try {
      const res = await fetch(`${basePath}/${revokeTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to revoke API key",
        );
      }

      toast.success("API key revoked", {
        description: `"${revokeTarget.name}" has been permanently revoked.`,
      });

      setRevokeTarget(null);
      await loadApiKeys();
    } catch (err) {
      toast.error("Failed to revoke API key", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsRevoking(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Rotate
  // ---------------------------------------------------------------------------

  /**
   * Handles API key rotation via POST (revoke old + create new).
   */
  async function handleRotate() {
    if (!rotateTarget) return;

    setIsRotating(true);
    try {
      const res = await fetch(`${basePath}/${rotateTarget.id}/rotate`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to rotate API key",
        );
      }

      const { data } = (await res.json()) as {
        data: ApiKeyRecord & { raw_key: string };
      };
      setRotatedRawKey(data.raw_key);

      toast.success("API key rotated", {
        description: "The old key has been revoked and a new one created.",
      });

      await loadApiKeys();
    } catch (err) {
      toast.error("Failed to rotate API key", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsRotating(false);
    }
  }

  /**
   * Resets the rotate dialog state when closing.
   */
  function handleRotateDialogClose(open: boolean) {
    if (!open) {
      setRotateTarget(null);
      setRotatedRawKey(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  /**
   * Copies the given text to the clipboard.
   */
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Create and manage API keys for programmatic access to VaxEvidence
            </CardDescription>
          </div>

          {/* Create API Key Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for programmatic access to your
                  workspace.
                </DialogDescription>
              </DialogHeader>

              {newRawKey ? (
                /* ----- Raw key reveal ----- */
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-400">
                      This key will only be shown once. Copy it now and store it
                      securely. You will not be able to view it again.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newRawKey}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(newRawKey)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy to clipboard</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => handleCreateDialogClose(false)}>
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                /* ----- Create form ----- */
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., CI Pipeline, Analytics Service"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="space-y-2">
                      {SCOPE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                            createScopes.includes(option.value)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={createScopes.includes(option.value)}
                            onChange={() => toggleScope(option.value)}
                            disabled={isCreating}
                            className="mt-0.5 h-4 w-4 rounded border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
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
                      {isCreating ? "Creating..." : "Create Key"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
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
              Loading API keys...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && apiKeys.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No API keys yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Create an API key to enable programmatic access to your workspace
              resources via the VaxEvidence REST API.
            </p>
          </CardContent>
        </Card>
      )}

      {/* API key list */}
      {!isLoading &&
        apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Key info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{apiKey.name}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        TIER_BADGE_CLASSES[apiKey.rate_limit_tier],
                      )}
                    >
                      {apiKey.rate_limit_tier}
                    </Badge>
                  </div>

                  <p className="font-mono text-xs text-muted-foreground">
                    {apiKey.key_prefix}...
                  </p>

                  {/* Scopes */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {apiKey.scopes.map((scope) => (
                      <Badge
                        key={scope}
                        variant="outline"
                        className={cn("text-xs", SCOPE_BADGE_CLASSES[scope])}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {scope}
                      </Badge>
                    ))}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(apiKey.created_at)}
                    </span>
                    <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Expand usage */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setExpandedKeyId((prev) =>
                              prev === apiKey.id ? null : apiKey.id,
                            )
                          }
                        >
                          {expandedKeyId === apiKey.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {expandedKeyId === apiKey.id
                          ? "Hide usage"
                          : "Show usage"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Rotate */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRotateTarget(apiKey)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate key</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Revoke */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(apiKey)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Revoke key</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Expandable usage chart */}
              {expandedKeyId === apiKey.id && (
                <>
                  <Separator className="my-4" />
                  <ApiUsageChart workspaceId={workspaceId} keyId={apiKey.id} />
                </>
              )}
            </CardContent>
          </Card>
        ))}

      {/* ----- Revoke Confirmation Dialog ----- */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{revokeTarget?.name}</strong>? This action cannot be
              undone. Any applications using this key will immediately lose
              access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRevoking ? "Revoking..." : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----- Rotate Dialog ----- */}
      <Dialog open={!!rotateTarget} onOpenChange={handleRotateDialogClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Rotate API Key
            </DialogTitle>
            <DialogDescription>
              {rotatedRawKey
                ? "Your API key has been rotated. Copy the new key below."
                : `Rotate "${rotateTarget?.name}"? The current key will be revoked and replaced with a new one.`}
            </DialogDescription>
          </DialogHeader>

          {rotatedRawKey ? (
            /* ----- Rotated key reveal ----- */
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-400">
                  This key will only be shown once. Copy it now and store it
                  securely. You will not be able to view it again.
                </p>
              </div>

              <div className="space-y-2">
                <Label>New API Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={rotatedRawKey}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(rotatedRawKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to clipboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => handleRotateDialogClose(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ----- Rotate confirmation ----- */
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => handleRotateDialogClose(false)}
                disabled={isRotating}
              >
                Cancel
              </Button>
              <Button onClick={handleRotate} disabled={isRotating}>
                {isRotating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isRotating ? "Rotating..." : "Rotate Key"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
