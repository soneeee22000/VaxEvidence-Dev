"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import {
  fetchEvidenceById,
  updateEvidence,
  deleteEvidence,
  getLinkedProtocols,
} from "@/lib/supabase/evidence"
import type { EvidenceItem } from "@/lib/validators/evidence"
import {
  evidenceTypes,
  evidenceStatuses,
  suggestedTags,
} from "@/lib/validators/evidence"
import { ArrowLeft, Edit, Save, Trash2, ExternalLink, MessageSquare } from "lucide-react"
import { DEV_USER } from "@/lib/auth/dev-auth"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentThread } from "@/components/collaboration/comment-thread"
import { CommentInput } from "@/components/collaboration/comment-input"
import { fetchComments, createComment, updateComment, deleteComment } from "@/lib/supabase/comments"
import { buildCommentThreads, type CommentWithUser } from "@/lib/validators/comment"

export default function EvidenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [evidence, setEvidence] = useState<EvidenceItem | null>(null)
  const [linkedProtocols, setLinkedProtocols] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Comments state
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  // Form state
  const [formData, setFormData] = useState<Partial<EvidenceItem>>({})
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    async function loadEvidence() {
      if (!params.id || typeof params.id !== "string") return

      setIsLoading(true)
      try {
        const { data, error } = await fetchEvidenceById(params.id)

        if (error || !data) {
          toast({
            title: "Error",
            description: "Evidence not found",
            variant: "destructive",
          })
          router.push("/app/evidence")
          return
        }

        setEvidence(data)
        setFormData(data)

        // Load linked protocols
        const { data: linksData } = await getLinkedProtocols(params.id)
        if (linksData) {
          setLinkedProtocols(linksData)
        }

        // Load comments
        loadComments()
      } catch (error) {
        console.error("Error loading evidence:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvidence()
  }, [params.id, router, toast])

  const loadComments = async () => {
    if (!params.id || typeof params.id !== "string") return

    setIsLoadingComments(true)
    try {
      const { data, error } = await fetchComments("evidence_item", params.id)
      if (!error && data) {
        setComments(data as CommentWithUser[])
        setCommentCount(data.length)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleCreateComment = async (content: string) => {
    if (!params.id || typeof params.id !== "string") return

    try {
      const { data, error } = await createComment({
        user_id: DEV_USER.id,
        resource_type: "evidence_item",
        resource_id: params.id,
        content,
        mentions: [],
      })

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Comment posted successfully",
      })
      loadComments()
    } catch (error) {
      console.error("Error creating comment:", error)
    }
  }

  const handleReplyComment = async (parentId: string, content: string) => {
    if (!params.id || typeof params.id !== "string") return

    try {
      const { data, error } = await createComment({
        user_id: DEV_USER.id,
        resource_type: "evidence_item",
        resource_id: params.id,
        content,
        parent_id: parentId,
        mentions: [],
      })

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to post reply",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Reply posted successfully",
      })
      loadComments()
    } catch (error) {
      console.error("Error replying to comment:", error)
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const { error } = await updateComment(commentId, { content })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update comment",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Comment updated successfully",
      })
      loadComments()
    } catch (error) {
      console.error("Error updating comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await deleteComment(commentId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })
      loadComments()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleSave = async () => {
    if (!evidence || !params.id || typeof params.id !== "string") return

    setIsSaving(true)
    try {
      const { data, error } = await updateEvidence(params.id, formData)

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to update evidence",
          variant: "destructive",
        })
        return
      }

      setEvidence(data)
      setFormData(data)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Evidence updated successfully",
      })
    } catch (error) {
      console.error("Error saving evidence:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!params.id || typeof params.id !== "string") return

    setIsDeleting(true)
    try {
      const { error } = await deleteEvidence(params.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete evidence",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Evidence deleted successfully",
      })
      router.push("/app/evidence")
    } catch (error) {
      console.error("Error deleting evidence:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return
    const currentTags = formData.tags || []
    if (!currentTags.includes(tag)) {
      setFormData({ ...formData, tags: [...currentTags, tag] })
    }
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || []
    setFormData({
      ...formData,
      tags: currentTags.filter((tag) => tag !== tagToRemove),
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (!evidence) return null

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/evidence">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        this evidence item.
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
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(evidence)
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Evidence Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {evidence.type}
              </Badge>
              <Badge
                variant={evidence.status === "published" ? "default" : "secondary"}
                className="capitalize"
              >
                {evidence.status}
              </Badge>
            </div>
            {isEditing ? (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="text-2xl mt-4">{evidence.title}</CardTitle>
                <CardDescription>
                  Updated {new Date(evidence.updated_at).toLocaleDateString()}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <Label>Description</Label>
              {isEditing ? (
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                  {evidence.description}
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            {evidence.type === "academic" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="authors">Authors</Label>
                  {isEditing ? (
                    <Input
                      id="authors"
                      value={formData.authors || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, authors: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm">{evidence.authors || "—"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="journal">Journal</Label>
                  {isEditing ? (
                    <Input
                      id="journal"
                      value={formData.journal || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, journal: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm">{evidence.journal || "—"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="doi">DOI</Label>
                  {isEditing ? (
                    <Input
                      id="doi"
                      value={formData.doi || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, doi: e.target.value })
                      }
                      placeholder="10.XXXX/..."
                    />
                  ) : evidence.doi ? (
                    <a
                      href={`https://doi.org/${evidence.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {evidence.doi}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm">—</p>
                  )}
                </div>
              </div>
            )}

            {evidence.type === "regulatory" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="regulatory_body">Regulatory Body</Label>
                  {isEditing ? (
                    <Input
                      id="regulatory_body"
                      value={formData.regulatory_body || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regulatory_body: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm">
                      {evidence.regulatory_body || "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="document_type">Document Type</Label>
                  {isEditing ? (
                    <Input
                      id="document_type"
                      value={formData.document_type || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          document_type: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm">
                      {evidence.document_type || "—"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(evidence.type === "dataset" ||
              evidence.type === "regulatory" ||
              evidence.type === "academic") && (
              <div>
                <Label htmlFor="source_url">Source URL</Label>
                {isEditing ? (
                  <Input
                    id="source_url"
                    type="url"
                    value={formData.source_url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, source_url: e.target.value })
                    }
                  />
                ) : evidence.source_url ? (
                  <a
                    href={evidence.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {evidence.source_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="mt-1 text-sm">—</p>
                )}
              </div>
            )}

            {/* Publication Date */}
            <div>
              <Label htmlFor="publication_date">Publication Date</Label>
              {isEditing ? (
                <Input
                  id="publication_date"
                  type="date"
                  value={formData.publication_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publication_date: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">
                  {evidence.publication_date
                    ? new Date(evidence.publication_date).toLocaleDateString()
                    : "—"}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag(tagInput)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddTag(tagInput)}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {evidence.tags && evidence.tags.length > 0 ? (
                    evidence.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Linked Protocols & Comments */}
        <Card>
          <Tabs defaultValue="protocols" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="protocols">
                  Linked Protocols ({linkedProtocols.length})
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments ({commentCount})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="protocols" className="mt-0">
                {linkedProtocols.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      This evidence is not linked to any protocols yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedProtocols.map((link: any) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{link.protocols.title}</p>
                          {link.note && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {link.note}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/${link.protocol_id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="comments" className="mt-0 space-y-6">
                <CommentInput
                  onSubmit={handleCreateComment}
                  placeholder="Share your thoughts about this evidence..."
                />
                
                {isLoadingComments ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Loading comments...
                  </div>
                ) : (
                  <CommentThread
                    comments={buildCommentThreads(comments)}
                    currentUserId={DEV_USER.id}
                    onReply={handleReplyComment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}
