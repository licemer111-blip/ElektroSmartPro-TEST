/**
 * Edge-compatible rate limiting via Upstash Redis.
 * Used in middleware.ts for /api/admin/* and /api/ai/* routes.
 *
 * Graceful fallback: if UPSTASH_REDIS_REST_URL / TOKEN are not set,
 * all requests are allowed (no crash in dev/staging without Redis).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function buildLimiter(
  requestsPerMinute: number,
  prefix: string,
): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requestsPerMinute, "1 m"),
    analytics: false,
    prefix: `es:${prefix}`,
  });
}

// 10 requests / minute — AI generation routes
const aiLimiter = buildLimiter(10, "ai");

// 30 requests / minute — Admin API routes
const adminLimiter = buildLimiter(30, "admin");

export interface EdgeRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given path and IP.
 * Returns { allowed: true } if Upstash is not configured (dev fallback).
 */
export async function checkEdgeRateLimit(
  path: string,
  ip: string,
): Promise<EdgeRateLimitResult> {
  let limiter: Ratelimit | null = null;

  if (path.startsWith("/api/ai/")) {
    limiter = aiLimiter;
  } else if (path.startsWith("/api/admin/")) {
    limiter = adminLimiter;
  }

  if (!limiter) return { allowed: true, remaining: 999 };

  try {
    const { success, remaining, reset } = await limiter.limit(ip);
    return {
      allowed: success,
      remaining,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch {
    // Redis unreachable — fail open (allow request)
    return { allowed: true, remaining: 0 };
  }
}
