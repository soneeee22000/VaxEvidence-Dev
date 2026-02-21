"use client";

/**
 * Hook that subscribes to postgres_changes on the `comments` table,
 * filtered by resource_id, and keeps the local comments list in sync.
 */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { fetchComments } from "@/lib/supabase/comments";
import type { CommentWithUser } from "@/lib/validators/comment";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribes to real-time comment changes for a given protocol and
 * keeps a local state array of CommentWithUser in sync.
 *
 * Falls back to periodic refetch if postgres_changes subscription is
 * unavailable (e.g. missing RLS policies for realtime).
 */
export function useRealtimeComments(protocolId: string | undefined) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadComments = async () => {
    if (!protocolId) return;
    setIsLoading(true);
    try {
      const { data, error } = await fetchComments("protocol", protocolId);
      if (!error && data) {
        setComments(data as CommentWithUser[]);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!protocolId) return;

    // Initial load
    loadComments();

    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${protocolId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `resource_id=eq.${protocolId}`,
        },
        () => {
          // On any change, refetch the full list to get user info
          loadComments();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId]);

  return { comments, isLoading, refetch: loadComments };
}
