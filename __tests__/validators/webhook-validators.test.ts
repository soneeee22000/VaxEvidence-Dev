import { describe, it, expect } from "vitest";
import {
  webhookCreateSchema,
  webhookUpdateSchema,
  WEBHOOK_EVENTS,
  deliveryStatuses,
} from "@/lib/validators/webhook";

describe("webhookCreateSchema", () => {
  const validPayload = {
    url: "https://example.com/webhook",
    events: ["protocol.created"] as const,
    description: "Notify on protocol creation",
  };

  it("accepts a fully populated valid payload", () => {
    const result = webhookCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal payload without description", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://hooks.example.org/receive",
      events: ["evidence.created"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid event types individually", () => {
    for (const event of WEBHOOK_EVENTS) {
      const result = webhookCreateSchema.safeParse({
        url: "https://example.com/hook",
        events: [event],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts multiple events", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: ["protocol.created", "evidence.created", "export.generated"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events).toHaveLength(3);
    }
  });

  it("rejects missing url", () => {
    const result = webhookCreateSchema.safeParse({
      events: ["protocol.created"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid url", () => {
    const result = webhookCreateSchema.safeParse({
      url: "not-a-url",
      events: ["protocol.created"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const urlIssue = result.error.issues.find((i) =>
        i.message.includes("valid URL"),
      );
      expect(urlIssue).toBeDefined();
    }
  });

  it("rejects missing events", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty events array", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const minIssue = result.error.issues.find((i) =>
        i.message.includes("At least one event"),
      );
      expect(minIssue).toBeDefined();
    }
  });

  it("rejects an invalid event type", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: ["user.deleted"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 500 characters", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: ["protocol.created"],
      description: "D".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description at exactly 500 characters", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: ["protocol.created"],
      description: "D".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-string url", () => {
    const result = webhookCreateSchema.safeParse({
      url: 12345,
      events: ["protocol.created"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-array events", () => {
    const result = webhookCreateSchema.safeParse({
      url: "https://example.com/hook",
      events: "protocol.created",
    });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = webhookCreateSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects completely empty input", () => {
    const result = webhookCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("webhookUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = webhookUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts updating only url", () => {
    const result = webhookUpdateSchema.safeParse({
      url: "https://new-url.example.com/hook",
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating only events", () => {
    const result = webhookUpdateSchema.safeParse({
      events: ["evidence.deleted", "dataset.created"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating only description", () => {
    const result = webhookUpdateSchema.safeParse({
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating is_active boolean", () => {
    const result = webhookUpdateSchema.safeParse({
      is_active: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(false);
    }
  });

  it("rejects invalid url in update", () => {
    const result = webhookUpdateSchema.safeParse({
      url: "not-valid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty events array in update", () => {
    const result = webhookUpdateSchema.safeParse({
      events: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean is_active", () => {
    const result = webhookUpdateSchema.safeParse({
      is_active: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 500 characters in update", () => {
    const result = webhookUpdateSchema.safeParse({
      description: "X".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("WEBHOOK_EVENTS constant", () => {
  it("exports exactly 8 event types", () => {
    expect(WEBHOOK_EVENTS).toHaveLength(8);
  });

  it("contains protocol events", () => {
    expect(WEBHOOK_EVENTS).toContain("protocol.created");
    expect(WEBHOOK_EVENTS).toContain("protocol.updated");
  });

  it("contains evidence events", () => {
    expect(WEBHOOK_EVENTS).toContain("evidence.created");
    expect(WEBHOOK_EVENTS).toContain("evidence.updated");
    expect(WEBHOOK_EVENTS).toContain("evidence.deleted");
  });

  it("contains screening event", () => {
    expect(WEBHOOK_EVENTS).toContain("screening.decision_made");
  });

  it("contains dataset event", () => {
    expect(WEBHOOK_EVENTS).toContain("dataset.created");
  });

  it("contains export event", () => {
    expect(WEBHOOK_EVENTS).toContain("export.generated");
  });
});

describe("deliveryStatuses constant", () => {
  it("exports exactly 3 delivery statuses", () => {
    expect(deliveryStatuses).toHaveLength(3);
  });

  it("contains pending, delivered, and failed", () => {
    expect(deliveryStatuses).toContain("pending");
    expect(deliveryStatuses).toContain("delivered");
    expect(deliveryStatuses).toContain("failed");
  });
});
