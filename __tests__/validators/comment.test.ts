import { describe, it, expect } from "vitest";
import {
  commentCreateSchema,
  commentUpdateSchema,
  buildCommentThreads,
  extractMentions,
  getRelativeTime,
  commentResourceTypes,
} from "@/lib/validators/comment";
import type { CommentWithUser } from "@/lib/validators/comment";

describe("commentCreateSchema", () => {
  const validComment = {
    resource_type: "protocol" as const,
    resource_id: "550e8400-e29b-41d4-a716-446655440000",
    content: "This protocol needs more detail in the population section.",
  };

  it("accepts valid comment", () => {
    const result = commentCreateSchema.safeParse(validComment);
    expect(result.success).toBe(true);
  });

  it("accepts all resource types", () => {
    for (const type of commentResourceTypes) {
      const result = commentCreateSchema.safeParse({
        ...validComment,
        resource_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid resource type", () => {
    const result = commentCreateSchema.safeParse({
      ...validComment,
      resource_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID resource_id", () => {
    const result = commentCreateSchema.safeParse({
      ...validComment,
      resource_id: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = commentCreateSchema.safeParse({
      ...validComment,
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 10000 characters", () => {
    const result = commentCreateSchema.safeParse({
      ...validComment,
      content: "x".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional parent_id", () => {
    const result = commentCreateSchema.safeParse({
      ...validComment,
      parent_id: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("defaults mentions to empty array", () => {
    const result = commentCreateSchema.safeParse(validComment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mentions).toEqual([]);
    }
  });
});

describe("commentUpdateSchema", () => {
  it("accepts valid update", () => {
    const result = commentUpdateSchema.safeParse({
      content: "Updated comment",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = commentUpdateSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});

describe("buildCommentThreads", () => {
  const makeComment = (
    id: string,
    parentId: string | null = null,
  ): CommentWithUser => ({
    id,
    user_id: "user-1",
    resource_type: "protocol",
    resource_id: "resource-1",
    parent_id: parentId,
    content: `Comment ${id}`,
    mentions: [],
    is_edited: false,
    is_deleted: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    user: { id: "user-1", email: "test@example.com" },
  });

  it("returns empty array for no comments", () => {
    expect(buildCommentThreads([])).toEqual([]);
  });

  it("returns root comments without parents", () => {
    const comments = [makeComment("1"), makeComment("2")];
    const threads = buildCommentThreads(comments);
    expect(threads).toHaveLength(2);
  });

  it("nests replies under parent", () => {
    const comments = [makeComment("1"), makeComment("2", "1")];
    const threads = buildCommentThreads(comments);
    expect(threads).toHaveLength(1);
    expect(threads[0].replies).toHaveLength(1);
    expect(threads[0].replies[0].id).toBe("2");
  });

  it("handles deeply nested replies", () => {
    const comments = [
      makeComment("1"),
      makeComment("2", "1"),
      makeComment("3", "2"),
    ];
    const threads = buildCommentThreads(comments);
    expect(threads).toHaveLength(1);
    expect(threads[0].replies[0].replies).toHaveLength(1);
  });
});

describe("extractMentions", () => {
  it("extracts UUID mentions from text", () => {
    const text = "Hey @[550e8400-e29b-41d4-a716-446655440000] check this out";
    const mentions = extractMentions(text);
    expect(mentions).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("extracts multiple mentions", () => {
    const text =
      "@[550e8400-e29b-41d4-a716-446655440000] and @[660e8400-e29b-41d4-a716-446655440001]";
    const mentions = extractMentions(text);
    expect(mentions).toHaveLength(2);
  });

  it("deduplicates mentions", () => {
    const text =
      "@[550e8400-e29b-41d4-a716-446655440000] and @[550e8400-e29b-41d4-a716-446655440000]";
    const mentions = extractMentions(text);
    expect(mentions).toHaveLength(1);
  });

  it("returns empty array for no mentions", () => {
    expect(extractMentions("No mentions here")).toEqual([]);
  });
});

describe("getRelativeTime", () => {
  it("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(getRelativeTime(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(getRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe("2 hours ago");
  });
});
