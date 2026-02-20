import { describe, it, expect } from "vitest";
import {
  computeContentHash,
  verifyContentHash,
  serializeForHashing,
} from "@/lib/utils/content-hash";

describe("serializeForHashing", () => {
  it("produces deterministic JSON with sorted keys", () => {
    const a = serializeForHashing({ b: "2", a: "1", c: "3" });
    const b = serializeForHashing({ c: "3", a: "1", b: "2" });
    expect(a).toBe(b);
  });

  it("sorts nested object keys", () => {
    const result = serializeForHashing({ z: { b: 1, a: 2 }, a: "first" });
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    expect(keys[0]).toBe("a");
    expect(keys[1]).toBe("z");
  });

  it("handles empty objects", () => {
    const result = serializeForHashing({});
    expect(result).toBe("{}");
  });

  it("handles null and undefined values", () => {
    const result = serializeForHashing({ a: null, b: undefined });
    // JSON.stringify omits undefined, keeps null
    expect(result).toContain('"a":null');
    expect(result).not.toContain('"b"');
  });

  it("handles arrays (preserves order)", () => {
    const result = serializeForHashing({ items: [3, 1, 2] });
    expect(result).toBe('{"items":[3,1,2]}');
  });
});

describe("computeContentHash", () => {
  it("returns a 64-character hex string (SHA-256)", async () => {
    const hash = await computeContentHash({ title: "Test" });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical hashes for same content regardless of key order", async () => {
    const hash1 = await computeContentHash({ b: "2", a: "1" });
    const hash2 = await computeContentHash({ a: "1", b: "2" });
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different content", async () => {
    const hash1 = await computeContentHash({ title: "Version 1" });
    const hash2 = await computeContentHash({ title: "Version 2" });
    expect(hash1).not.toBe(hash2);
  });

  it("produces consistent hash across calls", async () => {
    const data = { title: "Consistency Test", population: "Adults" };
    const hash1 = await computeContentHash(data);
    const hash2 = await computeContentHash(data);
    expect(hash1).toBe(hash2);
  });
});

describe("verifyContentHash", () => {
  it("returns true when hash matches content", async () => {
    const data = { title: "Test Protocol" };
    const hash = await computeContentHash(data);
    const isValid = await verifyContentHash(data, hash);
    expect(isValid).toBe(true);
  });

  it("returns false when hash does not match content", async () => {
    const data = { title: "Test Protocol" };
    const isValid = await verifyContentHash(data, "invalid_hash_value");
    expect(isValid).toBe(false);
  });

  it("returns false when content has been tampered with", async () => {
    const original = { title: "Original" };
    const hash = await computeContentHash(original);
    const tampered = { title: "Tampered" };
    const isValid = await verifyContentHash(tampered, hash);
    expect(isValid).toBe(false);
  });
});
