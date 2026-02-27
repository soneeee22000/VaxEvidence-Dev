"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchProtocolById,
  updateProtocol,
  deleteProtocol,
  type ProtocolRecord,
} from "@/lib/supabase/protocols";
import {
  protocolSchema,
  type ProtocolFormValues,
} from "@/lib/validators/protocol";
import {
  getLinkedEvidence,
  fetchEvidenceItems,
  linkEvidenceToProtocol,
  unlinkEvidence,
} from "@/lib/supabase/evidence";
import type { EvidenceItem } from "@/lib/validators/evidence";
import {
  getLinkedDatasets,
  fetchDatasets,
  linkDatasetToProtocol,
  unlinkDataset,
  getDatasetFileUrl,
} from "@/lib/supabase/datasets";
import type { Dataset } from "@/lib/validators/dataset";
import { formatFileSize } from "@/lib/validators/dataset";
import {
  Plus,
  X,
  ExternalLink,
  Search,
  Download,
  Database,
  Shield,
  Library,
  ArrowRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CommentThread } from "@/components/collaboration/comment-thread";
import { CommentInput } from "@/components/collaboration/comment-input";
import { ReviewPanel } from "@/components/collaboration/review-panel";
import { ExportMenu } from "@/components/export/export-menu";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/lib/supabase/comments";
import {
  fetchReviews,
  requestReview,
  submitReviewDecision,
  cancelReview,
} from "@/lib/supabase/reviews";
import {
  buildCommentThreads,
  type CommentWithUser,
} from "@/lib/validators/comment";
import type { ReviewWithDetails, ReviewStatus } from "@/lib/validators/review";
import { useAuth } from "@/lib/auth/auth-context";
import { logActivity } from "@/lib/supabase/activity";
import { VersionHistoryPanel } from "@/components/versioning/version-history-panel";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import type { PicoOutput } from "@/lib/ai/ai-validators";
import {
  PresenceProvider,
  usePresence,
} from "@/lib/collaboration/presence-context";
import { CollaboratorAvatars } from "@/components/collaboration/collaborator-avatars";
import { FieldPresenceIndicator } from "@/components/collaboration/field-presence-indicator";
import { useRealtimeComments } from "@/lib/collaboration/use-realtime-comments";

