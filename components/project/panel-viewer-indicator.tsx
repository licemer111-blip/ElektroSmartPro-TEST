"use client";
import React from "react";
import { Eye, X, Radio } from "lucide-react";

interface OnlineUser {
  userId: string;
  name: string;
}

interface PanelViewerIndicatorProps {
  isReadOnly: boolean;
  isViewerMode: boolean;
  leaderName: string | null;
  syncOnlineUsers: OnlineUser[];
  stopFollowing: () => void;
  startFollowing: (userId: string) => void;
}

export function PanelViewerIndicator({
  isReadOnly, isViewerMode, leaderName, syncOnlineUsers, stopFollowing, startFollowing,
}: PanelViewerIndicatorProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
      {isReadOnly ? (
        <div className="pointer-events-auto flex items-center gap-2 bg-amber-600/90 text-white px-4 py-2 rounded-full shadow-lg">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-semibold">Tryb podglądu — edycja zablokowana</span>
        </div>
      ) : isViewerMode && leaderName ? (
        <div className="viewer-indicator pointer-events-auto flex items-center gap-2 text-white px-4 py-2 rounded-full">
          <Eye className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-semibold">Obserwujesz: {leaderName}</span>
          <button onClick={stopFollowing} className="ml-1 hover:bg-blue-700 p-1 rounded-full transition-colors" title="Zatrzymaj obserwowanie">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : !isReadOnly && syncOnlineUsers.length > 0 ? (
        <div className="viewer-online-pill pointer-events-auto flex items-center gap-2 text-white px-3 py-1.5 rounded-full">
          <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Online:</span>
          {syncOnlineUsers.map((u) => (
            <button key={u.userId} onClick={() => startFollowing(u.userId)}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded-full transition-colors"
              title={`Obserwuj ${u.name}`}>
              <Eye className="w-3 h-3" />
              {u.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
