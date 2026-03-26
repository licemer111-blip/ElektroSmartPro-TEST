"use client";

import { useEffect, useState, useCallback } from "react";
import { offlineStorage, type PendingAction } from "@/lib/offline-storage";
import { useToast } from "@/hooks/use-toast";

interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

export function useOfflineSync(options: SyncOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options;
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Get pending actions count
  const updatePendingCount = useCallback(async () => {
    try {
      const actions = await offlineStorage.getPendingActions();
      setPendingCount(actions.length);
    } catch {
      // ignore count error
    }
  }, []);

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const actions = await offlineStorage.getPendingActions();
    
    let successCount = 0;
    let errorCount = 0;

    for (const action of actions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
            ...action.headers,
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (response.ok) {
          await offlineStorage.removePendingAction(action.id);
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++
      }
    }

    setIsSyncing(false);
    await updatePendingCount();

    // Show toast with sync results
    if (successCount > 0 || errorCount > 0) {
      toast({
        title: "Sync Complete",
        description: `${successCount} synced, ${errorCount} failed`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    }

    return { successCount, errorCount };
  }, [isOnline, isSyncing, toast, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingCount, syncPendingActions]);

  // Periodic sync
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      if (isOnline && pendingCount > 0) {
        syncPendingActions();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, isOnline, pendingCount, syncPendingActions]);

  // Initial load
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Save data for offline
  const saveOffline = useCallback(
    async (type: "project" | "projectItem" | "catalog", data: Record<string, unknown>) => {
      try {
        switch (type) {
          case "project":
            await offlineStorage.saveProject(data);
            break;
          case "projectItem":
            await offlineStorage.saveProjectItems([data]);
            break;
          case "catalog":
            await offlineStorage.update("catalogItems", data);
            break;
        }
      } catch {
        toast({
          title: "Offline Save Failed",
          description: "Data may not be available offline",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Queue action for later sync
  const queueAction = useCallback(
    async (endpoint: string, options: {
      method: string;
      body?: unknown;
      headers?: Record<string, string>;
    }) => {
      try {
        await offlineStorage.addPendingAction({
          endpoint,
          method: options.method,
          body: options.body as Record<string, unknown>,
          headers: options.headers,
        });
        await updatePendingCount();
        
        toast({
          title: "Saved Offline",
          description: "Will sync when connection is restored",
        });
      } catch {
        // ignore queue error
      }
    },
    [toast, updatePendingCount]
  );

  // Fetch with offline fallback
  const fetchWithOffline = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      offlineFallback?: () => Promise<unknown>
    ) => {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        return await response.json();
      } catch (error) {
        if (offlineFallback) {
          return await offlineFallback();
        }
        
        throw error;
      }
    },
    []
  );

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingActions,
    saveOffline,
    queueAction,
    fetchWithOffline,
  };
}

// Hook for offline-aware API calls
export function useOfflineAPI() {
  const { queueAction, fetchWithOffline, isOnline } = useOfflineSync();

  const post = useCallback(
    async (url: string, data: Record<string, unknown>, options: RequestInit = {}) => {
      if (!isOnline) {
        await queueAction(url, {
          method: "POST",
          body: data,
          headers: options.headers as Record<string, string>,
        });
        return { offline: true };
      }

      return fetchWithOffline(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });
    },
    [isOnline, queueAction, fetchWithOffline]
  );

  const put = useCallback(
    async (url: string, data: Record<string, unknown>, options: RequestInit = {}) => {
      if (!isOnline) {
        await queueAction(url, {
          method: "PUT",
          body: data,
          headers: options.headers as Record<string, string>,
        });
        return { offline: true };
      }

      return fetchWithOffline(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });
    },
    [isOnline, queueAction, fetchWithOffline]
  );

  const del = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!isOnline) {
        await queueAction(url, {
          method: "DELETE",
          headers: options.headers as Record<string, string>,
        });
        return { offline: true };
      }

      return fetchWithOffline(url, {
        method: "DELETE",
        ...options,
      });
    },
    [isOnline, queueAction, fetchWithOffline]
  );

  return { post, put, delete: del };
}
