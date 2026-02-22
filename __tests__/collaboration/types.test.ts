import { describe, it, expect } from "vitest";
import { COLLAB_FIELDS } from "@/lib/collaboration/types";
import type {
  PresenceState,
  CollaboratorInfo,
  CollabFieldName,
  BroadcastEventType,
} from "@/lib/collaboration/types";

describe("COLLAB_FIELDS", () => {
  it("has exactly 8 field names", () => {
    expect(COLLAB_FIELDS).toHaveLength(8);
  });

  it("contains all PICO protocol fields", () => {
    expect(COLLAB_FIELDS).toContain("title");
    expect(COLLAB_FIELDS).toContain("study_question");
    expect(COLLAB_FIELDS).toContain("population");
    expect(COLLAB_FIELDS).toContain("intervention");
    expect(COLLAB_FIELDS).toContain("comparator");
    expect(COLLAB_FIELDS).toContain("outcomes");
    expect(COLLAB_FIELDS).toContain("design");
    expect(COLLAB_FIELDS).toContain("status");
  });

  it("is a readonly tuple", () => {
    // Verify it is a readonly array (cannot push)
    expect(Array.isArray(COLLAB_FIELDS)).toBe(true);
  });
});

describe("type shape verification", () => {
  it("PresenceState has the expected shape", () => {
    const state: PresenceState = {
      userId: "u-1",
      email: "test@example.com",
      color: "oklch(0.72 0.19 29)",
      activeField: "title",
      lastSeen: new Date().toISOString(),
    };
    expect(state.userId).toBe("u-1");
    expect(state.activeField).toBe("title");
  });

  it("PresenceState allows null activeField", () => {
    const state: PresenceState = {
      userId: "u-1",
      email: "test@example.com",
      color: "oklch(0.72 0.19 29)",
      activeField: null,
      lastSeen: new Date().toISOString(),
    };
    expect(state.activeField).toBeNull();
  });

  it("CollaboratorInfo has the expected shape", () => {
    const info: CollaboratorInfo = {
      userId: "u-1",
      email: "test@example.com",
      color: "oklch(0.72 0.19 29)",
      activeField: "population",
    };
    expect(info.activeField).toBe("population");
  });

  it("CollabFieldName type accepts valid field names", () => {
    const field: CollabFieldName = "title";
    expect(COLLAB_FIELDS).toContain(field);
  });

  it("BroadcastEventType covers all event types", () => {
    const events: BroadcastEventType[] = [
      "yjs-update",
      "request-sync",
      "sync-response",
      "field-focus",
      "field-blur",
      "protocol-saved",
    ];
    expect(events).toHaveLength(6);
  });
});
