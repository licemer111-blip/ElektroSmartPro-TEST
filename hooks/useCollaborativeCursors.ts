"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import throttle from "lodash/throttle";
import type { UIStatePayload } from "@/components/project/collaborator-cursors";

type CursorPayload = {
  x: number;
  y: number;
  scrollX: number;
  scrollY: number;
  route: string;
  userId: string;
  activeTab?: string;
};

export type UserPresence = {
  userId: string;
  online_at: string;
  route: string;
  email?: string;
  displayName?: string;
};

export type ClickRipple = {
  id: string;
  x: number;
  y: number;
  scrollX: number;
  scrollY: number;
  userId: string;
};

export type FollowMode = "off" | "following";

interface UseCollaborativeCursorsOptions {
  projectId: string;
  userId: string;
  onTabSync?: (tab: string) => void;
  activeTab?: string;
  onUIStateSync?: (state: UIStatePayload) => void;
  uiState?: UIStatePayload;
  isExternalSync?: boolean;
}

export interface CollaborativeCursorsState {
  cursors: Record<string, CursorPayload>;
  onlineUsers: Record<string, UserPresence>;
  clickRipples: ClickRipple[];
  followMode: FollowMode;
  followingUserId: string | null;
  showUserList: boolean;
  myScroll: { x: number; y: number };
  setShowUserList: (v: boolean) => void;
  setFollowMode: (v: FollowMode) => void;
  setFollowingUserId: (v: string | null) => void;
  startFollowing: (targetUserId: string) => void;
  getDisplayName: (uid: string) => string;
}

