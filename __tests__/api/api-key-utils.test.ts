import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  getKeyPrefix,
  API_KEY_PREFIX,
} from "@/lib/api/api-key-utils";

describe("API_KEY_PREFIX", () => {
  it("equals 'vxe_'", () => {
    expect(API_KEY_PREFIX).toBe("vxe_");
  });
});

describe("generateApiKey", () => {
  it("starts with the vxe_ prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("vxe_")).toBe(true);
  });

  it("has the correct total length (4 prefix + 40 hex = 44)", () => {
    const key = generateApiKey();
    expect(key).toHaveLength(44);
  });

  it("contains only hex characters after the prefix", () => {
    const key = generateApiKey();
    const hex = key.slice(API_KEY_PREFIX.length);
    expect(hex).toMatch(/^[0-9a-f]{40}$/);
  });

  it("produces unique keys on successive calls", () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateApiKey()));
    expect(keys.size).toBe(20);
  });

  it("returns a string type", () => {
    expect(typeof generateApiKey()).toBe("string");
  });
});

describe("hashApiKey", () => {
  it("returns a consistent hash for the same input", () => {
    const key = "vxe_abc123";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("returns different hashes for different inputs", () => {
    const hashA = hashApiKey("vxe_key_one");
    const hashB = hashApiKey("vxe_key_two");
    expect(hashA).not.toBe(hashB);
  });

  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashApiKey("vxe_test_key");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes an empty string without error", () => {
    const hash = hashApiKey("");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a deterministic SHA-256 digest", () => {
    // Known SHA-256 of "hello" (verified independently)
    const expected =
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
    expect(hashApiKey("hello")).toBe(expected);
  });
});

describe("getKeyPrefix", () => {
  it("returns the first 8 characters after the vxe_ prefix", () => {
    const key = "vxe_abcdefgh1234567890abcdefgh1234567890";
    expect(getKeyPrefix(key)).toBe("abcdefgh");
  });

  it("strips the vxe_ prefix before slicing", () => {
    const key = "vxe_12345678rest";
    expect(getKeyPrefix(key)).toBe("12345678");
  });

  it("works on keys without the vxe_ prefix", () => {
    const raw = "abcdefghijklmnop";
    expect(getKeyPrefix(raw)).toBe("abcdefgh");
  });

  it("returns fewer than 8 characters if key (without prefix) is shorter", () => {
    const shortKey = "vxe_abc";
    expect(getKeyPrefix(shortKey)).toBe("abc");
  });

  it("returns an empty string for prefix-only input", () => {
    expect(getKeyPrefix("vxe_")).toBe("");
  });

  it("returns an empty string for empty input", () => {
    expect(getKeyPrefix("")).toBe("");
  });

  it("handles generated keys correctly", () => {
    const key = generateApiKey();
    const prefix = getKeyPrefix(key);
    // Prefix should be 8 hex characters from the random part
    expect(prefix).toHaveLength(8);
    expect(prefix).toMatch(/^[0-9a-f]{8}$/);
  });
});
