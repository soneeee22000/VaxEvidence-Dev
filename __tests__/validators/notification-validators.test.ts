import { describe, it, expect } from "vitest";
import {
  notificationSchema,
  notificationTypes,
  notificationResourceTypes,
} from "@/lib/validators/notification";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440001";

describe("notificationSchema", () => {
  const validPayload = {
    user_id: VALID_UUID,
    type: "mention" as const,
    title: "You were mentioned",
    resource_type: "comment" as const,
    resource_id: VALID_UUID_2,
  };

  describe("valid payloads", () => {
    it("accepts a valid minimal payload", () => {
      const result = notificationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("accepts all notification types", () => {
      for (const type of notificationTypes) {
        const result = notificationSchema.safeParse({
          ...validPayload,
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all resource types", () => {
      for (const resourceType of notificationResourceTypes) {
        const result = notificationSchema.safeParse({
          ...validPayload,
          resource_type: resourceType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts optional body", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        body: "Additional details about the mention",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null body", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        body: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional protocol_id", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        protocol_id: VALID_UUID,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null protocol_id", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        protocol_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional created_by", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        created_by: VALID_UUID_2,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null created_by", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        created_by: null,
      });
      expect(result.success).toBe(true);
    });

    it("defaults is_read to false", () => {
      const result = notificationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_read).toBe(false);
      }
    });

    it("accepts explicit is_read value", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        is_read: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_read).toBe(true);
      }
    });
  });

  describe("invalid payloads", () => {
    it("rejects invalid notification type", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        type: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid resource type", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        resource_type: "invalid_resource",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID user_id", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        user_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID resource_id", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        resource_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID protocol_id when provided", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        protocol_id: "bad",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID created_by when provided", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        created_by: "bad",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title longer than 500 characters", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        title: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("rejects body longer than 2000 characters", () => {
      const result = notificationSchema.safeParse({
        ...validPayload,
        body: "x".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing user_id", () => {
      const { user_id, ...rest } = validPayload;
      const result = notificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing type", () => {
      const { type, ...rest } = validPayload;
      const result = notificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing title", () => {
      const { title, ...rest } = validPayload;
      const result = notificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing resource_type", () => {
      const { resource_type, ...rest } = validPayload;
      const result = notificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing resource_id", () => {
      const { resource_id, ...rest } = validPayload;
      const result = notificationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });
});

describe("type constants", () => {
  it("exports 5 notification types", () => {
    expect(notificationTypes).toHaveLength(5);
    expect(notificationTypes).toContain("mention");
    expect(notificationTypes).toContain("comment");
    expect(notificationTypes).toContain("review_requested");
    expect(notificationTypes).toContain("review_completed");
    expect(notificationTypes).toContain("protocol_updated");
  });

  it("exports 3 notification resource types", () => {
    expect(notificationResourceTypes).toHaveLength(3);
    expect(notificationResourceTypes).toContain("protocol");
    expect(notificationResourceTypes).toContain("comment");
    expect(notificationResourceTypes).toContain("review");
  });
});
