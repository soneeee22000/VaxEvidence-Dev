"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, AlertCircle, Clock, UserPlus } from "lucide-react"
import type { ReviewWithDetails, ReviewStatus } from "@/lib/validators/review"
import { getReviewStatusLabel } from "@/lib/validators/review"

interface ReviewPanelProps {
  reviews: ReviewWithDetails[]
  currentUserId: string
  protocolId: string
  onRequestReview: (reviewerId: string) => Promise<void>
  onSubmitDecision: (reviewId: string, status: ReviewStatus, decision: string) => Promise<void>
  onCancelReview: (reviewId: string) => Promise<void>
}

export function ReviewPanel({
  reviews,
  currentUserId,
  protocolId,
  onRequestReview,
  onSubmitDecision,
  onCancelReview,
}: ReviewPanelProps) {
  const pendingReviews = reviews.filter((r) => r.status === "pending")
  const completedReviews = reviews.filter((r) => r.status !== "pending")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>
              {pendingReviews.length > 0
                ? `${pendingReviews.length} pending review(s)`
                : reviews.length > 0
                  ? "All reviews completed"
                  : "No reviews requested yet"}
            </CardDescription>
          </div>
          <RequestReviewDialog onRequestReview={onRequestReview} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No reviews yet. Request a review to get feedback on this protocol.
            </p>
          </div>
        ) : (
          <>
            {pendingReviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Pending Reviews</h4>
                {pendingReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={currentUserId}
                    onSubmitDecision={onSubmitDecision}
                    onCancelReview={onCancelReview}
                  />
                ))}
              </div>
            )}

            {completedReviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Completed Reviews</h4>
                {completedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={currentUserId}
                    onSubmitDecision={onSubmitDecision}
                    onCancelReview={onCancelReview}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface ReviewCardProps {
  review: ReviewWithDetails
  currentUserId: string
  onSubmitDecision: (reviewId: string, status: ReviewStatus, decision: string) => Promise<void>
  onCancelReview: (reviewId: string) => Promise<void>
}

function ReviewCard({
  review,
  currentUserId,
  onSubmitDecision,
  onCancelReview,
}: ReviewCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [decision, setDecision] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | "">("")

  const isReviewer = review.reviewer_id === currentUserId
  const isPending = review.status === "pending"

  const handleSubmit = async () => {
    if (!selectedStatus || !decision.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmitDecision(review.id, selectedStatus as ReviewStatus, decision)
      setDecision("")
      setSelectedStatus("")
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "changes_requested":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusBadgeVariant = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "changes_requested":
        return "secondary"
      case "pending":
        return "outline"
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(review.status)}
            <span className="font-medium text-sm">
              {review.reviewer.email.split("@")[0]}
            </span>
            <Badge variant={getStatusBadgeVariant(review.status)}>
              {getReviewStatusLabel(review.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Requested by {review.requester.email.split("@")[0]} •{" "}
            {new Date(review.requested_at).toLocaleDateString()}
          </p>
        </div>
        {isReviewer && isPending && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelReview(review.id)}
          >
            Cancel
          </Button>
        )}
      </div>

      {review.decision && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm whitespace-pre-wrap">{review.decision}</p>
          {review.decision_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Decided on {new Date(review.decision_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {isReviewer && isPending && (
        <div className="space-y-3 pt-3 border-t">
          <div>
            <Label htmlFor={`decision-${review.id}`}>Your Decision</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ReviewStatus)}
            >
              <SelectTrigger id={`decision-${review.id}`}>
                <SelectValue placeholder="Select decision..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
                <SelectItem value="changes_requested">Request Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`reasoning-${review.id}`}>Reasoning</Label>
            <Textarea
              id={`reasoning-${review.id}`}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Provide detailed feedback..."
              rows={4}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || !decision.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      )}
    </div>
  )
}

interface RequestReviewDialogProps {
  onRequestReview: (reviewerId: string) => Promise<void>
}

function RequestReviewDialog({ onRequestReview }: RequestReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reviewerId, setReviewerId] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequest = async () => {
    if (!reviewerId) return

    setIsRequesting(true)
    try {
      await onRequestReview(reviewerId)
      setReviewerId("")
      setIsOpen(false)
    } catch (error) {
      console.error("Error requesting review:", error)
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Request Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Review</DialogTitle>
          <DialogDescription>
            Request a team member to review this protocol
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reviewer">Reviewer User ID</Label>
            <input
              id="reviewer"
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For demo: use {" "}550e8400-e29b-41d4-a716-446655440000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequest} disabled={!reviewerId || isRequesting}>
            {isRequesting ? "Requesting..." : "Request Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
