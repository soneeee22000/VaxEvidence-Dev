import { describe, it, expect } from "vitest";
import {
  COLLABORATOR_COLORS,
  COLLABORATOR_RING_CLASSES,
  COLLABORATOR_BG_CLASSES,
  getUserColorIndex,
  getUserColor,
} from "@/lib/collaboration/constants";

describe("COLLABORATOR_COLORS", () => {
  it("has exactly 8 color entries", () => {
    expect(COLLABORATOR_COLORS).toHaveLength(8);
  });

  it("all entries are valid OKLCH strings", () => {
    for (const color of COLLABORATOR_COLORS) {
      expect(color).toMatch(/^oklch\(/);
    }
  });
});

describe("COLLABORATOR_RING_CLASSES", () => {
  it("has exactly 8 ring class entries", () => {
    expect(COLLABORATOR_RING_CLASSES).toHaveLength(8);
  });

  it("all entries are Tailwind ring classes", () => {
    for (const cls of COLLABORATOR_RING_CLASSES) {
      expect(cls).toMatch(/^ring-/);
    }
  });

  it("has same length as COLLABORATOR_COLORS", () => {
    expect(COLLABORATOR_RING_CLASSES.length).toBe(COLLABORATOR_COLORS.length);
  });
});

describe("COLLABORATOR_BG_CLASSES", () => {
  it("has exactly 8 bg class entries", () => {
    expect(COLLABORATOR_BG_CLASSES).toHaveLength(8);
  });

  it("all entries are Tailwind bg classes", () => {
    for (const cls of COLLABORATOR_BG_CLASSES) {
      expect(cls).toMatch(/^bg-/);
    }
  });

  it("has same length as COLLABORATOR_COLORS", () => {
    expect(COLLABORATOR_BG_CLASSES.length).toBe(COLLABORATOR_COLORS.length);
  });
});

describe("getUserColorIndex", () => {
  it("returns a number in range [0, 7]", () => {
    const index = getUserColorIndex("user-123");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(8);
  });

  it("is deterministic — same input always returns same index", () => {
    const a = getUserColorIndex("user-abc");
    const b = getUserColorIndex("user-abc");
    expect(a).toBe(b);
  });

  it("different userIds can produce different indices", () => {
    const indices = new Set<number>();
    const ids = [
      "alice",
      "bob",
      "charlie",
      "dave",
      "eve",
      "frank",
      "grace",
      "heidi",
      "ivan",
      "judy",
    ];
    for (const id of ids) {
      indices.add(getUserColorIndex(id));
    }
    // With 10 diverse strings and 8 buckets, expect at least 2 distinct values
    expect(indices.size).toBeGreaterThanOrEqual(2);
  });

  it("handles empty string without throwing", () => {
    const index = getUserColorIndex("");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(8);
  });

  it("handles UUID-style userId", () => {
    const index = getUserColorIndex("550e8400-e29b-41d4-a716-446655440000");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(8);
  });
});

describe("getUserColor", () => {
  it("returns a valid OKLCH color string", () => {
    const color = getUserColor("user-123");
    expect(color).toMatch(/^oklch\(/);
  });

  it("is deterministic — same userId always returns same color", () => {
    const a = getUserColor("user-xyz");
    const b = getUserColor("user-xyz");
    expect(a).toBe(b);
  });

  it("returns a value from the COLLABORATOR_COLORS array", () => {
    const color = getUserColor("any-user-id");
    expect(COLLABORATOR_COLORS).toContain(color);
  });
});
