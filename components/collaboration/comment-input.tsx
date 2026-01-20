"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  initialValue?: string
  submitLabel?: string
  isReply?: boolean
  autoFocus?: boolean
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  initialValue = "",
  submitLabel = "Comment",
  isReply = false,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(content)
      setContent("")
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setContent(initialValue)
    onCancel?.()
  }

  const charCount = content.length
  const maxChars = 10000

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="comment" className="sr-only">
          {placeholder}
        </Label>
        <Textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          className="resize-none"
          autoFocus={autoFocus}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {charCount} / {maxChars}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting || charCount > maxChars}
          >
            {isSubmitting ? "Posting..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
