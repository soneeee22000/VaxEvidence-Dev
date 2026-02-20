import { describe, it, expect } from "vitest";
import {
  reviewRequestSchema,
  reviewDecisionSchema,
  getReviewStatusColor,
  getReviewStatusLabel,
  areAllReviewsApproved,
  hasRejectedReview,
  getPendingReviewers,
  reviewStatuses,
} from "@/lib/validators/review";
import type { Review, ReviewWithDetails } from "@/lib/validators/review";

describe("reviewRequestSchema", () => {
  const validRequest = {
    protocol_id: "550e8400-e29b-41d4-a716-446655440000",
    reviewer_id: "660e8400-e29b-41d4-a716-446655440001",
  };

  it("accepts valid review request", () => {
    const result = reviewRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("accepts optional message", () => {
    const result = reviewRequestSchema.safeParse({
      ...validRequest,
      message: "Please review the PICO section",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = reviewRequestSchema.safeParse({
      ...validRequest,
      protocol_id: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID reviewer_id", () => {
    const result = reviewRequestSchema.safeParse({
      ...validRequest,
      reviewer_id: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 1000 characters", () => {
    const result = reviewRequestSchema.safeParse({
      ...validRequest,
      message: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewDecisionSchema", () => {
  it("accepts approved with reason", () => {
    const result = reviewDecisionSchema.safeParse({
      status: "approved",
      decision: "The protocol meets all requirements and is well-structured.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts rejected with reason", () => {
    const result = reviewDecisionSchema.safeParse({
      status: "rejected",
      decision: "The population definition is too broad and needs refinement.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts changes_requested with reason", () => {
    const result = reviewDecisionSchema.safeParse({
      status: "changes_requested",
      decision:
        "Please add more detail to the comparator section of the protocol.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects decision shorter than 10 characters", () => {
    const result = reviewDecisionSchema.safeParse({
      status: "approved",
      decision: "OK",
    });
    expect(result.success).toBe(false);
  });

  it("rejects pending as a decision status", () => {
    const result = reviewDecisionSchema.safeParse({
      status: "pending",
      decision: "This should not be valid as a decision",
    });
    expect(result.success).toBe(false);
  });
});

describe("getReviewStatusColor", () => {
  it("returns a class string for each status", () => {
    for (const status of reviewStatuses) {
      expect(getReviewStatusColor(status)).toBeTruthy();
    }
  });
});

describe("getReviewStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getReviewStatusLabel("approved")).toBe("Approved");
    expect(getReviewStatusLabel("rejected")).toBe("Rejected");
    expect(getReviewStatusLabel("changes_requested")).toBe("Changes Requested");
    expect(getReviewStatusLabel("pending")).toBe("Pending Review");
  });
});

describe("areAllReviewsApproved", () => {
  const makeReview = (status: string): Review => ({
    id: "1",
    protocol_id: "p1",
    reviewer_id: "r1",
    requester_id: "req1",
    status: status as Review["status"],
    decision: null,
    decision_at: null,
    requested_at: "2026-01-01",
    updated_at: "2026-01-01",
  });

  it("returns false for empty array", () => {
    expect(areAllReviewsApproved([])).toBe(false);
  });

  it("returns true when all approved", () => {
    expect(
      areAllReviewsApproved([makeReview("approved"), makeReview("approved")]),
    ).toBe(true);
  });

  it("returns false when any not approved", () => {
    expect(
      areAllReviewsApproved([makeReview("approved"), makeReview("pending")]),
    ).toBe(false);
  });
});

describe("hasRejectedReview", () => {
  const makeReview = (status: string): Review => ({
    id: "1",
    protocol_id: "p1",
    reviewer_id: "r1",
    requester_id: "req1",
    status: status as Review["status"],
    decision: null,
    decision_at: null,
    requested_at: "2026-01-01",
    updated_at: "2026-01-01",
  });

  it("returns false when no rejections", () => {
    expect(
      hasRejectedReview([makeReview("approved"), makeReview("pending")]),
    ).toBe(false);
  });

  it("returns true when any rejected", () => {
    expect(
      hasRejectedReview([makeReview("approved"), makeReview("rejected")]),
    ).toBe(true);
  });
});