export function useCollaborativeCursors({
  projectId,
  userId,
  onTabSync,
  activeTab: externalActiveTab,
  onUIStateSync,
  uiState: externalUIState,
  isExternalSync,
}: UseCollaborativeCursorsOptions): CollaborativeCursorsState {
  const [cursors, setCursors] = useState<Record<string, CursorPayload>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [clickRipples, setClickRipples] = useState<ClickRipple[]>([]);
  const [followMode, setFollowMode] = useState<FollowMode>("off");
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [myScroll, setMyScroll] = useState({ x: 0, y: 0 });
  const [currentTab, setCurrentTab] = useState<string>("estimate");
  const isScrollingSyncRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const updateScroll = () => {
      setMyScroll({ x: window.scrollX, y: window.scrollY });
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const broadcastTabChange = useCallback((tab: string) => {
    if (!channelRef.current || channelRef.current.state !== "joined") return;
    setCurrentTab(tab);
    channelRef.current.send({
      type: "broadcast",
      event: "tab-change",
      payload: { userId, tab },
    });
  }, [userId]);

  const broadcastUIState = useMemo(
    () =>
      throttle((state: UIStatePayload) => {
        if (!channelRef.current || channelRef.current.state !== "joined") return;
        channelRef.current.send({
          type: "broadcast",
          event: "ui-state",
          payload: { userId, ...state },
        });
      }, 500),
    [userId]
  );

  const broadcastScroll = useMemo(
    () =>
      throttle((scrollX: number, scrollY: number) => {
        if (!channelRef.current || channelRef.current.state !== "joined") return;
        channelRef.current.send({
          type: "broadcast",
          event: "scroll-sync",
          payload: { userId, scrollX, scrollY },
        });
      }, 200),
    [userId]
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!isScrollingSyncRef.current) {
        broadcastScroll(window.scrollX, window.scrollY);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [broadcastScroll]);

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== currentTab) {
      broadcastTabChange(externalActiveTab);
    }
  }, [externalActiveTab, currentTab, broadcastTabChange]);

  const lastBroadcastedUIStateRef = useRef<string>("");
  useEffect(() => {
    if (externalUIState && !isExternalSync) {
      const stateString = JSON.stringify(externalUIState);
      if (stateString !== lastBroadcastedUIStateRef.current) {
        lastBroadcastedUIStateRef.current = stateString;
        broadcastUIState(externalUIState);
      }
    }
  }, [externalUIState, isExternalSync, broadcastUIState]);

  const broadcastCursor = useMemo(
    () =>
      throttle((x: number, y: number, scrollX: number, scrollY: number) => {
        if (!channelRef.current || channelRef.current.state !== "joined") return;
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-move",
          payload: { userId, x, y, scrollX, scrollY, route: pathname, activeTab: currentTab },
        });
      }, 50),
    [userId, pathname, currentTab]
  );

  useEffect(() => {
    if (!projectId || !userId) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`project-cursors-${projectId}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users: Record<string, UserPresence> = {};
        Object.keys(newState).forEach((key) => {
          if (key === userId) return;
          const data = newState[key]?.[0] as unknown as UserPresence;
          if (data) users[key] = data;
        });
        setOnlineUsers(users);
        if (followingUserId && !users[followingUserId]) {
          setFollowMode("off");
          setFollowingUserId(null);
        }
      })
      .on("broadcast", { event: "cursor-move" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;
        setCursors((prev) => ({
          ...prev,
          [payload.userId]: {
            userId: payload.userId,
            x: payload.x,
            y: payload.y,
            scrollX: payload.scrollX || 0,
            scrollY: payload.scrollY || 0,
            route: payload.route,
            activeTab: payload.activeTab,
          },
        }));
      })
      .on("broadcast", { event: "route-change" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;
        if (followMode === "following" && followingUserId === payload.userId) {
          if (payload.route && payload.route !== pathname) {
            router.push(payload.route);
          }
        }
      })
      .on("broadcast", { event: "tab-change" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;
        setCursors((prev) => ({
          ...prev,
          [payload.userId]: { ...prev[payload.userId], activeTab: payload.tab },
        }));
        if (followMode === "following" && followingUserId === payload.userId) {
          if (onTabSync && payload.tab) onTabSync(payload.tab);
        }
      })
      .on("broadcast", { event: "scroll-sync" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;
        if (followMode === "following" && followingUserId === payload.userId) {
          isScrollingSyncRef.current = true;
          window.scrollTo({ left: payload.scrollX, top: payload.scrollY, behavior: "instant" });
          setTimeout(() => { isScrollingSyncRef.current = false; }, 100);
        }
      })
      .on("broadcast", { event: "ui-state" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;

        // Pult 5-w-1 + estimate toolbar — always sync to ALL observers (not just followers)
        if (onUIStateSync) {
          const alwaysPatch: UIStatePayload = {};
          // Pult 5-w-1 doc settings
          if (payload.liveVatRate !== undefined) alwaysPatch.liveVatRate = payload.liveVatRate;
          if (payload.liveBruttoMode !== undefined) alwaysPatch.liveBruttoMode = payload.liveBruttoMode;
          if (payload.liveShowKnr !== undefined) alwaysPatch.liveShowKnr = payload.liveShowKnr;
          if (payload.liveShowLaborHours !== undefined) alwaysPatch.liveShowLaborHours = payload.liveShowLaborHours;
          if (payload.liveExpertColoring !== undefined) alwaysPatch.liveExpertColoring = payload.liveExpertColoring;
          if (payload.compactView !== undefined) alwaysPatch.compactView = payload.compactView;
          if (payload.summaryCollapsed !== undefined) alwaysPatch.summaryCollapsed = payload.summaryCollapsed;
          if (payload.liveRegionId !== undefined) alwaysPatch.liveRegionId = payload.liveRegionId;
          // Estimate table toolbar (filter, sort, view)
          if (payload.filterType !== undefined) alwaysPatch.filterType = payload.filterType;
          if (payload.estimateSortBy !== undefined) alwaysPatch.estimateSortBy = payload.estimateSortBy;
          if (payload.estimateSortOrder !== undefined) alwaysPatch.estimateSortOrder = payload.estimateSortOrder;
          if (Object.keys(alwaysPatch).length > 0) onUIStateSync(alwaysPatch);
        }

        // Following-mode-only sync (tabs, dialogs, catalog, scroll, etc.)
        if (followMode === "following" && followingUserId === payload.userId) {
          if (onUIStateSync) {
            onUIStateSync({
              catalogOpen: payload.catalogOpen,
              expandedCategories: payload.expandedCategories,
              catalogScrollTop: payload.catalogScrollTop,
              catalogSearchTerm: payload.catalogSearchTerm,
              catalogViewMode: payload.catalogViewMode,
              catalogCreateDialogOpen: payload.catalogCreateDialogOpen,
              catalogEditDialogOpen: payload.catalogEditDialogOpen,
              catalogEditItemId: payload.catalogEditItemId,
              openDialog: payload.openDialog,
              assemblyViewMode: payload.assemblyViewMode,
              assemblySelectedId: payload.assemblySelectedId,
              assemblyQuantity: payload.assemblyQuantity,
              assemblyDetailOpen: payload.assemblyDetailOpen,
              colorMode: payload.colorMode,
              filterType: payload.filterType,
              estimateSearchOpen: payload.estimateSearchOpen,
              estimateSearchQuery: payload.estimateSearchQuery,
              estimateSortBy: payload.estimateSortBy,
              estimateSortOrder: payload.estimateSortOrder,
              estimateLegendOpen: payload.estimateLegendOpen,
              estimateEditItemId: payload.estimateEditItemId,
              mainScrollTop: payload.mainScrollTop,
              coPilotActive: payload.coPilotActive,
              headerAiAssistantOpen: payload.headerAiAssistantOpen,
              headerAiImportOpen: payload.headerAiImportOpen,
              headerAiPricerOpen: payload.headerAiPricerOpen,
              headerMembersOpen: payload.headerMembersOpen,
              headerPanelOpen: payload.headerPanelOpen,
              headerDocsOpen: payload.headerDocsOpen,
              headerPortalOpen: payload.headerPortalOpen,
            });
          }
        }
      })
      .on("broadcast", { event: "click" }, ({ payload }) => {
        if (!payload || !payload.userId || payload.userId === userId) return;
        const ripple: ClickRipple = {
          id: `${payload.userId}-${Date.now()}`,
          x: payload.x,
          y: payload.y,
          scrollX: payload.scrollX || 0,
          scrollY: payload.scrollY || 0,
          userId: payload.userId,
        };
        setClickRipples((prev) => [...prev, ripple]);
        setTimeout(() => {
          setClickRipples((prev) => prev.filter((r) => r.id !== ripple.id));
        }, 800);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          const email = user?.email ?? "";
          const displayName = user?.user_metadata?.full_name ?? email.split("@")[0] ?? `User ${userId.slice(0, 6)}`;
          await channel.track({
            userId,
            online_at: new Date().toISOString(),
            route: pathname,
            email,
            displayName,
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [projectId, userId, pathname, supabase, followMode, followingUserId, router, onTabSync, onUIStateSync]);

  useEffect(() => {
    if (!channelRef.current || !userId) return;
    const handleMouseMove = (e: MouseEvent) => {
      broadcastCursor(e.pageX, e.pageY, window.scrollX, window.scrollY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [broadcastCursor, userId]);

  useEffect(() => {
    if (!channelRef.current || !userId || channelRef.current.state !== "joined") return;
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      channelRef.current.send({
        type: "broadcast",
        event: "route-change",
        payload: { userId, route: pathname },
      });
    }
  }, [pathname, userId]);

  useEffect(() => {
    if (!channelRef.current || !userId) return;
    const handleClick = (e: MouseEvent) => {
      if (!channelRef.current || channelRef.current.state !== "joined") return;
      channelRef.current.send({
        type: "broadcast",
        event: "click",
        payload: { userId, x: e.pageX, y: e.pageY, scrollX: window.scrollX, scrollY: window.scrollY },
      });
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [userId]);

  useEffect(() => {
    setCursors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (!onlineUsers[key]) delete updated[key];
      });
      return updated;
    });
  }, [onlineUsers]);

  const getDisplayName = useCallback((uid: string) => {
    const user = onlineUsers[uid];
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return `User ${uid.slice(0, 6)}`;
  }, [onlineUsers]);

  const startFollowing = useCallback((targetUserId: string) => {
    setFollowingUserId(targetUserId);
    setFollowMode("following");
    setShowUserList(false);
    const targetCursor = cursors[targetUserId];
    if (targetCursor?.route && targetCursor.route !== pathname) {
      router.push(targetCursor.route);
    }
    if (targetCursor?.activeTab && onTabSync) {
      onTabSync(targetCursor.activeTab);
    }
    if (targetCursor) {
      isScrollingSyncRef.current = true;
      window.scrollTo({ left: targetCursor.scrollX, top: targetCursor.scrollY, behavior: "smooth" });
      setTimeout(() => { isScrollingSyncRef.current = false; }, 600);
    }
  }, [cursors, pathname, router, onTabSync]);

  return {
    cursors,
    onlineUsers,
    clickRipples,
    followMode,
    followingUserId,
    showUserList,
    myScroll,
    setShowUserList,
    setFollowMode,
    setFollowingUserId,
    startFollowing,
    getDisplayName,
  };
}
