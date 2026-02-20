"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPreview } from "@/components/datasets/data-preview";
import {
  fetchDatasetById,
  updateDataset,
  deleteDataset,
  getDatasetFileUrl,
  deleteDatasetFile,
  getLinkedProtocols,
} from "@/lib/supabase/datasets";
import { parseFile } from "@/lib/utils/file-parser";
import {
  datasetSchema,
  datasetTypes,
  datasetStatuses,
  suggestedDatasetTags,
  formatFileSize,
  getDatasetTypeLabel,
  type Dataset,
  type DatasetFormValues,
} from "@/lib/validators/dataset";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { CommentThread } from "@/components/collaboration/comment-thread";
import { CommentInput } from "@/components/collaboration/comment-input";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from "@/lib/supabase/comments";
import {
  buildCommentThreads,
  type CommentWithUser,
} from "@/lib/validators/comment";
import {
  Edit,
  Save,
  X,
  Download,
  Calendar,
  HardDrive,
  Grid3x3,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function DatasetDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const datasetId = params?.id;
  const { user } = useAuth();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parsedData, setParsedData] = useState<{
    data: Record<string, unknown>[];
    columns: string[];
  } | null>(null);
  const [linkedProtocols, setLinkedProtocols] = useState<any[]>([]);

  // Comments state
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const form = useForm<DatasetFormValues>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      name: "",
      description: "",
      dataset_type: "clinical_trial",
      tags: [],
      status: "draft",
    },
  });

  useEffect(() => {
    if (datasetId) {
      loadDataset();
      loadLinkedProtocols();
      loadComments();
    }
  }, [datasetId]);

  const loadDataset = async () => {
    if (!datasetId) return;

    const { data, error } = await fetchDatasetById(datasetId);

    if (error || !data) {
      toast.error("Failed to load dataset");
      setIsLoading(false);
      return;
    }

    setDataset(data);
    form.reset({
      name: data.name,
      description: data.description,
      dataset_type: data.dataset_type,
      tags: data.tags,
      date_range_start: data.date_range_start || undefined,
      date_range_end: data.date_range_end || undefined,
      status: data.status,
    });
    setIsLoading(false);
  };

  const loadLinkedProtocols = async () => {
    if (!datasetId) return;

    const { data } = await getLinkedProtocols(datasetId);
    if (data) {
      setLinkedProtocols(data);
    }
  };

  const loadComments = async () => {
    if (!datasetId) return;

    setIsLoadingComments(true);
    try {
      const { data, error } = await fetchComments("dataset", datasetId);
      if (!error && data) {
        setComments(data as CommentWithUser[]);
        setCommentCount(data.length);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    if (!datasetId) return;

    try {
      const { data, error } = await createComment({
        user_id: user!.id,
        resource_type: "dataset",
        resource_id: datasetId,
        content,
        mentions: [],
      });

      if (error || !data) {
        toast.error("Failed to post comment");
        return;
      }

      toast.success("Comment posted successfully");
      loadComments();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleReplyComment = async (parentId: string, content: string) => {
    if (!datasetId) return;

    try {
      const { data, error } = await createComment({
        user_id: user!.id,
        resource_type: "dataset",
        resource_id: datasetId,
        content,
        parent_id: parentId,
        mentions: [],
      });

      if (error || !data) {
        toast.error("Failed to post reply");
        return;
      }

      toast.success("Reply posted successfully");
      loadComments();
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
      loadComments();
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
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const loadFilePreview = async () => {
    if (!dataset || parsedData) return;

    const { data: urlData, error: urlError } = await getDatasetFileUrl(
      dataset.storage_path,
    );

    if (urlError || !urlData) {
      toast.error("Failed to load file preview");
      return;
    }

    try {
      const response = await fetch(urlData.signedUrl);
      const blob = await response.blob();
      const file = new File([blob], dataset.file_name, { type: blob.type });

      const parsed = await parseFile(file);

      if (parsed.error) {
        toast.warning(`Could not parse file: ${parsed.error}`);
        return;
      }

      setParsedData({
        data: parsed.data,
        columns: parsed.columns,
      });
    } catch (error) {
      toast.error("Failed to parse file");
    }
  };

  const handleSave = async (values: DatasetFormValues) => {
    if (!datasetId) return;

    setIsSaving(true);

    try {
      const { data, error } = await updateDataset(datasetId, values);

      if (error || !data) {
        throw new Error(error?.message || "Failed to update dataset");
      }

      setDataset(data);
      setIsEditing(false);

      toast.success("Dataset updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update dataset",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!dataset) return;

    const { data, error } = await getDatasetFileUrl(dataset.storage_path);

    if (error || !data) {
      toast.error("Failed to get download link");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!dataset || !datasetId) return;

    if (!window.confirm("Delete this dataset? This cannot be undone.")) return;

    setIsDeleting(true);

    try {
      // Delete file from storage
      await deleteDatasetFile(dataset.storage_path);

      // Delete dataset metadata
      const { error } = await deleteDataset(datasetId);

      if (error) {
        throw new Error(error.message || "Failed to delete dataset");
      }

      toast.success("Dataset deleted successfully");

      router.push("/app/datasets");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete dataset",
      );
      setIsDeleting(false);
    }
  };

  const toggleTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    form.setValue("tags", newTags);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading dataset...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>Dataset not found</CardTitle>
              <CardDescription>
                This dataset may have been deleted
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost">
                <Link href="/app/datasets">Back to datasets</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {getDatasetTypeLabel(dataset.dataset_type)}
                  </Badge>
                  <Badge
                    variant={
                      dataset.status === "validated"
                        ? "default"
                        : dataset.status === "draft"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {dataset.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{dataset.name}</CardTitle>
                <CardDescription>{dataset.description}</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
              value="preview"
              onClick={() => !parsedData && loadFilePreview()}
            >
              Preview
            </TabsTrigger>
            <TabsTrigger value="protocols">
              Linked Protocols ({linkedProtocols.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({commentCount})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)}>
                    <CardContent className="pt-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dataset Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dataset_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dataset Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {datasetTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {getDatasetTypeLabel(type)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="date_range_start"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date_range_end"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {field.value.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="default"
                                        className="cursor-pointer"
                                        onClick={() => toggleTag(tag)}
                                      >
                                        {tag}
                                        <X className="ml-1 h-3 w-3" />
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {suggestedDatasetTags
                                    .filter((tag) => !field.value.includes(tag))
                                    .slice(0, 15)
                                    .map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => toggleTag(tag)}
                                      >
                                        + {tag}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {datasetStatuses.map((status) => (
                                  <SelectItem
                                    key={status}
                                    value={status}
                                    className="capitalize"
                                  >
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={isDeleting || isSaving}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            loadDataset();
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Form>
              ) : (
                <CardContent className="pt-6 space-y-6">
                  {/* File Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">File Information</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">File:</span>
                        <span className="font-medium">{dataset.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">
                          {formatFileSize(dataset.file_size)}
                        </span>
                      </div>
                      {dataset.row_count && (
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Dimensions:
                          </span>
                          <span className="font-medium">
                            {dataset.row_count.toLocaleString()} rows ×{" "}
                            {dataset.column_count} columns
                          </span>
                        </div>
                      )}
                      {dataset.date_range_start && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Date Range:
                          </span>
                          <span className="font-medium">
                            {new Date(
                              dataset.date_range_start,
                            ).toLocaleDateString()}
                            {dataset.date_range_end &&
                              ` - ${new Date(dataset.date_range_end).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {dataset.tags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {dataset.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>First 50 rows of the dataset</CardDescription>
              </CardHeader>
              <CardContent>
                {parsedData ? (
                  <DataPreview
                    data={parsedData.data}
                    columns={parsedData.columns}
                    maxRows={50}
                  />
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Loading preview...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Linked Protocols Tab */}
          <TabsContent value="protocols">
            <Card>
              <CardHeader>
                <CardTitle>Linked Protocols</CardTitle>
                <CardDescription>
                  Study protocols using this dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedProtocols.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No protocols linked to this dataset yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedProtocols.map((link: any) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-1">
                            {link.protocols.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {link.protocols.study_question}
                          </p>
                          {link.note && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <strong>Note:</strong> {link.note}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/${link.protocols.id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>
                  Discuss this dataset with your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <CommentInput
                  onSubmit={handleCreateComment}
                  placeholder="Share your thoughts about this dataset..."
                />

                {isLoadingComments ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Loading comments...
                  </div>
                ) : (
                  <CommentThread
                    comments={buildCommentThreads(comments)}
                    currentUserId={user?.id ?? ""}
                    onReply={handleReplyComment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
