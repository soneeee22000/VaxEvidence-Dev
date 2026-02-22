import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { SupabaseYjsProvider } from "@/lib/collaboration/supabase-yjs-provider";

/**
 * Create a mock Supabase Realtime channel that stores broadcast listeners
 * and allows simulating incoming events.
 */
function createMockChannel() {
  const listeners = new Map<string, (msg: { payload: unknown }) => void>();

  return {
    on: vi.fn(
      (
        _type: string,
        filter: { event: string },
        callback: (msg: { payload: unknown }) => void,
      ) => {
        listeners.set(filter.event, callback);
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      },
    ),
    send: vi.fn(),
    /** Simulate receiving a broadcast event from the network. */
    simulateEvent(event: string, payload: unknown) {
      const handler = listeners.get(event);
      if (handler) handler({ payload });
    },
    listeners,
  };
}

describe("SupabaseYjsProvider", () => {
  let ydoc: Y.Doc;
  let channel: ReturnType<typeof createMockChannel>;
  let provider: SupabaseYjsProvider;

  beforeEach(() => {
    ydoc = new Y.Doc();
    channel = createMockChannel();
    provider = new SupabaseYjsProvider(
      ydoc,
      channel as unknown as any,
      "user-1",
    );
  });

  afterEach(() => {
    provider.destroy();
    ydoc.destroy();
  });

  it("registers 3 broadcast listeners on construction", () => {
    expect(channel.on).toHaveBeenCalledTimes(3);
    expect(channel.listeners.has("yjs-update")).toBe(true);
    expect(channel.listeners.has("request-sync")).toBe(true);
    expect(channel.listeners.has("sync-response")).toBe(true);
  });

  it("broadcasts local Yjs updates to the channel", () => {
    const map = ydoc.getMap("test");
    map.set("key", "value");

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "broadcast",
        event: "yjs-update",
        payload: expect.objectContaining({
          senderId: "user-1",
          update: expect.any(String),
        }),
      }),
    );
  });

  it("does not broadcast updates with remote origin", () => {
    // Apply an update with "remote" origin — should NOT trigger send
    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("test");
    map.set("key", "remote-value");
    const update = Y.encodeStateAsUpdate(remoteDoc);

    Y.applyUpdate(ydoc, update, "remote");

    // The send call should NOT have been invoked (remote origin skipped)
    expect(channel.send).not.toHaveBeenCalled();

    remoteDoc.destroy();
  });

  it("applies remote yjs-update to the local doc", () => {
    // Create a remote doc with data, encode its state
    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("protocol");
    map.set("title", "Hello from remote");
    const update = Y.encodeStateAsUpdate(remoteDoc);

    // Encode to base64 (same as the provider does internally)
    let binary = "";
    for (let i = 0; i < update.length; i++) {
      binary += String.fromCharCode(update[i]);
    }
    const b64 = btoa(binary);

    // Simulate receiving the update from user-2
    channel.simulateEvent("yjs-update", {
      update: b64,
      senderId: "user-2",
    });

    // Verify local doc was updated
    const localMap = ydoc.getMap("protocol");
    expect(localMap.get("title")).toBe("Hello from remote");

    remoteDoc.destroy();
  });

  it("ignores yjs-update from self", () => {
    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("protocol");
    map.set("title", "Self update");
    const update = Y.encodeStateAsUpdate(remoteDoc);

    let binary = "";
    for (let i = 0; i < update.length; i++) {
      binary += String.fromCharCode(update[i]);
    }
    const b64 = btoa(binary);

    // Simulate receiving from self (user-1)
    channel.simulateEvent("yjs-update", {
      update: b64,
      senderId: "user-1",
    });

    // Local doc should NOT be updated
    const localMap = ydoc.getMap("protocol");
    expect(localMap.get("title")).toBeUndefined();

    remoteDoc.destroy();
  });

  it("requestSync sends a request-sync broadcast", () => {
    provider.requestSync();

    expect(channel.send).toHaveBeenCalledWith({
      type: "broadcast",
      event: "request-sync",
      payload: { requesterId: "user-1" },
    });
  });

  it("responds to request-sync from another user with full state", () => {
    // Put some data in the local doc first
    const map = ydoc.getMap("protocol");
    map.set("title", "My protocol");

    // Clear send calls from the set above
    channel.send.mockClear();

    // Simulate request-sync from user-2
    channel.simulateEvent("request-sync", { requesterId: "user-2" });

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "broadcast",
        event: "sync-response",
        payload: expect.objectContaining({
          targetId: "user-2",
          state: expect.any(String),
        }),
      }),
    );
  });

  it("ignores request-sync from self", () => {
    channel.send.mockClear();

    channel.simulateEvent("request-sync", { requesterId: "user-1" });

    expect(channel.send).not.toHaveBeenCalled();
  });

  it("applies sync-response targeted at this user", () => {
    // Create a full state from a remote doc
    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("protocol");
    map.set("title", "Synced state");
    const state = Y.encodeStateAsUpdate(remoteDoc);

    let binary = "";
    for (let i = 0; i < state.length; i++) {
      binary += String.fromCharCode(state[i]);
    }
    const b64 = btoa(binary);

    // Simulate sync-response targeted at user-1
    channel.simulateEvent("sync-response", {
      state: b64,
      targetId: "user-1",
    });

    const localMap = ydoc.getMap("protocol");
    expect(localMap.get("title")).toBe("Synced state");

    remoteDoc.destroy();
  });

  it("ignores sync-response targeted at another user", () => {
    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("protocol");
    map.set("title", "Not for me");
    const state = Y.encodeStateAsUpdate(remoteDoc);

    let binary = "";
    for (let i = 0; i < state.length; i++) {
      binary += String.fromCharCode(state[i]);
    }
    const b64 = btoa(binary);

    channel.simulateEvent("sync-response", {
      state: b64,
      targetId: "user-3",
    });

    const localMap = ydoc.getMap("protocol");
    expect(localMap.get("title")).toBeUndefined();

    remoteDoc.destroy();
  });

  it("stops processing events after destroy", () => {
    provider.destroy();

    const remoteDoc = new Y.Doc();
    const map = remoteDoc.getMap("protocol");
    map.set("title", "After destroy");
    const state = Y.encodeStateAsUpdate(remoteDoc);

    let binary = "";
    for (let i = 0; i < state.length; i++) {
      binary += String.fromCharCode(state[i]);
    }
    const b64 = btoa(binary);

    channel.simulateEvent("yjs-update", {
      update: b64,
      senderId: "user-2",
    });

    const localMap = ydoc.getMap("protocol");
    expect(localMap.get("title")).toBeUndefined();

    remoteDoc.destroy();
  });

  it("stops broadcasting local updates after destroy", () => {
    provider.destroy();
    channel.send.mockClear();

    const map = ydoc.getMap("test");
    map.set("key", "after-destroy");

    expect(channel.send).not.toHaveBeenCalled();
  });
});
