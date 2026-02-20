import { describe, it, expect } from "vitest";
import {
  waitlistRequestSchema,
  normalizeWaitlistRequest,
} from "@/lib/validators/waitlist";

describe("waitlistRequestSchema", () => {
  it("accepts valid email", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = waitlistRequestSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = waitlistRequestSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects email over 254 characters", () => {
    const email = "a".repeat(246) + "@test.com"; // 255 chars, exceeds 254 max
    const result = waitlistRequestSchema.safeParse({ email });
    expect(result.success).toBe(false);
  });

  it("trims email whitespace", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "  user@example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("accepts optional name", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "user@example.com",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional source", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "user@example.com",
      source: "twitter",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name over 100 characters", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "user@example.com",
      name: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts honeypot field", () => {
    const result = waitlistRequestSchema.safeParse({
      email: "user@example.com",
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("normalizeWaitlistRequest", () => {
  it("normalizes valid request", () => {
    const normalized = normalizeWaitlistRequest({
      email: "user@example.com",
      name: "  John Doe  ",
      source: "  twitter  ",
    });
    expect(normalized.email).toBe("user@example.com");
    expect(normalized.name).toBe("John Doe");
    expect(normalized.source).toBe("twitter");
  });

  it("sets name to null when empty", () => {
    const normalized = normalizeWaitlistRequest({
      email: "user@example.com",
      name: "   ",
    });
    expect(normalized.name).toBeNull();
  });

  it("sets source to null when empty", () => {
    const normalized = normalizeWaitlistRequest({
      email: "user@example.com",
      source: "   ",
    });
    expect(normalized.source).toBeNull();
  });

  it("sets honeypot to empty string when undefined", () => {
    const normalized = normalizeWaitlistRequest({
      email: "user@example.com",
    });
    expect(normalized.honeypot).toBe("");
  });
});
