/**
 * Simple in-memory rate limiter for server actions.
 * Uses a sliding window approach per user ID.
 * 
 * NOTE: This works per-instance (single server). For multi-instance
 * deployments, use Redis or Supabase-based rate limiting instead.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Unique identifier (usually `userId:actionName`) */
  key: string;
  /** Maximum number of requests in the window */
  limit: number;
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function checkRateLimit({
  key,
  limit,
  windowMs = 60_000,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  
  cleanup(windowMs);
  
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }
  
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  
  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }
  
  entry.timestamps.push(now);
  
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
  };
}

// Pre-configured limiters for common actions
export function rateLimitEmail(userId: string): RateLimitResult {
  return checkRateLimit({
    key: `email:${userId}`,
    limit: 10,
    windowMs: 60_000, // 10 emails per minute
  });
}

export function rateLimitAI(userId: string): RateLimitResult {
  return checkRateLimit({
    key: `ai:${userId}`,
    limit: 20,
    windowMs: 60_000, // 20 AI calls per minute
  });
}

export function rateLimitGeneral(userId: string, action: string): RateLimitResult {
  return checkRateLimit({
    key: `${action}:${userId}`,
    limit: 60,
    windowMs: 60_000, // 60 calls per minute
  });
}
