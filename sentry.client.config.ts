import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring: sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay: 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Only enable in production when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Filter out noisy errors
  ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured"],
});
