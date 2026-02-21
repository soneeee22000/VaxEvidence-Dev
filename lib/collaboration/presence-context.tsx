"use client";

/**
 * PresenceProvider — React context for real-time collaboration on a protocol.
 *
 * Manages:
 * - Supabase Realtime channel (protocol:{id})
 * - Presence tracking (who is viewing)
 * - Field focus broadcasting (who is editing which field)
 * - Yjs document + SupabaseYjsProvider + YjsFormBridge (CRDT sync)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UseFormReturn } from "react-hook-form";
import type { RealtimeChannel } from "@supabase/supabase-js";
import * as Y from "yjs";
import { createClient } from "@/lib/supabase/browser";
import { getUserColor } from "./constants";
import { SupabaseYjsProvider } from "./supabase-yjs-provider";
import { YjsFormBridge } from "./yjs-form-bridge";
import type { CollaboratorInfo, PresenceState } from "./types";

interface PresenceContextValue {
  /** Other users currently viewing this protocol (excludes self). */
  collaborators: CollaboratorInfo[];
  /** Map of fieldName -> array of collaborators focused on that field. */
  activeFieldUsers: Record<string, CollaboratorInfo[]>;
  /** Call when the local user focuses a protocol field. */
  setActiveField: (fieldName: string | null) => void;
  /** Broadcast that the protocol was saved. */
  broadcastSave: (email: string) => void;
  /** Whether the channel is connected. */
  isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  collaborators: [],
  activeFieldUsers: {},
  setActiveField: () => {},
  broadcastSave: () => {},
  isConnected: false,
});

export function usePresence() {
  return useContext(PresenceContext);
}

interface PresenceProviderProps {
  protocolId: string;
  userId: string;
  email: string;
  form: UseFormReturn<any>;
  children: React.ReactNode;
}

export function PresenceProvider({
  protocolId,
  userId,
  email,
  form,
  children,
}: PresenceProviderProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const providerRef = useRef<SupabaseYjsProvider | null>(null);
  const bridgeRef = useRef<YjsFormBridge | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const activeFieldRef = useRef<string | null>(null);

  // Build the activeFieldUsers map from collaborators
  const activeFieldUsers = useMemo(() => {
    const map: Record<string, CollaboratorInfo[]> = {};
    for (const c of collaborators) {
      if (c.activeField) {
        if (!map[c.activeField]) {
          map[c.activeField] = [];
        }
        map[c.activeField].push(c);
      }
    }
    return map;
  }, [collaborators]);

  const setActiveField = useCallback(
    (fieldName: string | null) => {
      activeFieldRef.current = fieldName;
      const channel = channelRef.current;
      if (!channel) return;

      if (fieldName) {
        channel.send({
          type: "broadcast",
          event: "field-focus",
          payload: { userId, fieldName },
        });
      } else {
        channel.send({
          type: "broadcast",
          event: "field-blur",
          payload: { userId },
        });
      }

      // Also update presence state
      channel.track({
        userId,
        email,
        color: getUserColor(userId),
        activeField: fieldName,
        lastSeen: new Date().toISOString(),
      } satisfies PresenceState);
    },
    [userId, email],
  );

  const broadcastSave = useCallback((savedByEmail: string) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "protocol-saved",
      payload: { savedBy: savedByEmail },
    });
  }, []);

  useEffect(() => {
    if (!protocolId || !userId) return;

    const supabase = createClient();
    const channelName = `protocol:${protocolId}`;
    const color = getUserColor(userId);

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    // --- Presence ---
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const others: CollaboratorInfo[] = [];
      for (const [key, presences] of Object.entries(state)) {
        if (key === userId) continue;
        const latest = presences[presences.length - 1];
        if (latest) {
          others.push({
            userId: latest.userId,
            email: latest.email,
            color: latest.color,
            activeField: latest.activeField,
          });
        }
      }
      setCollaborators(others);
    });

    // --- Field focus/blur broadcasts ---
    channel.on(
      "broadcast",
      { event: "field-focus" },
      ({ payload }: { payload: { userId: string; fieldName: string } }) => {
        if (payload.userId === userId) return;
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === payload.userId
              ? { ...c, activeField: payload.fieldName }
              : c,
          ),
        );
      },
    );

    channel.on(
      "broadcast",
      { event: "field-blur" },
      ({ payload }: { payload: { userId: string } }) => {
        if (payload.userId === userId) return;
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === payload.userId ? { ...c, activeField: null } : c,
          ),
        );
      },
    );

    // --- Yjs CRDT ---
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new SupabaseYjsProvider(ydoc, channel, userId);
    providerRef.current = provider;

    const bridge = new YjsFormBridge(ydoc, form);
    bridgeRef.current = bridge;

    // Subscribe and track presence
    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        await channel.track({
          userId,
          email,
          color,
          activeField: null,
          lastSeen: new Date().toISOString(),
        } satisfies PresenceState);

        // Initialize Yjs from form values, then request sync from peers
        bridge.initFromForm();
        provider.requestSync();
      }
    });

    // Listen for save events from other users
    channel.on(
      "broadcast",
      { event: "protocol-saved" },
      ({ payload }: { payload: { savedBy: string } }) => {
        if (payload.savedBy === email) return;
        // Protocol detail page will handle this via a window event
        window.dispatchEvent(
          new CustomEvent("protocol-saved-remote", {
            detail: { savedBy: payload.savedBy },
          }),
        );
      },
    );

    return () => {
      bridge.destroy();
      provider.destroy();
      ydoc.destroy();
      supabase.removeChannel(channel);
      channelRef.current = null;
      providerRef.current = null;
      bridgeRef.current = null;
      ydocRef.current = null;
      setIsConnected(false);
      setCollaborators([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId, userId, email]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      collaborators,
      activeFieldUsers,
      setActiveField,
      broadcastSave,
      isConnected,
    }),
    [
      collaborators,
      activeFieldUsers,
      setActiveField,
      broadcastSave,
      isConnected,
    ],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
