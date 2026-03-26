"use client";

/**
 * usePanelStore — React hook wrapping the global panelStateStore singleton.
 *
 * Subscribes to changes for a given projectId and re-renders only the
 * consuming component when the snapshot changes.
 */

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { panelStateStore, type PanelSnapshot } from "@/lib/panel-state-store";
import type { PanelSection } from "@/components/project/panel-configurator-types";

export function usePanelStore(projectId: string) {
  const subscribe = useCallback(
    (cb: () => void) => panelStateStore.subscribe(projectId, cb),
    [projectId]
  );

  const getSnapshot = useCallback(
    () => panelStateStore.get(projectId),
    [projectId]
  );

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const write = useCallback(
    (patch: Partial<Omit<PanelSnapshot, "updatedAt">>) => {
      panelStateStore.set(projectId, patch);
    },
    [projectId]
  );

  const writeSections = useCallback(
    (sections: PanelSection[]) => {
      panelStateStore.set(projectId, { sections });
    },
    [projectId]
  );

  const setLinkedItemId = useCallback(
    (itemId: string | null) => {
      panelStateStore.setLinkedItemId(projectId, itemId);
    },
    [projectId]
  );

  return { snapshot, write, writeSections, setLinkedItemId };
}

/**
 * Debounce helper — returns a stable debounced version of fn.
 */
export function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    (...args: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}
