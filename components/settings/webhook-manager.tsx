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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  WEBHOOK_EVENTS,
  type WebhookEvent,
  type WebhookRecord,
  type WebhookDeliveryRecord,
} from "@/lib/validators/webhook";
import {
  Plus,
  Copy,
  Trash2,
  Pencil,
  Webhook,
  AlertTriangle,
  Loader2,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CircleDot,
  Send,
} from "lucide-react";

// =============================================================================
// WEBHOOK MANAGER
// =============================================================================
// Full CRUD interface for workspace webhooks: list, create, edit, test, delete.
// Communicates with /api/workspaces/[id]/webhooks/* routes via fetch().
// =============================================================================

/** Human-readable labels for webhook events. */
const EVENT_LABELS: Record<WebhookEvent, string> = {
  "protocol.created": "Protocol Created",
  "protocol.updated": "Protocol Updated",
  "evidence.created": "Evidence Created",
  "evidence.updated": "Evidence Updated",
  "evidence.deleted": "Evidence Deleted",
  "screening.decision_made": "Screening Decision",
  "dataset.created": "Dataset Created",
  "export.generated": "Export Generated",
};

/** Color mapping for event category badges. */
const EVENT_BADGE_CLASSES: Record<string, string> = {
  protocol: "border-primary/50 bg-primary/10 text-primary",
  evidence: "border-green-500/50 bg-green-500/10 text-green-400",
  screening: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  dataset: "border-primary/50 bg-primary/20 text-primary",
  export: "border-muted-foreground/50 bg-muted text-muted-foreground",
};

/** Color mapping for delivery status badges. */
const STATUS_BADGE_CLASSES: Record<string, string> = {
  delivered: "border-green-500/50 bg-green-500/10 text-green-400",
  failed: "border-red-500/50 bg-red-500/10 text-red-400",
  pending: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
};

/** Delivery status icons. */
const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  delivered: CheckCircle2,
  failed: XCircle,
  pending: CircleDot,
};

/** Webhook record extended with deliveries for the detail view. */
interface WebhookWithDeliveries extends Omit<WebhookRecord, "secret"> {
  deliveries: Pick<
    WebhookDeliveryRecord,
    | "id"
    | "event_type"
    | "status"
    | "attempts"
    | "last_response_code"
    | "created_at"
    | "delivered_at"
  >[];
}

interface WebhookManagerProps {
  /** The workspace ID to manage webhooks for. */
  workspaceId: string;
}

/**
 * Extracts the event category prefix (e.g., "protocol" from "protocol.created").
 */
