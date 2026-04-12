"use client";

import { useEffect, useState } from "react";

const KNR_MULTIPLIER_CHANNEL = "knr-multiplier-updates";

/**
 * Hook to fetch KNR 2026 multiplier from admin_settings.
 * Uses server action to avoid prop drilling.
 * Auto-refreshes every 30s and listens for BroadcastChannel updates.
 */
export function useKnrMultiplier() {
  const [multiplier, setMultiplier] = useState(1.4);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMultiplier() {
      try {
        const response = await fetch("/api/admin/knr-multiplier");
        if (response.ok) {
          const data = await response.json();
          setMultiplier(data.multiplier ?? 1.4);
        }
      } catch (error) {
        console.error("Failed to fetch KNR multiplier:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchMultiplier();

    // Periodic refresh every 30s
    const interval = setInterval(fetchMultiplier, 30000);

    // Listen for BroadcastChannel updates (from Admin Panel)
    const channel = new BroadcastChannel(KNR_MULTIPLIER_CHANNEL);
    channel.onmessage = () => {
      fetchMultiplier();
    };

    return () => {
      clearInterval(interval);
      channel.close();
    };
  }, []);

  return { multiplier, isLoading };
}
