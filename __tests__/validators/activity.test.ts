import { describe, it, expect } from "vitest";
import {
  activityLogSchema,
  formatActivityMessage,
  getActivityIcon,
  getActivityColor,
  groupActivitiesByDate,
  activityActionTypes,
  activityResourceTypes,
} from "@/lib/validators/activity";
import type { ActivityLogWithUser } from "@/lib/validators/activity";

describe("activityLogSchema", () => {
  const validLog = {
    action_type: "create" as const,
    resource_type: "protocol" as const,
    resource_id: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("accepts valid activity log", () => {
    const result = activityLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  it("accepts all action types", () => {
    for (const action of activityActionTypes) {
      const result = activityLogSchema.safeParse({
        ...validLog,
        action_type: action,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all resource types", () => {
    for (const resource of activityResourceTypes) {
      const result = activityLogSchema.safeParse({
        ...validLog,
        resource_type: resource,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid action type", () => {
    const result = activityLogSchema.safeParse({
      ...validLog,
      action_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid resource type", () => {
    const result = activityLogSchema.safeParse({
      ...validLog,
      resource_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID resource_id", () => {
    const result = activityLogSchema.safeParse({
      ...validLog,
      resource_id: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults metadata to empty object", () => {
    const result = activityLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({});
    }
  });

  it("accepts metadata object", () => {
    const result = activityLogSchema.safeParse({
      ...validLog,
      metadata: { title: "My Protocol", field: "population" },
    });
    expect(result.success).toBe(true);
  });
});

describe("formatActivityMessage", () => {
  const makeActivity = (
    action_type: string,
    metadata: Record<string, unknown> = {},
  ): ActivityLogWithUser => ({
    id: "1",
    user_id: "u1",
    action_type: action_type as ActivityLogWithUser["action_type"],
    resource_type: "protocol",
    resource_id: "r1",
    metadata,
    created_at: "2026-01-01T00:00:00Z",
    user: { id: "u1", email: "john@example.com" },
  });

  it("formats create action", () => {
    expect(formatActivityMessage(makeActivity("create"))).toBe(
      "john created a protocol",
    );
  });

  it("formats update action", () => {
    expect(formatActivityMessage(makeActivity("update"))).toBe(
      "john updated a protocol",
    );
  });

  it("formats delete action", () => {
    expect(formatActivityMessage(makeActivity("delete"))).toBe(
      "john deleted a protocol",
    );
  });

  it("formats comment action", () => {
    expect(formatActivityMessage(makeActivity("comment"))).toBe(
      "john commented on protocol",
    );
  });

  it("formats review_decision approved", () => {
    const msg = formatActivityMessage(
      makeActivity("review_decision", { status: "approved" }),
    );
    expect(msg).toBe("john approved the protocol");
  });

  it("formats review_decision rejected", () => {
    const msg = formatActivityMessage(
      makeActivity("review_decision", { status: "rejected" }),
    );
    expect(msg).toBe("john rejected the protocol");
  });
});

describe("getActivityIcon", () => {
  it("returns an icon name for each action type", () => {
    for (const action of activityActionTypes) {
      expect(getActivityIcon(action)).toBeTruthy();
    }
  });
});

describe("getActivityColor", () => {
  it("returns a class string for each action type", () => {
    for (const action of activityActionTypes) {
      expect(getActivityColor(action)).toBeTruthy();
    }
  });
});

describe("groupActivitiesByDate", () => {
  const makeActivity = (date: string): ActivityLogWithUser => ({
    id: Math.random().toString(),
    user_id: "u1",
    action_type: "create",
    resource_type: "protocol",
    resource_id: "r1",
    metadata: {},
    created_at: date,
    user: { id: "u1", email: "test@example.com" },
  });

  it("returns empty array for no activities", () => {
    expect(groupActivitiesByDate([])).toEqual([]);
  });

  it("groups activities by date", () => {
    const activities = [
      makeActivity("2026-01-15T10:00:00Z"),
      makeActivity("2026-01-15T14:00:00Z"),
      makeActivity("2026-01-16T10:00:00Z"),
    ];
    const groups = groupActivitiesByDate(activities);
    expect(groups).toHaveLength(2);
  });
});
