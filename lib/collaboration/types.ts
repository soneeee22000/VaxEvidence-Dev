/**
 * Real-time collaboration type definitions.
 *
 * Used by the presence context, Yjs provider, and field-level cursor
 * components to share a consistent shape for collaborator data.
 */

/** Presence state tracked per-user in a Supabase Realtime channel. */
export interface PresenceState {
  userId: string;
  email: string;
  color: string;
  activeField: string | null;
  lastSeen: string;
}

/** Derived collaborator info exposed to components. */
export interface CollaboratorInfo {
  userId: string;
  email: string;
  color: string;
  activeField: string | null;
}

/** Protocol field names that support real-time collaboration. */
export const COLLAB_FIELDS = [
  "title",
  "study_question",
  "population",
  "intervention",
  "comparator",
  "outcomes",
  "design",
  "status",
] as const;

export type CollabFieldName = (typeof COLLAB_FIELDS)[number];

/** Broadcast event types used on the protocol channel. */
export type BroadcastEventType =
  | "yjs-update"
  | "request-sync"
  | "sync-response"
  | "field-focus"
  | "field-blur"
  | "protocol-saved";
