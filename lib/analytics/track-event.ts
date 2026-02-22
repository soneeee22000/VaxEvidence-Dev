"use client";

import type { EventName } from "@/lib/validators/analytics";

/**
 * Lightweight session ID generator — persists for the browser tab lifetime.
 */
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

/**
 * Fire-and-forget client-side event tracking.
 * Uses `navigator.sendBeacon` where available, falls back to `fetch` with keepalive.
 */
export function trackEvent(
  eventName: EventName,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    events: [
      {
        event_name: eventName,
        properties,
        page_url: window.location.href,
        session_id: getSessionId(),
      },
    ],
  });

  const url = "/api/analytics/events";

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* swallow — analytics is best-effort */
      });
    }
  } catch {
    /* swallow — analytics is best-effort */
  }
}
