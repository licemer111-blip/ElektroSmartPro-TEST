"use client";

import { useEffect, useState } from "react";

const KNR_MULTIPLIER_CHANNEL = "knr-multiplier-updates";
const CACHE_TTL_MS = 60_000; // 60s — Admin invalidates via BroadcastChannel anyway
const FALLBACK_MULTIPLIER = 1.4;

// ─── Module-level singleton state (shared by ALL consumers) ──────────────────
// Without this, 38 EstimateRows on a project = 38 simultaneous fetches → HTTP 429.
type Listener = (value: number) => void;

let cachedMultiplier: number | null = null;
let cachedAt = 0;
let inFlightPromise: Promise<number> | null = null;
const listeners: Set<Listener> = new Set();

function notifyListeners(value: number): void {
  listeners.forEach((fn) => {
    try {
      fn(value);
    } catch {
      // Silent — listener errors must not break others.
    }
  });
}

async function fetchOnce(force = false): Promise<number> {
  const now = Date.now();
  if (!force && cachedMultiplier !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedMultiplier;
  }
  if (inFlightPromise) {
    return inFlightPromise;
  }
  inFlightPromise = (async () => {
    try {
      const response = await fetch("/api/admin/knr-multiplier", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { multiplier?: number };
      const value = typeof data.multiplier === "number" && data.multiplier > 0
        ? data.multiplier
        : FALLBACK_MULTIPLIER;
      cachedMultiplier = value;
      cachedAt = Date.now();
      notifyListeners(value);
      return value;
    } catch (error) {
      console.error("[useKnrMultiplier] Failed to fetch:", error);
      // On failure: keep previous cache if any; otherwise fall back.
      const value = cachedMultiplier ?? FALLBACK_MULTIPLIER;
      // Do NOT update cachedAt on failure → next call retries sooner.
      return value;
    } finally {
      inFlightPromise = null;
    }
  })();
  return inFlightPromise;
}

// BroadcastChannel — singleton (not per-component) to avoid leaks.
let broadcastChannel: BroadcastChannel | null = null;
let broadcastChannelInitialized = false;

function ensureBroadcastChannel(): void {
  if (broadcastChannelInitialized) return;
  broadcastChannelInitialized = true;
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    broadcastChannel = new BroadcastChannel(KNR_MULTIPLIER_CHANNEL);
    broadcastChannel.onmessage = () => {
      // Force refetch and notify all components.
      fetchOnce(true).catch(() => {
        // already logged inside fetchOnce
      });
    };
  } catch {
    // BroadcastChannel not supported — silently degrade.
  }
}

/**
 * KNR 2026 Multiplier Hook — Display-Time Architecture (v2: singleton)
 *
 * - Module-level cache: ONE fetch per page-load shared by all consumers.
 * - In-flight promise dedup: simultaneous mounts coalesce into one request.
 * - 60-second TTL; admin changes invalidate immediately via BroadcastChannel.
 * - Fixes the 429-storm bug: previously each EstimateRow triggered its own
 *   fetch, producing 38+ parallel requests on project mount.
 *
 * See: lib/pricing-calculations.ts → calcRowPrices() for usage.
 */
export function useKnrMultiplier() {
  const [multiplier, setMultiplier] = useState<number>(
    cachedMultiplier ?? FALLBACK_MULTIPLIER,
  );
  const [isLoading, setIsLoading] = useState<boolean>(cachedMultiplier === null);

  useEffect(() => {
    let isActive = true;

    // Subscribe to global updates (admin changes, refetch results).
    const listener: Listener = (value) => {
      if (isActive) setMultiplier(value);
    };
    listeners.add(listener);

    ensureBroadcastChannel();

    fetchOnce()
      .then((value) => {
        if (isActive) {
          setMultiplier(value);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      listeners.delete(listener);
    };
  }, []);

  return { multiplier, isLoading };
}

/**
 * Force a refresh of the cached multiplier.
 * Useful after admin updates the value programmatically (e.g., server action).
 */
export function invalidateKnrMultiplierCache(): Promise<number> {
  return fetchOnce(true);
}
