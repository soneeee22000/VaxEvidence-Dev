import { describe, it, expect } from "vitest";
import {
  checklistTypes,
  strobeStudyTypes,
  checklistItemStatuses,
  checklistItemSchema,
  reportingChecklistSchema,
} from "@/lib/validators/reporting-checklist";

describe("checklistItemSchema", () => {
  it("accepts valid checklist item", () => {
    const result = checklistItemSchema.safeParse({
      item_id: "1a",
      status: "complete",
      notes: "Page 3, paragraph 2",
      page_reference: "p.3",
    });
    expect(result.success).toBe(true);
  });

  it("defaults status to not_started", () => {
    const result = checklistItemSchema.safeParse({
      item_id: "2b",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("not_started");
    }
  });

  it("accepts all valid statuses", () => {
    for (const status of checklistItemStatuses) {
      const result = checklistItemSchema.safeParse({
        item_id: "1a",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = checklistItemSchema.safeParse({
      item_id: "1a",
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing item_id", () => {
    const result = checklistItemSchema.safeParse({
      status: "complete",
    });
    expect(result.success).toBe(false);
  });

  it("notes and page_reference are optional", () => {
    const result = checklistItemSchema.safeParse({
      item_id: "3a",
      status: "partial",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
      expect(result.data.page_reference).toBeUndefined();
    }
  });
});

describe("reportingChecklistSchema", () => {
  const validChecklist = {
    protocol_id: "550e8400-e29b-41d4-a716-446655440000",
    checklist_type: "consort" as const,
    items: [{ item_id: "1a", status: "complete" as const, notes: "Done" }],
    completion_pct: 50,
  };

  it("accepts valid reporting checklist", () => {
    const result = reportingChecklistSchema.safeParse(validChecklist);
    expect(result.success).toBe(true);
  });

  it("accepts all checklist types", () => {
    for (const type of checklistTypes) {
      const result = reportingChecklistSchema.safeParse({
        ...validChecklist,
        checklist_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid checklist type", () => {
    const result = reportingChecklistSchema.safeParse({
      ...validChecklist,
      checklist_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = reportingChecklistSchema.safeParse({
      ...validChecklist,
      protocol_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults items to empty array", () => {
    const result = reportingChecklistSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      checklist_type: "strobe",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([]);
    }
  });

  it("defaults completion_pct to 0", () => {
    const result = reportingChecklistSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      checklist_type: "consort",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completion_pct).toBe(0);
    }
  });

  it("rejects completion_pct > 100", () => {
    const result = reportingChecklistSchema.safeParse({
      ...validChecklist,
      completion_pct: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects completion_pct < 0", () => {
    const result = reportingChecklistSchema.safeParse({
      ...validChecklist,
      completion_pct: -10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional strobe_study_type", () => {
    for (const studyType of strobeStudyTypes) {
      const result = reportingChecklistSchema.safeParse({
        ...validChecklist,
        checklist_type: "strobe",
        strobe_study_type: studyType,
      });
      expect(result.success).toBe(true);
    }
  });
});
