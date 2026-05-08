import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay — capture 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser / environment noise
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "Network request failed",
    "Load failed",
    "ChunkLoadError",
    // Deploy artifact: user has stale JS with old Server Action hashes cached.
    // VersionChecker already prompts them to reload — no action needed here.
    "UnrecognizedActionError",
    "was not found on the server",
    "Failed to find Server Action",
    // ServiceWorker update failures — browser-side PWA issue, not app code.
    "Failed to update a ServiceWorker",
    "ServiceWorker",
    // User-initiated aborts (navigation, tab close, request cancel)
    "AbortError",
    "The operation was aborted",
    // Generic fetch failures (flaky network, user offline)
    "Failed to fetch",
    "NetworkError",
  ],

  beforeSend(event) {
    // Drop hydration errors caused by browser extensions injecting DOM nodes
    if (
      event.exception?.values?.some(
        (e) =>
          e.type === "Error" &&
          (e.value?.includes("Hydration") || e.value?.includes("hydrat")) &&
          (event.request?.url?.includes("elektrosmart") === false)
      )
    ) {
      return null;
    }
    return event;
  },

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
