"use client";
/**
 * hooks/useMaterialBrain.ts
 * ─────────────────────────────────────────────────────────────────
 * Silent background fetch of Material Brain suggestions.
 * Runs ONCE when `enabled` becomes true. Subsequent enables restore
 * from SessionStorage cache (5 min TTL) — no additional Edge request.
 * Returns a Map<itemId, ItemMaterialBill> — no auto-rendering.
 *
 * v3: VAT-Aware cache key (es-brain-v3-{projectId}-vat{vatRate}).
 * Changing VAT 23%→8% immediately invalidates cache and re-fetches.
 * 100% financial accuracy — no stale prices after VAT toggle.
 */

import { useState, useEffect, useRef } from "react";
import { getMaterialBillForProject } from "@/app/dashboard/projects/[id]/_actions/material-brain-actions";
import type { ItemMaterialBill } from "@/app/dashboard/projects/[id]/_actions/material-brain-actions";

// ─── SessionStorage cache helpers (v3 — VAT-aware key) ───────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function buildCacheKey(projectId: string, vatRate: number): string {
  return `es-brain-v3-${projectId}-vat${vatRate}`;
}

function readBrainCache(projectId: string, vatRate: number): Map<string, ItemMaterialBill> | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(buildCacheKey(projectId, vatRate));
    if (!raw) return null;
    const { bills, ts } = JSON.parse(raw) as {
      bills: [string, ItemMaterialBill][];
      ts:    number;
    };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return new Map(bills);
  } catch { return null; }
}

function writeBrainCache(projectId: string, vatRate: number, bills: Map<string, ItemMaterialBill>): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(buildCacheKey(projectId, vatRate), JSON.stringify({
      bills: [...bills.entries()],
      ts:    Date.now(),
    }));
  } catch { /* quota exceeded — silently skip */ }
}

function clearBrainCache(projectId: string, vatRate: number): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(buildCacheKey(projectId, vatRate));
  } catch { /* ignore */ }
}
// ─────────────────────────────────────────────────────────────────

export interface MaterialBrainState {
  /** Map of itemId → ItemMaterialBill. Empty until fetch completes. */
  bills:     Map<string, ItemMaterialBill>;
  isLoading: boolean;
  /** Number of items that have material suggestions. */
  count:     number;
  /** Force re-fetch and invalidate cache (e.g. after items change). */
  refresh:   () => void;
}

export function useMaterialBrain(
  projectId: string,
  enabled: boolean,
  vatRate: number = 23
): MaterialBrainState {
  const [bills, setBills]       = useState<Map<string, ItemMaterialBill>>(new Map());
  const [isLoading, setLoading] = useState(false);
  const fetchedRef              = useRef(false);
  const projectRef              = useRef(projectId);
  const vatRateRef              = useRef(vatRate);
  const enabledRef              = useRef(enabled);

  /** Full network fetch — writes result to VAT-keyed cache. */
  const fetchFromNetwork = (pid: string, vat: number) => {
    setLoading(true);
    fetchedRef.current = false;
    getMaterialBillForProject(pid).then((result) => {
      const map = new Map<string, ItemMaterialBill>(
        result.bills.map((b) => [b.itemId, b])
      );
      setBills(map);
      writeBrainCache(pid, vat, map);
      fetchedRef.current = true;
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  /** Public refresh: invalidate current VAT-keyed cache + re-fetch. */
  const refresh = () => {
    clearBrainCache(projectRef.current, vatRateRef.current);
    fetchedRef.current = false;
    setBills(new Map());
    fetchFromNetwork(projectRef.current, vatRateRef.current);
  };

  // Keep enabledRef in sync with the prop so VAT effect can read the latest value.
  enabledRef.current = enabled;

  // Reset on project change — always start fresh for a new project.
  useEffect(() => {
    projectRef.current = projectId;
    fetchedRef.current = false;
    setBills(new Map());
    // Note: we intentionally do NOT clear cache here — navigating back
    // to the same project within the session will use the cached data.
  }, [projectId]);

  // VAT change: invalidate OLD cache key and immediately re-fetch if enabled.
  // [enabled] effect won't re-run when only vatRate changes, so we trigger here.
  useEffect(() => {
    const prevVat = vatRateRef.current;
    if (prevVat === vatRate) return;
    clearBrainCache(projectRef.current, prevVat); // clear stale key
    vatRateRef.current = vatRate;
    fetchedRef.current = false;
    setBills(new Map());
    // Re-fetch immediately if material brain is currently active
    if (enabledRef.current) {
      fetchFromNetwork(projectRef.current, vatRate);
    }
  }, [vatRate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      // OPT-4 Loop Guard: do NOT reset fetchedRef on disable.
      // Re-enabling will restore from cache instead of making a new
      // Edge request (prevents SAL price-update → revalidatePath →
      // re-render → useMaterialBrain re-fetch loop).
      return;
    }

    // Cache-first: if fresh data is in SessionStorage for this VAT rate, skip network.
    const cached = readBrainCache(projectRef.current, vatRateRef.current);
    if (cached) {
      setBills(cached);
      fetchedRef.current = true;
      return;
    }

    if (fetchedRef.current) return;
    fetchFromNetwork(projectRef.current, vatRateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    bills,
    isLoading,
    count:   bills.size,
    refresh,
  };
}
