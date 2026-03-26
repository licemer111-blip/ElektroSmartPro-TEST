"use client";

import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null; // Don't show if everything is synced
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-64 z-50">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all duration-300",
          isOnline
            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
            : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isSyncing ? "Syncing..." : "Back Online"}
            </span>
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline Mode</span>
            <AlertCircle className="w-4 h-4" />
          </>
        )}
        
        {pendingCount > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {pendingCount}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Compact version for header
export function OfflineStatusBadge() {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  return (
    <div className="flex items-center gap-1">
      {isOnline ? (
        <Wifi className="w-3 h-3 text-green-500" />
      ) : (
        <WifiOff className="w-3 h-3 text-orange-500" />
      )}
      
      {(isSyncing || pendingCount > 0) && (
        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
          {isSyncing ? (
            <RefreshCw className="w-2 h-2 animate-spin" />
          ) : (
            pendingCount
          )}
        </Badge>
      )}
    </div>
  );
}
