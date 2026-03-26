/**
 * Structured logger for ElektroSmart PRO.
 * 
 * Replaces raw console.error with structured, context-rich logging.
 * Ready to connect to Sentry, LogRocket, or any external service.
 * 
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.error("Failed to load project", { projectId, userId }, error);
 *   logger.warn("Rate limit approaching", { remaining: 5 });
 *   logger.info("Project created", { projectId });
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
  timestamp: string;
  environment: string;
}

function formatError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  // Handle Supabase PostgrestError (plain object with message/code/details)
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      message: e["message"] ?? "(no message)",
      code: e["code"],
      details: e["details"],
      hint: e["hint"],
    };
  }
  return { raw: String(err) };
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };

  if (error) {
    (entry as LogEntry & { errorDetails?: Record<string, unknown> }).errorDetails = formatError(error);
  }

  // In production, output structured JSON for log aggregation
  if (process.env.NODE_ENV === "production") {
    const output = JSON.stringify(entry);
    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        // console.log is stripped in production by Next.js config
        // Use console.info instead
        console.info(output);
    }
  } else {
    // In development, keep readable output
    const prefix = level === "error" ? "🔴" : level === "warn" ? "🟡" : "🔵";
    console.error(`${prefix} [${level.toUpperCase()}] ${message}`, context || "", error || "");
  }

  // Hook point: Send to external service (Sentry, LogRocket, etc.)
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN && level === "error") {
  //   Sentry.captureException(error, { extra: context });
  // }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>, error?: unknown) => log("error", message, context, error),
};
