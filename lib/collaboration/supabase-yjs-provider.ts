/**
 * Custom Yjs provider that transports document updates via Supabase
 * Realtime Broadcast.
 *
 * ~80 lines. No external Yjs transport dependency — just `yjs` +
 * the existing `@supabase/supabase-js` Realtime channel.
 */

import * as Y from "yjs";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Encode a Uint8Array as base64 for JSON-safe Broadcast transport. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string back to a Uint8Array. */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class SupabaseYjsProvider {
  private readonly ydoc: Y.Doc;
  private readonly channel: RealtimeChannel;
  private readonly userId: string;
  private destroyed = false;

  constructor(ydoc: Y.Doc, channel: RealtimeChannel, userId: string) {
    this.ydoc = ydoc;
    this.channel = channel;
    this.userId = userId;

    // Listen for remote Yjs updates
    channel.on(
      "broadcast",
      { event: "yjs-update" },
      ({ payload }: { payload: { update: string; senderId: string } }) => {
        if (this.destroyed) return;
        if (payload.senderId === this.userId) return;
        const update = fromBase64(payload.update);
        Y.applyUpdate(this.ydoc, update, "remote");
      },
    );

    // Handle sync requests from late joiners
    channel.on(
      "broadcast",
      { event: "request-sync" },
      ({ payload }: { payload: { requesterId: string } }) => {
        if (this.destroyed) return;
        if (payload.requesterId === this.userId) return;
        const state = Y.encodeStateAsUpdate(this.ydoc);
        channel.send({
          type: "broadcast",
          event: "sync-response",
          payload: {
            state: toBase64(state),
            targetId: payload.requesterId,
          },
        });
      },
    );

    // Apply sync responses (late joiner receives full state)
    channel.on(
      "broadcast",
      { event: "sync-response" },
      ({ payload }: { payload: { state: string; targetId: string } }) => {
        if (this.destroyed) return;
        if (payload.targetId !== this.userId) return;
        const state = fromBase64(payload.state);
        Y.applyUpdate(this.ydoc, state, "remote");
      },
    );

    // Broadcast local updates to other clients
    this.ydoc.on("update", this.handleLocalUpdate);
  }

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (this.destroyed) return;
    if (origin === "remote") return;
    this.channel.send({
      type: "broadcast",
      event: "yjs-update",
      payload: {
        update: toBase64(update),
        senderId: this.userId,
      },
    });
  };

  /** Request full state from any connected peer (for late joiners). */
  requestSync(): void {
    this.channel.send({
      type: "broadcast",
      event: "request-sync",
      payload: { requesterId: this.userId },
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.ydoc.off("update", this.handleLocalUpdate);
  }
}
