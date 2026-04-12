"use client";

import { useEffect, useState } from "react";

/**
 * Hook to fetch KNR 2026 multiplier from admin_settings.
 * Uses server action to avoid prop drilling.
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

    fetchMultiplier();
  }, []);

  return { multiplier, isLoading };
}
