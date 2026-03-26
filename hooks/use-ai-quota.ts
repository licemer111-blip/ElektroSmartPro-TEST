"use client";

import { useState, useEffect, useCallback } from "react";
import { getAiQuotaForFunctions } from "@/lib/ai-usage";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT, type AiFunctionName } from "@/lib/ai-quota-config";

export interface AiQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
  isExhausted: boolean;
  isLow: boolean; // remaining === 1 for demo users
}

export interface UseAiQuotaReturn {
  quota: Record<string, AiQuotaInfo>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Client-side hook to read AI quota for one or more functions.
 * Fetches from server action — call refresh() after each AI use.
 */
export function useAiQuota(
  userId: string | null | undefined,
  functionNames: AiFunctionName[]
): UseAiQuotaReturn {
  const [quota, setQuota] = useState<Record<string, AiQuotaInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuota = useCallback(async () => {
    if (!userId || functionNames.length === 0) return;
    setIsLoading(true);
    try {
      const raw = await getAiQuotaForFunctions(userId, functionNames);
      const enriched: Record<string, AiQuotaInfo> = {};
      for (const [fn, info] of Object.entries(raw)) {
        enriched[fn] = {
          ...info,
          isExhausted: info.remaining <= 0,
          isLow: !info.isPro && info.remaining === 1,
        };
      }
      setQuota(enriched);
    } catch {
      // silently fail — UI degrades gracefully
    } finally {
      setIsLoading(false);
    }
  }, [userId, functionNames.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchQuota();
  }, [fetchQuota]);

  return { quota, isLoading, refresh: fetchQuota };
}

/** Convenience: single function quota */
export function useSingleAiQuota(
  userId: string | null | undefined,
  functionName: AiFunctionName
): { info: AiQuotaInfo | null; isLoading: boolean; refresh: () => Promise<void> } {
  const { quota, isLoading, refresh } = useAiQuota(userId, [functionName]);
  return { info: quota[functionName] ?? null, isLoading, refresh };
}

export { DEMO_AI_LIMIT, PRO_AI_LIMIT };