function getEventCategory(event: string): string {
  return event.split(".")[0];
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

/**
 * Truncates a URL to a max display length.
 */
function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength)}...`;
}

export function WebhookManager({ workspaceId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<Omit<WebhookRecord, "secret">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] =
    useState<WebhookWithDeliveries | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  /* Create dialog state */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState("");
  const [createEvents, setCreateEvents] = useState<WebhookEvent[]>([]);
  const [createDescription, setCreateDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  /* Edit dialog state */
  const [editTarget, setEditTarget] = useState<Omit<
    WebhookRecord,
    "secret"
  > | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<WebhookEvent[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  /* Delete confirmation dialog state */
  const [deleteTarget, setDeleteTarget] = useState<Omit<
    WebhookRecord,
    "secret"
  > | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Test state */
  const [testingId, setTestingId] = useState<string | null>(null);

  const basePath = `/api/workspaces/${workspaceId}/webhooks`;

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  /**
   * Fetch all webhooks for the workspace.
   */
  const loadWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(basePath);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to load webhooks",
        );
      }
      const { data } = (await res.json()) as {
        data: Omit<WebhookRecord, "secret">[];
      };
      setWebhooks(data);
    } catch (err) {
      toast.error("Failed to load webhooks", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  /**
   * Fetch a single webhook with recent deliveries.
   */
  async function loadWebhookDetail(webhookId: string) {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${basePath}/${webhookId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Failed to load webhook details",
        );
      }
      const { data } = (await res.json()) as { data: WebhookWithDeliveries };
      setExpandedData(data);
    } catch (err) {
      toast.error("Failed to load deliveries", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }

  /**
   * Toggles the expanded state for a webhook and fetches its detail data.
   */
  function handleToggleExpand(webhookId: string) {
    if (expandedId === webhookId) {
      setExpandedId(null);
      setExpandedData(null);
    } else {
      setExpandedId(webhookId);
      loadWebhookDetail(webhookId);
    }
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Toggles an event in the create form's selected events list.
   */
  function toggleCreateEvent(event: WebhookEvent) {
    setCreateEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  /**
   * Handles webhook creation via POST.
   */
  async function handleCreate() {
    if (!createUrl.trim()) {
      toast.error("URL is required");
      return;
    }
    if (createEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: createUrl.trim(),
          events: createEvents,
          description: createDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to create webhook",
        );
      }

      const { data } = (await res.json()) as {
        data: WebhookRecord & { secret: string };
      };
      setNewSecret(data.secret);

      await loadWebhooks();
      toast.success("Webhook created");
    } catch (err) {
      toast.error("Failed to create webhook", {
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
      setCreateUrl("");
      setCreateEvents([]);
      setCreateDescription("");
      setNewSecret(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  /**
   * Opens the edit dialog pre-filled with a webhook's current values.
   */
  function openEditDialog(webhook: Omit<WebhookRecord, "secret">) {
    setEditTarget(webhook);
    setEditUrl(webhook.url);
    setEditEvents(webhook.events as WebhookEvent[]);
    setEditDescription(webhook.description ?? "");
    setEditIsActive(webhook.is_active);
  }

  /**
   * Toggles an event in the edit form's selected events list.
   */
  function toggleEditEvent(event: WebhookEvent) {
    setEditEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  /**
   * Handles webhook update via PATCH.
   */
  async function handleEdit() {
    if (!editTarget) return;
    if (!editUrl.trim()) {
      toast.error("URL is required");
      return;
    }
    if (editEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch(`${basePath}/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editUrl.trim(),
          events: editEvents,
          description: editDescription.trim() || undefined,
          is_active: editIsActive,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to update webhook",
        );
      }

      toast.success("Webhook updated");
      setEditTarget(null);
      await loadWebhooks();
    } catch (err) {
      toast.error("Failed to update webhook", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsEditing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Handles webhook deletion via DELETE.
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
          (body as { error?: string }).error ?? "Failed to delete webhook",
        );
      }

      toast.success("Webhook deleted", {
        description: `Webhook for "${truncateUrl(deleteTarget.url, 30)}" has been permanently deleted.`,
      });

      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) {
        setExpandedId(null);
        setExpandedData(null);
      }
      await loadWebhooks();
    } catch (err) {
      toast.error("Failed to delete webhook", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Test
  // ---------------------------------------------------------------------------

  /**
   * Sends a test ping to a webhook.
   */
  async function handleTest(webhookId: string) {
    setTestingId(webhookId);
    try {
      const res = await fetch(`${basePath}/${webhookId}/test`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to send test ping",
        );
      }

      const { data } = (await res.json()) as {
        data: { success: boolean };
      };

      if (data.success) {
        toast.success("Test ping delivered successfully");
      } else {
        toast.error("Test ping failed", {
          description:
            "The webhook endpoint did not return a 2xx response. Check your server logs.",
        });
      }

      /* Refresh deliveries if this webhook is expanded. */
      if (expandedId === webhookId) {
        loadWebhookDetail(webhookId);
      }
    } catch (err) {
      toast.error("Failed to send test ping", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setTestingId(null);
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
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Configure webhooks to receive real-time notifications when events
              occur in your workspace
            </CardDescription>
          </div>

          {/* Create Webhook Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a URL to receive HTTP POST notifications when
                  selected events occur.
                </DialogDescription>
              </DialogHeader>

              {newSecret ? (
                /* ----- Secret reveal ----- */
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-400">
                      This signing secret will only be shown once. Copy it now
                      and store it securely. Use it to verify webhook signatures
                      via the X-VaxEvidence-Signature header.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Signing Secret</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newSecret}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(newSecret)}
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
                    <Label htmlFor="webhook-url">Endpoint URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://example.com/webhooks/vaxevidence"
                      value={createUrl}
                      onChange={(e) => setCreateUrl(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-description">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="webhook-description"
                      placeholder="What is this webhook used for?"
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      disabled={isCreating}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <label
                          key={event}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                            createEvents.includes(event)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={createEvents.includes(event)}
                            onChange={() => toggleCreateEvent(event)}
                            disabled={isCreating}
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-xs font-medium">
                            {EVENT_LABELS[event]}
                          </span>
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
                      {isCreating ? "Creating..." : "Create Webhook"}
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
              Loading webhooks...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && webhooks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Webhook className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No webhooks configured
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Create a webhook to receive HTTP POST notifications when events
              occur in your workspace.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Webhook list */}
      {!isLoading &&
        webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Webhook info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className="text-sm font-semibold font-mono truncate max-w-xs"
                      title={webhook.url}
                    >
                      {truncateUrl(webhook.url)}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        webhook.is_active
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
                      )}
                    >
                      {webhook.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Description */}
                  {webhook.description && (
                    <p className="text-xs text-muted-foreground">
                      {webhook.description}
                    </p>
                  )}

                  {/* Events */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {webhook.events.map((event) => (
                      <Badge
                        key={event}
                        variant="outline"
                        className={cn(
                          "text-xs",
                          EVENT_BADGE_CLASSES[getEventCategory(event)] ??
                            "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
                        )}
                      >
                        <Zap className="mr-1 h-3 w-3" />
                        {EVENT_LABELS[event as WebhookEvent] ?? event}
                      </Badge>
                    ))}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(webhook.created_at)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Test ping */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleTest(webhook.id)}
                          disabled={testingId === webhook.id}
                        >
                          {testingId === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send test ping</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Expand deliveries */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleExpand(webhook.id)}
                        >
                          {expandedId === webhook.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {expandedId === webhook.id
                          ? "Hide deliveries"
                          : "Show deliveries"}
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
                          onClick={() => openEditDialog(webhook)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit webhook</TooltipContent>
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
                          onClick={() => setDeleteTarget(webhook)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete webhook</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Expandable deliveries section */}
              {expandedId === webhook.id && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent Deliveries
                    </h4>

                    {isLoadingDetail && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Loading deliveries...
                        </span>
                      </div>
                    )}

                    {!isLoadingDetail &&
                      expandedData &&
                      expandedData.deliveries.length === 0 && (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          No deliveries yet. Send a test ping to verify your
                          endpoint.
                        </p>
                      )}

                    {!isLoadingDetail &&
                      expandedData &&
                      expandedData.deliveries.slice(0, 5).map((delivery) => {
                        const StatusIcon =
                          STATUS_ICONS[delivery.status] ?? CircleDot;
                        return (
                          <div
                            key={delivery.id}
                            className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <StatusIcon
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  delivery.status === "delivered" &&
                                    "text-green-400",
                                  delivery.status === "failed" &&
                                    "text-red-400",
                                  delivery.status === "pending" &&
                                    "text-yellow-400",
                                )}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {delivery.event_type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(delivery.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {delivery.last_response_code && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {delivery.last_response_code}
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  STATUS_BADGE_CLASSES[delivery.status] ??
                                    STATUS_BADGE_CLASSES.pending,
                                )}
                              >
                                {delivery.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {delivery.attempts} attempt
                                {delivery.attempts !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update the webhook URL, subscribed events, or active status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-url">Endpoint URL</Label>
              <Input
                id="edit-webhook-url"
                placeholder="https://example.com/webhooks/vaxevidence"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                disabled={isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-webhook-description">
                Description (optional)
              </Label>
              <Textarea
                id="edit-webhook-description"
                placeholder="What is this webhook used for?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isEditing}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-webhook-active" className="text-sm">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive webhooks will not receive any events
                </p>
              </div>
              <Switch
                id="edit-webhook-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                disabled={isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      editEvents.includes(event)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={editEvents.includes(event)}
                      onChange={() => toggleEditEvent(event)}
                      disabled={isEditing}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-xs font-medium">
                      {EVENT_LABELS[event]}
                    </span>
                  </label>
                ))}
              </div>
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
              Delete Webhook
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? This action cannot
              be undone. All delivery history will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-xs font-mono text-muted-foreground truncate">
                {deleteTarget.url}
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
              {isDeleting ? "Deleting..." : "Delete Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
