"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { CommentInput } from "./comment-input"
import { MessageSquare, Edit, Trash2, Reply } from "lucide-react"
import type { CommentThread as CommentThreadType } from "@/lib/validators/comment"
import { getRelativeTime } from "@/lib/validators/comment"

interface CommentThreadProps {
  comments: CommentThreadType[]
  currentUserId: string
  onReply: (parentId: string, content: string) => Promise<void>
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

export function CommentThread({
  comments,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: CommentThreadProps) {
  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            depth={0}
          />
        ))
      )}
    </div>
  )
}

interface CommentProps {
  comment: CommentThreadType
  currentUserId: string
  onReply: (parentId: string, content: string) => Promise<void>
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  depth: number
}

function Comment({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const isOwner = comment.user_id === currentUserId
  const maxDepth = 3

  const handleReply = async (content: string) => {
    await onReply(comment.id, content)
    setIsReplying(false)
  }

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await onDelete(comment.id)
  }

  if (comment.is_deleted) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground italic">
          [This comment has been deleted]
        </p>
      </div>
    )
  }

  return (
    <div
      className="space-y-3"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 1.5}rem` : 0 }}
    >
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.user.email.split("@")[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {getRelativeTime(comment.created_at)}
              </span>
              {comment.is_edited && (
                <Badge variant="secondary" className="text-xs">
                  edited
                </Badge>
              )}
            </div>

            {isEditing ? (
              <CommentInput
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                initialValue={comment.content}
                submitLabel="Save"
                isReply={true}
                autoFocus={true}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your comment.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {!isEditing && depth < maxDepth && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="mr-2 h-3 w-3" />
              Reply
            </Button>
          </div>
        )}

        {isReplying && (
          <div className="mt-3 pt-3 border-t">
            <CommentInput
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              submitLabel="Reply"
              isReply={true}
              autoFocus={true}
            />
          </div>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
