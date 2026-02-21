import { createClient } from "@/lib/supabase/browser";
import type {
  NotificationCreateValues,
  NotificationRecord,
} from "@/lib/validators/notification";

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

/**
 * Fetch notifications for a user, ordered by most recent first.
 */
export const fetchNotifications = async (
  userId: string,
  limit = 50,
): SupabaseResult<NotificationRecord[]> => {
  const client = getClient();
  if (!client) return notConfigured<NotificationRecord[]>();

  return safeCall(() =>
    client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
};

/**
 * Fetch the count of unread notifications for a user.
 */
export const fetchUnreadCount = async (
  userId: string,
): SupabaseResult<number> => {
  const client = getClient();
  if (!client) return notConfigured<number>();

  try {
    const { count, error } = await client
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return {
      data: count ?? 0,
      error: error ? { message: error.message } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (
  notificationId: string,
): SupabaseResult<NotificationRecord> => {
  const client = getClient();
  if (!client) return notConfigured<NotificationRecord>();

  return safeCall(() =>
    client
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select("*")
      .single(),
  );
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userId: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return notConfigured<null>();

  return safeCall(() =>
    client
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  );
};

/**
 * Create a new notification.
 */
export const createNotification = async (
  payload: NotificationCreateValues,
): SupabaseResult<NotificationRecord> => {
  const client = getClient();
  if (!client) return notConfigured<NotificationRecord>();

  return safeCall(() =>
    client.from("notifications").insert(payload).select("*").single(),
  );
};