export default function ProtocolDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const protocolId = params?.id;
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? "";
  const currentUserEmail = authUser?.email ?? "";

  const [protocol, setProtocol] = useState<ProtocolRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Evidence linking state
  const [linkedEvidence, setLinkedEvidence] = useState<any[]>([]);
  const [availableEvidence, setAvailableEvidence] = useState<EvidenceItem[]>(
    [],
  );
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState("");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(
    new Set(),
  );

  // Dataset linking state
  const [linkedDatasets, setLinkedDatasets] = useState<any[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false);
  const [datasetSearchQuery, setDatasetSearchQuery] = useState("");
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(
    new Set(),
  );

  // Collaboration state — reviews still manual, comments now real-time
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Real-time comments via postgres_changes
  const {
    comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useRealtimeComments(protocolId);

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      title: "",
      study_question: "",
      population: "",
      intervention: "",
      comparator: "",
      outcomes: "",
      design: "",
      status: "draft",
    },
    mode: "onTouched",
  });

  const loadLinkedEvidence = useCallback(async () => {
    if (!protocolId || typeof protocolId !== "string") return;

    try {
      const { data, error } = await getLinkedEvidence(protocolId);
      if (!error && data) {
        setLinkedEvidence(data);
      }
    } catch (error) {
      console.error("Error loading linked evidence:", error);
    }
  }, [protocolId]);

  const loadLinkedDatasets = useCallback(async () => {
    if (!protocolId || typeof protocolId !== "string") return;

    try {
      const { data, error } = await getLinkedDatasets(protocolId);
      if (!error && data) {
        setLinkedDatasets(data);
      }
    } catch (error) {
      console.error("Error loading linked datasets:", error);
    }
  }, [protocolId]);

  const loadReviews = useCallback(async () => {
    if (!protocolId || typeof protocolId !== "string") return;

    setIsLoadingReviews(true);
    try {
      const { data, error } = await fetchReviews(protocolId);
      if (!error && data) {
        setReviews(data as ReviewWithDetails[]);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [protocolId]);

  useEffect(() => {
    const loadProtocol = async () => {
      if (!protocolId || typeof protocolId !== "string") {
        setError("Missing protocol ID.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await fetchProtocolById(protocolId);

      if (error || !data) {
        setError(error?.message || "Protocol not found.");
        setIsLoading(false);
        return;
      }

      setProtocol(data);
      form.reset({
        title: data.title,
        study_question: data.study_question,
        population: data.population,
        intervention: data.intervention ?? "",
        comparator: data.comparator,
        outcomes: data.outcomes,
        design: data.design,
        status: data.status,
      });
      setIsLoading(false);

      // Load linked evidence, datasets, and reviews
      loadLinkedEvidence();
      loadLinkedDatasets();
      loadReviews();
    };

    loadProtocol();
  }, [protocolId, form, loadLinkedEvidence, loadLinkedDatasets, loadReviews]);

  const loadAvailableEvidence = async () => {
    try {
      const { data, error } = await fetchEvidenceItems();
      if (!error && data) {
        setAvailableEvidence(data);
      }
    } catch (error) {
      console.error("Error loading evidence:", error);
    }
  };

  const loadAvailableDatasets = async () => {
    try {
      const { data, error } = await fetchDatasets();
      if (!error && data) {
        setAvailableDatasets(data);
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
    }
  };

  const handleCreateComment = async (
    content: string,
    mentionUserIds?: string[],
  ) => {
    if (!protocolId || typeof protocolId !== "string") return;

    try {
      const { data, error } = await createComment({
        user_id: currentUserId,
        resource_type: "protocol",
        resource_id: protocolId,
        content,
        mentions: [],
        mentionUserIds,
      });

      if (error || !data) {
        toast.error("Failed to post comment");
        return;
      }

      toast.success("Comment posted successfully");
      refetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleReplyComment = async (parentId: string, content: string) => {
    if (!protocolId || typeof protocolId !== "string") return;

    try {
      const { data, error } = await createComment({
        user_id: currentUserId,
        resource_type: "protocol",
        resource_id: protocolId,
        content,
        parent_id: parentId,
        mentions: [],
      });

      if (error || !data) {
        toast.error("Failed to post reply");
        return;
      }

      toast.success("Reply posted successfully");
      refetchComments();
    } catch (error) {
      console.error("Error replying to comment:", error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const { error } = await updateComment(commentId, { content });

      if (error) {
        toast.error("Failed to update comment");
        return;
      }

      toast.success("Comment updated successfully");
      refetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await deleteComment(commentId);

      if (error) {
        toast.error("Failed to delete comment");
        return;
      }

      toast.success("Comment deleted successfully");
      refetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleRequestReview = async (reviewerId: string) => {
    if (!protocolId || typeof protocolId !== "string") return;

    try {
      const { data, error } = await requestReview({
        protocol_id: protocolId,
        reviewer_id: reviewerId,
        requester_id: currentUserId,
        requester_email: currentUserEmail || undefined,
      });

      if (error || !data) {
        toast.error("Failed to request review");
        return;
      }

      toast.success("Review requested successfully");
      loadReviews();
    } catch (error) {
      console.error("Error requesting review:", error);
    }
  };

  const handleSubmitReviewDecision = async (
    reviewId: string,
    status: ReviewStatus,
    decision: string,
  ) => {
    try {
      const { error } = await submitReviewDecision(reviewId, {
        status: status as "approved" | "rejected" | "changes_requested",
        decision,
      });

      if (error) {
        toast.error("Failed to submit review");
        return;
      }

      toast.success("Review submitted successfully");
      loadReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleCancelReview = async (reviewId: string) => {
    try {
      const { error } = await cancelReview(reviewId);

      if (error) {
        toast.error("Failed to cancel review");
        return;
      }

      toast.success("Review cancelled successfully");
      loadReviews();
    } catch (error) {
      console.error("Error cancelling review:", error);
    }
  };

  const handleLinkEvidence = async () => {
    if (
      !protocolId ||
      typeof protocolId !== "string" ||
      selectedEvidenceIds.size === 0
    )
      return;

    try {
      for (const evidenceId of selectedEvidenceIds) {
        await linkEvidenceToProtocol(protocolId, evidenceId);
      }

      if (currentUserId) {
        for (const evidenceId of selectedEvidenceIds) {
          logActivity(currentUserId, "link", "evidence_item", evidenceId, {
            protocol_id: protocolId,
          }).catch(() => {});
        }
      }
      toast.success(`Linked ${selectedEvidenceIds.size} evidence item(s)`);

      setSelectedEvidenceIds(new Set());
      setIsLinkDialogOpen(false);
      loadLinkedEvidence();
    } catch (error) {
      console.error("Error linking evidence:", error);
      toast.error("Failed to link evidence");
    }
  };

  const handleUnlinkEvidence = async (linkId: string) => {
    try {
      const { error } = await unlinkEvidence(linkId);
      if (error) {
        toast.error("Failed to unlink evidence");
        return;
      }

      if (currentUserId) {
        logActivity(currentUserId, "unlink", "evidence_item", linkId, {
          protocol_id: protocolId,
        }).catch(() => {});
      }
      toast.success("Evidence unlinked successfully");
      loadLinkedEvidence();
    } catch (error) {
      console.error("Error unlinking evidence:", error);
    }
  };

  const toggleEvidenceSelection = (evidenceId: string) => {
    const newSelection = new Set(selectedEvidenceIds);
    if (newSelection.has(evidenceId)) {
      newSelection.delete(evidenceId);
    } else {
      newSelection.add(evidenceId);
    }
    setSelectedEvidenceIds(newSelection);
  };

  // Dataset linking handlers
  const handleLinkDataset = async () => {
    if (
      !protocolId ||
      typeof protocolId !== "string" ||
      selectedDatasetIds.size === 0
    )
      return;

    try {
      for (const datasetId of selectedDatasetIds) {
        await linkDatasetToProtocol(protocolId, datasetId);
      }

      toast.success(`Linked ${selectedDatasetIds.size} dataset(s)`);

      setSelectedDatasetIds(new Set());
      setIsDatasetDialogOpen(false);
      loadLinkedDatasets();
    } catch (error) {
      console.error("Error linking dataset:", error);
      toast.error("Failed to link dataset");
    }
  };

  const handleUnlinkDataset = async (linkId: string) => {
    try {
      const { error } = await unlinkDataset(linkId);
      if (error) {
        toast.error("Failed to unlink dataset");
        return;
      }

      toast.success("Dataset unlinked successfully");
      loadLinkedDatasets();
    } catch (error) {
      console.error("Error unlinking dataset:", error);
    }
  };

  const handleDownloadDataset = async (storagePath: string) => {
    try {
      const { data, error } = await getDatasetFileUrl(storagePath);
      if (error || !data) {
        toast.error("Failed to get download link");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading dataset:", error);
    }
  };

  const toggleDatasetSelection = (datasetId: string) => {
    const newSelection = new Set(selectedDatasetIds);
    if (newSelection.has(datasetId)) {
      newSelection.delete(datasetId);
    } else {
      newSelection.add(datasetId);
    }
    setSelectedDatasetIds(newSelection);
  };

  // AI PICO generation handler
  const handlePicoGenerated = (pico: PicoOutput) => {
    form.setValue("study_question", pico.study_question, { shouldDirty: true });
    form.setValue("population", pico.population, { shouldDirty: true });
    form.setValue("intervention", pico.intervention, { shouldDirty: true });
    form.setValue("comparator", pico.comparator, { shouldDirty: true });
    form.setValue("outcomes", pico.outcomes, { shouldDirty: true });
    form.setValue("design", pico.design, { shouldDirty: true });
  };

  // Extract linked PMIDs for paper recommendations
  const linkedPmids = linkedEvidence
    .map((link: any) => link.evidence_items?.external_id)
    .filter(Boolean) as string[];

  const filteredAvailableEvidence = availableEvidence.filter((item) => {
    if (!evidenceSearchQuery) return true;
    const query = evidenceSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const filteredAvailableDatasets = availableDatasets.filter((item) => {
    if (!datasetSearchQuery) return true;
    const query = datasetSearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Ref for broadcasting save events via presence context (set by PresenceBridge)
  const broadcastSaveRef = useRef<(email: string) => void>(() => {});

  // Listen for remote save events (from other collaborators)
  useEffect(() => {
    const handleRemoteSave = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      toast.info(`Protocol saved by ${detail.savedBy}`);
      // Reload protocol from DB to get latest state
      if (protocolId) {
        const { data } = await fetchProtocolById(protocolId);
        if (data) {
          setProtocol(data);
          form.reset({
            title: data.title,
            study_question: data.study_question,
            population: data.population,
            intervention: data.intervention ?? "",
            comparator: data.comparator,
            outcomes: data.outcomes,
            design: data.design,
            status: data.status,
          });
        }
      }
    };

    window.addEventListener("protocol-saved-remote", handleRemoteSave);
    return () =>
      window.removeEventListener("protocol-saved-remote", handleRemoteSave);
  }, [protocolId, form]);

  const handleSave = async (values: ProtocolFormValues) => {
    if (!protocolId || typeof protocolId !== "string") return;
    setError(null);
    setIsSaving(true);

    try {
      const { data, error } = await updateProtocol(protocolId, values);

      if (error) {
        throw new Error(error.message || "Failed to save protocol");
      }

      if (data) {
        setProtocol(data);
        if (currentUserId) {
          logActivity(currentUserId, "update", "protocol", protocolId, {
            title: data.title,
          }).catch(() => {});
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.protocols.all });
        form.reset({
          title: data.title,
          study_question: data.study_question,
          population: data.population,
          intervention: data.intervention ?? "",
          comparator: data.comparator,
          outcomes: data.outcomes,
          design: data.design,
          status: data.status,
        });

        // Broadcast save event to other collaborators
        broadcastSaveRef.current(currentUserEmail);

        // Auto-version on status transition to "final"
        const previousStatus = protocol?.status;
        if (data.status === "final" && previousStatus !== "final") {
          try {
            await fetch(`/api/protocols/${protocolId}/versions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                change_summary: "Auto-versioned on finalization",
              }),
            });
            toast.success("Final version snapshot saved automatically");
          } catch {
            // Non-blocking — version creation failure should not block save
            console.error("Auto-version on finalization failed");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save protocol");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!protocolId || typeof protocolId !== "string") return;

    setIsDeleting(true);

    try {
      const { error } = await deleteProtocol(protocolId);

      if (error) {
        throw new Error(error.message || "Failed to delete protocol");
      }

      if (currentUserId) {
        logActivity(currentUserId, "delete", "protocol", protocolId, {
          title: protocol?.title,
        }).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.protocols.all });
      toast.success("Protocol deleted successfully");
      router.push("/app");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete protocol",
      );
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading protocol...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  if (!protocol) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Protocol unavailable</CardTitle>
              <CardDescription>
                {error ?? "We couldn't load that protocol."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost">
                <Link href="/app">Back to dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <PresenceProvider
      protocolId={protocolId}
      userId={currentUserId}
      email={currentUserEmail}
      form={form}
    >
      <PresenceBridge broadcastSaveRef={broadcastSaveRef} />
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Protocol details</CardTitle>
                  <CardDescription>
                    Last updated{" "}
                    {new Date(protocol.updated_at).toLocaleString()}
                  </CardDescription>
                </div>
                <CollaboratorAvatars />
              </div>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)}>
                <CardContent className="space-y-6">
                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <FieldPresenceIndicator fieldName="title">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protocol title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FieldPresenceIndicator>
                  <FieldPresenceIndicator fieldName="study_question">
                    <FormField
                      control={form.control}
                      name="study_question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study question</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FieldPresenceIndicator>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldPresenceIndicator fieldName="population">
                      <FormField
                        control={form.control}
                        name="population"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Population</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldPresenceIndicator>
                    <FieldPresenceIndicator fieldName="intervention">
                      <FormField
                        control={form.control}
                        name="intervention"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intervention</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the vaccine or intervention being studied."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldPresenceIndicator>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldPresenceIndicator fieldName="comparator">
                      <FormField
                        control={form.control}
                        name="comparator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comparator</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldPresenceIndicator>
                  </div>
                  <FieldPresenceIndicator fieldName="outcomes">
                    <FormField
                      control={form.control}
                      name="outcomes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outcomes</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FieldPresenceIndicator>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldPresenceIndicator fieldName="design">
                      <FormField
                        control={form.control}
                        name="design"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Study design</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldPresenceIndicator>
                    <FieldPresenceIndicator fieldName="status">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="in_review">
                                  In review
                                </SelectItem>
                                <SelectItem value="final">Final</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldPresenceIndicator>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-between gap-3">
                  <Button asChild variant="ghost">
                    <Link href="/app">Back to dashboard</Link>
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <ExportMenu
                      protocolId={protocolId}
                      protocolTitle={protocol.title}
                      hasEvidence={linkedEvidence.length > 0}
                      protocol={protocol}
                      evidenceCount={linkedEvidence.length}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Protocol?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this protocol and all its linked evidence and
                            datasets.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </Card>

          {/* Version History */}
          {protocolId && <VersionHistoryPanel protocolId={protocolId} />}

          {/* Systematic Review Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Systematic Review</CardTitle>
                  <CardDescription>
                    PRISMA-compliant screening, risk of bias, and meta-analysis
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/app/${protocolId}/screening`}>
                    {linkedEvidence.length > 0
                      ? "Continue Screening"
                      : "Start Screening"}
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Regulatory Compliance Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Regulatory Compliance
                  </CardTitle>
                  <CardDescription>
                    CONSORT/STROBE checklists and ICH GCP compliance tracking
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/app/${protocolId}/regulatory`}>
                    Open Compliance Hub
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Linked Evidence Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Linked Evidence</CardTitle>
                  <CardDescription>
                    Evidence items supporting this protocol (
                    {linkedEvidence.length})
                  </CardDescription>
                </div>
                <Dialog
                  open={isLinkDialogOpen}
                  onOpenChange={setIsLinkDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAvailableEvidence}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Evidence
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Link Evidence to Protocol</DialogTitle>
                      <DialogDescription>
                        Select evidence items to link to this protocol
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search evidence..."
                          value={evidenceSearchQuery}
                          onChange={(e) =>
                            setEvidenceSearchQuery(e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {filteredAvailableEvidence.map((item) => {
                          const isLinked = linkedEvidence.some(
                            (link: any) => link.evidence_id === item.id,
                          );
                          const isSelected = selectedEvidenceIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                                isLinked
                                  ? "opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                              }`}
                              onClick={() =>
                                !isLinked && toggleEvidenceSelection(item.id)
                              }
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {item.type}
                                    </Badge>
                                    {isLinked && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Already linked
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm line-clamp-1">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {item.description}
                                  </p>
                                </div>
                                {isSelected && !isLinked && (
                                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <svg
                                      className="h-3 w-3 text-primary-foreground"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {filteredAvailableEvidence.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">
                            No evidence found
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsLinkDialogOpen(false);
                          setSelectedEvidenceIds(new Set());
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleLinkEvidence}
                        disabled={selectedEvidenceIds.size === 0}
                      >
                        Link{" "}
                        {selectedEvidenceIds.size > 0 &&
                          `(${selectedEvidenceIds.size})`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {linkedEvidence.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
                  <Library className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No evidence linked yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Link existing evidence from your library or add new items
                      to build your protocol&apos;s evidence base.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadAvailableEvidence();
                        setIsLinkDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Link Existing
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/app/evidence">Evidence Library</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedEvidence.map((link: any) => (
                    <div
                      key={link.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {link.evidence_items.type}
                          </Badge>
                          {link.evidence_items.status === "published" && (
                            <Badge variant="secondary" className="text-xs">
                              Published
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">
                          {link.evidence_items.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {link.evidence_items.description}
                        </p>
                        {link.note && (
                          <div className="mt-2 rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">
                              <strong>Note:</strong> {link.note}
                            </p>
                          </div>
                        )}
                        {link.evidence_items.tags &&
                          link.evidence_items.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {link.evidence_items.tags
                                .slice(0, 3)
                                .map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              {link.evidence_items.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{link.evidence_items.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/evidence/${link.evidence_id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlinkEvidence(link.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Screening nudge — shown when evidence is linked but no screening started */}
          {linkedEvidence.length > 0 && (
            <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Filter className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Ready to screen your evidence
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {linkedEvidence.length} evidence{" "}
                  {linkedEvidence.length === 1 ? "item" : "items"}. Start the
                  screening pipeline to assess relevance.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/${protocolId}/screening`}>
                  Start Screening
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}

          {/* Linked Datasets Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Linked Datasets</CardTitle>
                  <CardDescription>
                    Data files supporting this protocol ({linkedDatasets.length}
                    )
                  </CardDescription>
                </div>
                <Dialog
                  open={isDatasetDialogOpen}
                  onOpenChange={setIsDatasetDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAvailableDatasets}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Dataset
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Link Dataset to Protocol</DialogTitle>
                      <DialogDescription>
                        Select datasets to link to this protocol
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search datasets..."
                          value={datasetSearchQuery}
                          onChange={(e) =>
                            setDatasetSearchQuery(e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {filteredAvailableDatasets.map((item) => {
                          const isLinked = linkedDatasets.some(
                            (link: any) => link.dataset_id === item.id,
                          );
                          const isSelected = selectedDatasetIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                                isLinked
                                  ? "opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                              }`}
                              onClick={() =>
                                !isLinked && toggleDatasetSelection(item.id)
                              }
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Database className="h-3 w-3 text-muted-foreground" />
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {item.dataset_type.replace("_", " ")}
                                    </Badge>
                                    {isLinked && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Already linked
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm line-clamp-1">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {item.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span>
                                      {formatFileSize(item.file_size)}
                                    </span>
                                    {item.row_count && (
                                      <span>
                                        {item.row_count.toLocaleString()} rows
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && !isLinked && (
                                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <svg
                                      className="h-3 w-3 text-primary-foreground"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {filteredAvailableDatasets.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">
                            No datasets found
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDatasetDialogOpen(false);
                          setSelectedDatasetIds(new Set());
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleLinkDataset}
                        disabled={selectedDatasetIds.size === 0}
                      >
                        Link{" "}
                        {selectedDatasetIds.size > 0 &&
                          `(${selectedDatasetIds.size})`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {linkedDatasets.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No datasets linked yet. Click &ldquo;Add Dataset&rdquo; to
                    link supporting data files.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedDatasets.map((link: any) => (
                    <div
                      key={link.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {link.datasets.dataset_type.replace("_", " ")}
                          </Badge>
                          {link.datasets.status === "validated" && (
                            <Badge variant="default" className="text-xs">
                              Validated
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">
                          {link.datasets.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {link.datasets.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{formatFileSize(link.datasets.file_size)}</span>
                          {link.datasets.row_count && (
                            <span>
                              {link.datasets.row_count.toLocaleString()} rows ×{" "}
                              {link.datasets.column_count} cols
                            </span>
                          )}
                        </div>
                        {link.note && (
                          <div className="mt-2 rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">
                              <strong>Note:</strong> {link.note}
                            </p>
                          </div>
                        )}
                        {link.datasets.tags &&
                          link.datasets.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {link.datasets.tags
                                .slice(0, 3)
                                .map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              {link.datasets.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{link.datasets.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadDataset(link.datasets.storage_path)
                          }
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/datasets/${link.dataset_id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlinkDataset(link.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Research Assistant */}
          {protocolId && (
            <AiAssistantPanel
              protocolId={protocolId}
              studyQuestion={form.getValues("study_question")}
              linkedEvidenceCount={linkedEvidence.length}
              linkedPmids={linkedPmids}
              onPicoGenerated={handlePicoGenerated}
              onEvidenceImported={loadLinkedEvidence}
            />
          )}

          {/* Reviews Section */}
          <ReviewPanel
            reviews={reviews}
            currentUserId={currentUserId}
            protocolId={protocolId}
            onRequestReview={handleRequestReview}
            onSubmitDecision={handleSubmitReviewDecision}
            onCancelReview={handleCancelReview}
          />

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Discuss this protocol with your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CommentInput
                onSubmit={handleCreateComment}
                placeholder="Share your thoughts about this protocol..."
              />

              {isLoadingComments ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading comments...
                </div>
              ) : (
                <CommentThread
                  comments={buildCommentThreads(comments)}
                  currentUserId={currentUserId}
                  onReply={handleReplyComment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PresenceProvider>
  );
}

/**
 * Tiny bridge component that sits inside PresenceProvider to connect
 * the broadcastSave function to the parent's ref (avoids restructuring
 * the entire component tree).
 */
function PresenceBridge({
  broadcastSaveRef,
}: {
  broadcastSaveRef: React.MutableRefObject<(email: string) => void>;
}) {
  const { broadcastSave } = usePresence();
  useEffect(() => {
    broadcastSaveRef.current = broadcastSave;
  }, [broadcastSave, broadcastSaveRef]);
  return null;
}
