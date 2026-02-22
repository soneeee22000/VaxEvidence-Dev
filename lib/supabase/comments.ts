import { createClient } from "@/lib/supabase/browser";
import { createNotification } from "@/lib/supabase/notifications";

import type {
  CommentCreateValues,
  CommentResourceType,
  CommentWithUser,
  CommentUpdateValues,
} from "@/lib/validators/comment";

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

const notConfigured = <T>(
  message = "Supabase is not configured.",
): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } };
};

const safeCall = async <T>(
  fn: () => Promise<{ data: T | null; error: any }>,
): SupabaseResult<T> => {
  try {
    const { data, error } = await fn();
    return {
      data: (data ?? null) as T | null,
      error: error ? { message: error.message ?? String(error) } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

const isResourceType = (value: unknown): value is CommentResourceType => {
  return (
    value === "protocol" || value === "evidence_item" || value === "dataset"
  );
};

const looksLikeUuid = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
};

const withUser = (rows: any[] | null): CommentWithUser[] => {
  const list = rows ?? [];
  return list.map((row) => ({
    ...row,
    user: {
      id: row.user_id,
      email: row.user_email ?? "Unknown user",
    },
  }));
};

/**
 * Fetch comments for a resource.
 *
 * Supports both call signatures used in this repo:
 * - fetchComments(resourceType, resourceId)
 * - fetchComments(resourceId, resourceType)
 */
export const fetchComments = async (
  a: CommentResourceType | string,
  b: string | CommentResourceType,
): SupabaseResult<CommentWithUser[]> => {
  const client = getClient();
  if (!client) return notConfigured<CommentWithUser[]>();

  let resourceType: CommentResourceType | null = null;
  let resourceId: string | null = null;

  if (isResourceType(a) && typeof b === "string") {
    resourceType = a;
    resourceId = b;
  } else if (typeof a === "string" && isResourceType(b)) {
    resourceType = b;
    resourceId = a;
  }

  if (!resourceType || !resourceId || !looksLikeUuid(resourceId)) {
    return { data: [], error: null };
  }

  const { data, error } = await safeCall(() =>
    client
      .from("comments_with_user")
      .select("*")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: true }),
  );

  if (error) return { data: null, error };
  return { data: withUser((data as any[]) ?? []), error: null };
};

export const createComment = async (
  payload: CommentCreateValues & {
    user_id: string;
    mentionUserIds?: string[];
  },
): SupabaseResult<CommentWithUser> => {
  const client = getClient();
  if (!client) return notConfigured<CommentWithUser>();

  const { mentionUserIds, ...insertPayload } = payload;

  const { data, error } = await safeCall(() =>
    client
      .from("comments")
      .insert({
        ...insertPayload,
        parent_id: insertPayload.parent_id ?? null,
        mentions: insertPayload.mentions ?? [],
      })
      .select("*")
      .single(),
  );

  if (error || !data) return { data: null, error };
  const row = data as any;

  // Create notification for each mentioned user (fire-and-forget)
  if (mentionUserIds && mentionUserIds.length > 0) {
    for (const mentionedUserId of mentionUserIds) {
      if (mentionedUserId === payload.user_id) continue;
      createNotification({
        user_id: mentionedUserId,
        type: "mention",
        title: `You were mentioned in a comment`,
        body: (row.content as string).slice(0, 200),
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        protocol_id: row.resource_type === "protocol" ? row.resource_id : null,
        created_by: payload.user_id,
      }).catch(() => {});
    }
  }

  return {
    data: {
      ...(row as any),
      user: {
        id: row.user_id,
        email: row.user_email ?? "Unknown user",
      },
    },
    error: null,
  };
};

export const updateComment = async (
  commentId: string,
  payload: CommentUpdateValues,
): SupabaseResult<CommentWithUser> => {
  const client = getClient();
  if (!client) return notConfigured<CommentWithUser>();

  const { data, error } = await safeCall(() =>
    client
      .from("comments")
      .update({
        ...payload,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select("*")
      .single(),
  );

  if (error || !data) return { data: null, error };
  const row = data as any;
  return {
    data: {
      ...(row as any),
      user: {
        id: row.user_id,
        email: row.user_email ?? "Unknown user",
      },
    },
    error: null,
  };
};

export const deleteComment = async (
  commentId: string,
): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return notConfigured<null>();
  return safeCall(() => client.from("comments").delete().eq("id", commentId));
};
