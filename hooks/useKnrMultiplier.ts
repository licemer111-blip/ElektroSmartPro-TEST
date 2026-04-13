"use client";

import { useEffect, useState, useCallback } from "react";

const KNR_MULTIPLIER_CHANNEL = "knr-multiplier-updates";

/**
 * KNR 2026 Multiplier Hook — Display-Time Architecture
 * 
 * Architecture:
 *   - Database stores BASE prices (without multiplier)
 *   - This hook fetches the multiplier from admin_settings
 *   - calcRowPrices() applies multiplier at render time
 *   - When admin changes multiplier → BroadcastChannel notifies all tabs
 *   - Result: instant recalculation without database migration
 * 
 * Performance:
 *   - Initial fetch on mount (one-time)
 *   - BroadcastChannel for real-time admin updates (no polling)
 *   - Cached in component state
 * 
 * See: lib/pricing-calculations.ts → calcRowPrices() for usage
 */
export function useKnrMultiplier() {
  const [multiplier, setMultiplier] = useState(1.4);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMultiplier = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/knr-multiplier");
      if (response.ok) {
        const data = await response.json();
        setMultiplier(data.multiplier ?? 1.4);
      }
    } catch (error) {
      console.error("[useKnrMultiplier] Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    fetchMultiplier();

    // Listen for BroadcastChannel updates (from Admin Panel)
    // No polling needed — admin changes trigger immediate update
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(KNR_MULTIPLIER_CHANNEL);
      channel.onmessage = () => {
        fetchMultiplier();
      };
    } catch {
      // BroadcastChannel not supported (e.g., SSR, some browsers)
    }

    return () => {
      channel?.close();
    };
  }, [fetchMultiplier]);

  return { multiplier, isLoading };
}
