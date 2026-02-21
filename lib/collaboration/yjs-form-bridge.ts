/**
 * Bidirectional bridge between a Yjs Y.Map and react-hook-form.
 *
 * Local edits: form.watch() -> ymap.set(field, value, LOCAL_ORIGIN)
 * Remote edits: ymap.observe() -> form.setValue(field, value)
 *
 * Origin tracking prevents infinite loops:
 * - LOCAL_ORIGIN tag on local writes -> observer skips them
 * - isRemoteUpdate flag on remote writes -> watch callback skips them
 */

import * as Y from "yjs";
import type { UseFormReturn } from "react-hook-form";
import { COLLAB_FIELDS, type CollabFieldName } from "./types";

const LOCAL_ORIGIN = "local-form";

export class YjsFormBridge {
  private readonly ymap: Y.Map<string>;
  private readonly form: UseFormReturn<any>;
  private isRemoteUpdate = false;
  private unsubscribeWatch: (() => void) | null = null;
  private destroyed = false;

  constructor(ydoc: Y.Doc, form: UseFormReturn<any>) {
    this.ymap = ydoc.getMap<string>("protocol");
    this.form = form;

    // Observe Yjs map changes from remote peers
    this.ymap.observe(this.handleYjsChange);

    // Watch form value changes from local user
    const { unsubscribe } = form.watch(this.handleFormChange);
    this.unsubscribeWatch = unsubscribe;
  }

  /**
   * Initialize the Yjs map from current form values.
   * Called once when the first user opens the protocol.
   */
  initFromForm(): void {
    const values = this.form.getValues();
    this.ymap.doc!.transact(() => {
      for (const field of COLLAB_FIELDS) {
        const val = values[field] ?? "";
        this.ymap.set(field, String(val));
      }
    }, LOCAL_ORIGIN);
  }

  /**
   * Initialize the form from Yjs map values.
   * Called when a late joiner receives sync state.
   */
  initFromYjs(): void {
    this.isRemoteUpdate = true;
    for (const field of COLLAB_FIELDS) {
      const val = this.ymap.get(field);
      if (val !== undefined) {
        this.form.setValue(field, val, { shouldDirty: false });
      }
    }
    this.isRemoteUpdate = false;
  }

  /** Handle changes coming from remote Yjs peers. */
  private handleYjsChange = (
    event: Y.YMapEvent<string>,
    transaction: Y.Transaction,
  ) => {
    if (this.destroyed) return;
    if (transaction.origin === LOCAL_ORIGIN) return;

    this.isRemoteUpdate = true;
    event.changes.keys.forEach((change, key) => {
      if (change.action === "add" || change.action === "update") {
        if (COLLAB_FIELDS.includes(key as CollabFieldName)) {
          const value = this.ymap.get(key) ?? "";
          this.form.setValue(key, value, { shouldDirty: false });
        }
      }
    });
    this.isRemoteUpdate = false;
  };

  /** Handle local form value changes and push to Yjs. */
  private handleFormChange = (
    values: Record<string, unknown>,
    info: { name?: string },
  ) => {
    if (this.destroyed) return;
    if (this.isRemoteUpdate) return;

    const changedField = info.name as CollabFieldName | undefined;
    if (!changedField || !COLLAB_FIELDS.includes(changedField)) return;

    const newValue = String(values[changedField] ?? "");
    const currentYjsValue = this.ymap.get(changedField);

    if (newValue !== currentYjsValue) {
      this.ymap.doc!.transact(() => {
        this.ymap.set(changedField, newValue);
      }, LOCAL_ORIGIN);
    }
  };

  destroy(): void {
    this.destroyed = true;
    this.ymap.unobserve(this.handleYjsChange);
    this.unsubscribeWatch?.();
  }
}
