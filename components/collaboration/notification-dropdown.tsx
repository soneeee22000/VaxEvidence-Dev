"use client";

/**
 * Bell icon popover with notification list, mark-as-read, and
 * real-time unread count via postgres_changes subscription.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationBadge } from "./notification-badge";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/supabase/notifications";
import type { NotificationRecord } from "@/lib/validators/notification";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NotificationDropdownProps {
  userId: string;
}

/** Maps notification resource to an app URL. */
function getNotificationHref(n: NotificationRecord): string {
  if (n.protocol_id) {
    return `/app/${n.protocol_id}`;
  }
  if (n.resource_type === "protocol") {
    return `/app/${n.resource_id}`;
  }
  return "/app";
}

/** Relative time label (e.g. "2m ago", "3h ago"). */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    const [notifResult, countResult] = await Promise.all([
      fetchNotifications(userId),
      fetchUnreadCount(userId),
    ]);
    if (notifResult.data) setNotifications(notifResult.data);
    if (countResult.data !== null) setUnreadCount(countResult.data);
  }, [userId]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newNotif = payload.new as unknown as NotificationRecord;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          if (newNotif.type === "mention") {
            toast.info(newNotif.title, {
              description: newNotif.body ?? undefined,
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <NotificationBadge count={unreadCount} />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 border-b px-4 py-3 last:border-b-0 ${
                  n.is_read ? "opacity-60" : "bg-muted/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={getNotificationHref(n)}
                    className="text-sm font-medium hover:underline line-clamp-1"
                    onClick={() => {
                      setIsOpen(false);
                      if (!n.is_read) handleMarkAsRead(n.id);
                    }}
                  >
                    {n.title}
                  </Link>
                  {n.body && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <Check className="h-3 w-3" />
                    <span className="sr-only">Mark as read</span>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
