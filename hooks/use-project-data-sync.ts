"use client";

import { useEffect, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Simple broadcast storage - stores the broadcast function
let broadcastFn: ((changeType: string) => void) | null = null;

// Track time of last own write to suppress postgres_changes echo
let lastOwnWriteTs = 0;
const OWN_WRITE_SUPPRESS_MS = 2000; // ignore postgres_changes for 2s after own write

function setBroadcastFunction(fn: ((changeType: string) => void) | null) {
  broadcastFn = fn;
}

function callBroadcast(changeType: string) {
  if (broadcastFn) {
    lastOwnWriteTs = Date.now(); // mark own write timestamp
    broadcastFn(changeType);
  }
}

/**
 * Hook for real-time project data synchronization
 * Uses both broadcast events AND postgres_changes for reliability
 */
export function useProjectDataSync(projectId: string, userId: string) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId || !userId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Debounced refresh function (avoid multiple refreshes in short time)
    const debouncedRefresh = (source: string, triggeredByUserId?: string) => {
      // Не обновляем если это наши собственные изменения (для broadcast)
      if (triggeredByUserId && triggeredByUserId === userId) {
        return;
      }
      
      // Не обновляем чаще чем раз в секунду
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) {
        return;
      }
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        lastRefreshRef.current = Date.now();
        router.refresh(); // Refresh server-side data
      }, 300);
    };

    // Broadcast function
    const broadcastChange = (changeType: string) => {
      // Only send if channel is subscribed/joined
      if (channelRef.current && channelRef.current.state === 'joined') {
        channelRef.current.send({
          type: "broadcast",
          event: "data-changed",
          payload: {
            userId,
            changeType,
            timestamp: Date.now(),
          },
        });
      }
    };

    // Register broadcast function globally
    setBroadcastFunction(broadcastChange);

    // Create channel with BOTH broadcast and postgres_changes
    const channel = supabase
      .channel(`project-sync-${projectId}`)
      // BROADCAST: Reliable - works always (same as cursors)
      .on("broadcast", { event: "data-changed" }, ({ payload }) => {
        debouncedRefresh("broadcast", payload?.userId);
      })
      // POSTGRES CHANGES: Only react to OTHER users' changes
      // Own writes are suppressed for OWN_WRITE_SUPPRESS_MS to prevent refresh loops
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          if (Date.now() - lastOwnWriteTs < OWN_WRITE_SUPPRESS_MS) return;
          debouncedRefresh("postgres_changes");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_items",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          if (Date.now() - lastOwnWriteTs < OWN_WRITE_SUPPRESS_MS) return;
          debouncedRefresh("postgres_changes");
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      setBroadcastFunction(null);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [projectId, userId, router, supabase]);

  return {
    broadcastChange: callBroadcast,
  };
}

/**
 * Broadcast data change to other users
 * Can be called from anywhere in the app
 */
export function broadcastDataChange(changeType: string) {
  callBroadcast(changeType);
}
