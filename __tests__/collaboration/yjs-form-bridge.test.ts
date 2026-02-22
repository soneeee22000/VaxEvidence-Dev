import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Y from "yjs";
import { YjsFormBridge } from "@/lib/collaboration/yjs-form-bridge";
import { COLLAB_FIELDS } from "@/lib/collaboration/types";

/**
 * Create a mock react-hook-form UseFormReturn that tracks setValue calls
 * and allows triggering the watch callback.
 */
function createMockForm(initialValues: Record<string, string> = {}) {
  let watchCallback:
    | ((values: Record<string, unknown>, info: { name?: string }) => void)
    | null = null;

  const form = {
    getValues: vi.fn(() => ({ ...initialValues })),
    setValue: vi.fn(),
    watch: vi.fn(
      (
        cb: (values: Record<string, unknown>, info: { name?: string }) => void,
      ) => {
        watchCallback = cb;
        return { unsubscribe: vi.fn() };
      },
    ),
    /** Simulate a local form field change. */
    simulateChange(fieldName: string, value: string) {
      if (watchCallback) {
        watchCallback(
          { ...initialValues, [fieldName]: value },
          { name: fieldName },
        );
      }
    },
  };

  return form;
}

describe("YjsFormBridge", () => {
  let ydoc: Y.Doc;
  let form: ReturnType<typeof createMockForm>;
  let bridge: YjsFormBridge;
  let destroyed: boolean;

  beforeEach(() => {
    destroyed = false;
    ydoc = new Y.Doc();
    form = createMockForm({
      title: "My Protocol",
      study_question: "What is VE?",
      population: "Adults",
      intervention: "BNT162b2",
      comparator: "Placebo",
      outcomes: "Infection",
      design: "Test-negative",
      status: "draft",
    });
    bridge = new YjsFormBridge(ydoc, form as any);
  });

  afterEach(() => {
    if (!destroyed) bridge.destroy();
    ydoc.destroy();
  });

  // -----------------------------------------------------------------------
  // initFromForm
  // -----------------------------------------------------------------------
  describe("initFromForm", () => {
    it("copies all COLLAB_FIELDS from form to Yjs map", () => {
      bridge.initFromForm();

      const ymap = ydoc.getMap<string>("protocol");
      expect(ymap.get("title")).toBe("My Protocol");
      expect(ymap.get("study_question")).toBe("What is VE?");
      expect(ymap.get("population")).toBe("Adults");
      expect(ymap.get("intervention")).toBe("BNT162b2");
      expect(ymap.get("comparator")).toBe("Placebo");
      expect(ymap.get("outcomes")).toBe("Infection");
      expect(ymap.get("design")).toBe("Test-negative");
      expect(ymap.get("status")).toBe("draft");
    });

    it("uses LOCAL_ORIGIN to prevent loop", () => {
      // After initFromForm, form.setValue should NOT be called
      // (the Yjs observer should skip LOCAL_ORIGIN changes)
      bridge.initFromForm();

      expect(form.setValue).not.toHaveBeenCalled();
    });

    it("converts undefined values to empty string", () => {
      const emptyForm = createMockForm({});
      const emptyBridge = new YjsFormBridge(ydoc, emptyForm as any);
      emptyBridge.initFromForm();

      const ymap = ydoc.getMap<string>("protocol");
      for (const field of COLLAB_FIELDS) {
        expect(ymap.get(field)).toBe("");
      }

      emptyBridge.destroy();
    });
  });

  // -----------------------------------------------------------------------
  // initFromYjs
  // -----------------------------------------------------------------------
  describe("initFromYjs", () => {
    it("copies Yjs map values into the form", () => {
      const ymap = ydoc.getMap<string>("protocol");
      ydoc.transact(() => {
        ymap.set("title", "From Yjs");
        ymap.set("population", "Children");
      });

      bridge.initFromYjs();

      expect(form.setValue).toHaveBeenCalledWith("title", "From Yjs", {
        shouldDirty: false,
      });
      expect(form.setValue).toHaveBeenCalledWith("population", "Children", {
        shouldDirty: false,
      });
    });

    it("skips fields not present in Yjs map", () => {
      // Yjs map is empty — should not call setValue for any field
      bridge.initFromYjs();

      expect(form.setValue).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Remote Yjs changes → form
  // -----------------------------------------------------------------------
  describe("remote Yjs changes", () => {
    it("updates form when remote peer modifies a COLLAB_FIELD", () => {
      const ymap = ydoc.getMap<string>("protocol");

      // Simulate a remote change (non-LOCAL_ORIGIN)
      ydoc.transact(() => {
        ymap.set("title", "Remote Title");
      }, "remote-peer");

      expect(form.setValue).toHaveBeenCalledWith("title", "Remote Title", {
        shouldDirty: false,
      });
    });

    it("ignores changes to non-COLLAB_FIELD keys", () => {
      const ymap = ydoc.getMap<string>("protocol");

      ydoc.transact(() => {
        ymap.set("some_random_field", "value");
      }, "remote-peer");

      // setValue should not be called for non-collab fields
      expect(form.setValue).not.toHaveBeenCalled();
    });

    it("does not update form for LOCAL_ORIGIN changes", () => {
      const ymap = ydoc.getMap<string>("protocol");

      ydoc.transact(() => {
        ymap.set("title", "Local Title");
      }, "local-form");

      expect(form.setValue).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Local form changes → Yjs
  // -----------------------------------------------------------------------
  describe("local form changes", () => {
    it("pushes local form changes to Yjs map", () => {
      form.simulateChange("title", "New Title");

      const ymap = ydoc.getMap<string>("protocol");
      expect(ymap.get("title")).toBe("New Title");
    });

    it("ignores changes to non-COLLAB_FIELD names", () => {
      form.simulateChange("some_other_field", "value");

      const ymap = ydoc.getMap<string>("protocol");
      expect(ymap.get("some_other_field" as any)).toBeUndefined();
    });

    it("does not push when value is unchanged", () => {
      // Set initial value in Yjs
      const ymap = ydoc.getMap<string>("protocol");
      ydoc.transact(() => {
        ymap.set("title", "Same Title");
      }, "local-form");

      // Simulate form change with same value
      form.simulateChange("title", "Same Title");

      // setValue should not be called since Yjs already has this value
      // and no remote observer should fire
      expect(form.setValue).not.toHaveBeenCalled();
    });

    it("ignores watch callback without field name", () => {
      // Simulate watch with no name (e.g., reset)
      const watchCb = form.watch.mock.calls[0][0];
      watchCb({ title: "whatever" }, {});

      const ymap = ydoc.getMap<string>("protocol");
      expect(ymap.get("title")).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // destroy
  // -----------------------------------------------------------------------
  describe("destroy", () => {
    it("stops observing Yjs changes after destroy", () => {
      bridge.destroy();
      destroyed = true;

      const ymap = ydoc.getMap<string>("protocol");
      ydoc.transact(() => {
        ymap.set("title", "After Destroy");
      }, "remote-peer");

      // Should NOT have called setValue since bridge is destroyed
      expect(form.setValue).not.toHaveBeenCalled();
    });

    it("stops processing form changes after destroy", () => {
      bridge.destroy();
      destroyed = true;

      form.simulateChange("title", "After Destroy");

      const ymap = ydoc.getMap<string>("protocol");
      expect(ymap.get("title")).toBeUndefined();
    });
  });
});
