import { describe, it, expect } from "vitest";
import {
  protocolVersionCreateSchema,
  protocolVersionSignSchema,
  type ProtocolVersionRecord,
  type ProtocolVersionDiff,
  type ProtocolVersionField,
  VERSIONABLE_FIELDS,
} from "@/lib/validators/protocol-version";

describe("protocolVersionCreateSchema", () => {
  it("accepts valid create payload with change_summary", () => {
    const result = protocolVersionCreateSchema.safeParse({
      change_summary: "Initial version of the protocol",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty change_summary", () => {
    const result = protocolVersionCreateSchema.safeParse({
      change_summary: "",
    });
    expect(result.success).toBe(true);
  });

  it("defaults change_summary to empty string when omitted", () => {
    const result = protocolVersionCreateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.change_summary).toBe("");
    }
  });

  it("rejects change_summary exceeding 2000 characters", () => {
    const result = protocolVersionCreateSchema.safeParse({
      change_summary: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from change_summary", () => {
    const result = protocolVersionCreateSchema.safeParse({
      change_summary: "  Trimmed summary  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.change_summary).toBe("Trimmed summary");
    }
  });
});

describe("protocolVersionSignSchema", () => {
  it("accepts valid signature meaning", () => {
    const result = protocolVersionSignSchema.safeParse({
      signature_meaning: "Approved for final submission",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty signature_meaning", () => {
    const result = protocolVersionSignSchema.safeParse({
      signature_meaning: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects signature_meaning shorter than 3 characters", () => {
    const result = protocolVersionSignSchema.safeParse({
      signature_meaning: "OK",
    });
    expect(result.success).toBe(false);
  });

  it("rejects signature_meaning exceeding 500 characters", () => {
    const result = protocolVersionSignSchema.safeParse({
      signature_meaning: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("VERSIONABLE_FIELDS", () => {
  it("contains all PICO fields plus title, design, and status", () => {
    expect(VERSIONABLE_FIELDS).toContain("title");
    expect(VERSIONABLE_FIELDS).toContain("study_question");
    expect(VERSIONABLE_FIELDS).toContain("population");
    expect(VERSIONABLE_FIELDS).toContain("intervention");
    expect(VERSIONABLE_FIELDS).toContain("comparator");
    expect(VERSIONABLE_FIELDS).toContain("outcomes");
    expect(VERSIONABLE_FIELDS).toContain("design");
    expect(VERSIONABLE_FIELDS).toContain("status");
  });

  it("has exactly 8 fields", () => {
    expect(VERSIONABLE_FIELDS).toHaveLength(8);
  });
});

describe("ProtocolVersionRecord type", () => {
  it("can be constructed with all required fields", () => {
    const record: ProtocolVersionRecord = {
      id: "uuid-1",
      protocol_id: "proto-1",
      version_number: 1,
      title: "Test Protocol",
      study_question: "Does X cause Y?",
      population: "Adults",
      intervention: "Drug A",
      comparator: "Placebo",
      outcomes: "Recovery rate",
      design: "RCT",
      status: "draft",
      change_summary: "Initial version",
      content_hash: "abc123",
      created_by: "user-1",
      signed_by: null,
      signed_at: null,
      signature_meaning: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(record.version_number).toBe(1);
    expect(record.signed_by).toBeNull();
  });
});

describe("ProtocolVersionDiff type", () => {
  it("can represent field-level changes", () => {
    const diff: ProtocolVersionDiff = {
      fields: [
        {
          field: "title",
          label: "Title",
          oldValue: "Old Title",
          newValue: "New Title",
          changed: true,
        },
        {
          field: "population",
          label: "Population",
          oldValue: "Adults",
          newValue: "Adults",
          changed: false,
        },
      ],
      versionA: 1,
      versionB: 2,
    };
    expect(diff.fields).toHaveLength(2);
    expect(diff.fields[0].changed).toBe(true);
    expect(diff.fields[1].changed).toBe(false);
  });
});
