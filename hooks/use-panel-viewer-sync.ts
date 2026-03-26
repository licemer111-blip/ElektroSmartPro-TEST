"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import throttle from "lodash/throttle";
import debounce from "lodash/debounce";
import type { PanelSection, DinModule } from "@/components/project/panel-configurator-types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PanelSyncState {
  activeTab: string;
  activeSectionIdx: number;
  selectedUid: string | null;
  editingAccessoryUid: string | null;
  showAiPanel: boolean;
  aiDescription: string;
  pricingMode: "none" | "ai" | "manual";
  catalogMode: "default" | "custom";
  collapsedCats: string[];       // serialized from Set<string>
  // Extended sync fields
  panelName: string;
  selectedManufacturerId: string; // serialized Manufacturer.id
  customCoefficient: number;
  showLoadDialog: boolean;
  showClearConfirm: boolean;
  moduleSearch: string;
  collapsedCustomCats: string[]; // serialized from Set<string>
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
}

export interface PanelOnlineUser {
  userId: string;
  name: string;
  color: string;
  online_at: string;
}

function generateUserColor(userId: string): string {
  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444", "#06B6D4", "#F97316"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePanelViewerSync(projectId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PanelOnlineUser[]>([]);

  // Follow mode
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [leaderId, setLeaderId] = useState<string | null>(null);

  // State received from leader (UI sync)
  const [receivedState, setReceivedState] = useState<Partial<PanelSyncState> | null>(null);

  // Data received from any collaborator (bidirectional sections sync)
  const [receivedSections, setReceivedSections] = useState<PanelSection[] | null>(null);

  // Custom catalog received from any collaborator
  const [receivedCustomModules, setReceivedCustomModules] = useState<DinModule[] | null>(null);
  const [receivedCustomCats, setReceivedCustomCats] = useState<Record<string, string> | null>(null);

  // Track last broadcasted custom catalog to avoid loops
  const lastCustomCatalogBroadcastRef = useRef<string>("");

  // Track last broadcasted state to avoid re-broadcast loops
  const lastBroadcastRef = useRef<string>("");
  // Track last broadcasted sections to avoid re-broadcast loops
  const lastSectionsBroadcastRef = useRef<string>("");

  // ── Race-condition protection ──────────────────────────────────────────────
  // Last accepted remote timestamp — discard packets older than this
  const lastRemoteTsRef = useRef<number>(0);
  // Per-section last-write timestamps from remotes: sectionId → ts
  // Used for section-level LWW merge
  const sectionRemoteTsRef = useRef<Map<string, number>>(new Map());
  // Local edit guard: timestamp of last local mutation
  // Incoming remote data is ignored for EDIT_GUARD_MS after a local edit
  const localEditTsRef = useRef<number>(0);
  const EDIT_GUARD_MS = 600;

  // Throttled broadcast for non-text states (500ms)
  const broadcastThrottled = useMemo(
    () =>
      throttle((channel: RealtimeChannel, userId: string, state: Partial<PanelSyncState>) => {
        if (channel.state !== "joined") return;
        channel.send({
          type: "broadcast",
          event: "panel-state",
          payload: { userId, ...state },
        });
      }, 500),
    []
  );

  // Debounced broadcast for text input (300ms — saves bandwidth on typing)
  const broadcastDebounced = useMemo(
    () =>
      debounce((channel: RealtimeChannel, userId: string, aiDescription: string) => {
        if (channel.state !== "joined") return;
        channel.send({
          type: "broadcast",
          event: "panel-state",
          payload: { userId, aiDescription },
        });
      }, 300),
    []
  );

  // Throttled broadcast for sections data (300ms — balances responsiveness vs bandwidth)
  const broadcastSectionsThrottled = useMemo(
    () =>
      throttle((channel: RealtimeChannel, userId: string, sections: PanelSection[]) => {
        if (channel.state !== "joined") return;
        channel.send({
          type: "broadcast",
          event: "panel-data",
          payload: { userId, sections, ts: Date.now() },
        });
      }, 300),
    []
  );

  // Public: broadcast UI state (called by all users — only non-viewers send UI state)
  const broadcastPanelState = useCallback(
    (state: Partial<PanelSyncState>) => {
      if (!channelRef.current || !myUserId || isViewerMode) return;

      const stateStr = JSON.stringify(state);
      if (stateStr === lastBroadcastRef.current) return;
      lastBroadcastRef.current = stateStr;

      // Text input uses debounce, everything else uses throttle
      if ("aiDescription" in state && Object.keys(state).length === 1) {
        broadcastDebounced(channelRef.current, myUserId, state.aiDescription ?? "");
      } else {
        broadcastThrottled(channelRef.current, myUserId, state);
      }
    },
    [myUserId, isViewerMode, broadcastThrottled, broadcastDebounced]
  );

  // Public: broadcast sections data (called by ALL users — bidirectional editing)
  const broadcastSections = useCallback(
    (sections: PanelSection[]) => {
      if (!channelRef.current || !myUserId) return;

      const sectionsStr = JSON.stringify(sections);
      if (sectionsStr === lastSectionsBroadcastRef.current) return;
      lastSectionsBroadcastRef.current = sectionsStr;

      // Record local edit timestamp for edit-guard
      localEditTsRef.current = Date.now();

      broadcastSectionsThrottled(channelRef.current, myUserId, sections);
    },
    [myUserId, broadcastSectionsThrottled]
  );

  // Public: broadcast custom catalog (called by ALL users — bidirectional)
  const broadcastCustomCatalog = useCallback(
    (customModules: DinModule[], customCats: Record<string, string>) => {
      if (!channelRef.current || !myUserId) return;

      const key = JSON.stringify({ customModules, customCats });
      if (key === lastCustomCatalogBroadcastRef.current) return;
      lastCustomCatalogBroadcastRef.current = key;

      if (channelRef.current.state !== "joined") return;
      channelRef.current.send({
        type: "broadcast",
        event: "panel-catalog",
        payload: { userId: myUserId, customModules, customCats },
      });
    },
    [myUserId]
  );

  const startFollowing = useCallback((targetUserId: string) => {
    setLeaderId(targetUserId);
    setIsViewerMode(true);
    setReceivedState(null);
  }, []);

  const stopFollowing = useCallback(() => {
    setLeaderId(null);
    setIsViewerMode(false);
    setReceivedState(null);
  }, []);

  const leaderName = useMemo(
    () => onlineUsers.find((u) => u.userId === leaderId)?.name ?? null,
    [onlineUsers, leaderId]
  );

  // ─── Channel setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const uid = user.id;
      const name = user.email?.split("@")[0] ?? `user-${uid.slice(0, 6)}`;
      const color = generateUserColor(uid);

      setMyUserId(uid);
      setMyName(name);

      const channelName = `panel-sync-${projectId}`;
      const ch = supabase.channel(channelName, {
        config: { presence: { key: uid } },
      });

      channelRef.current = ch;

      ch
        // ── Presence: who is online ─────────────────────────────────────────
        .on("presence", { event: "sync" }, () => {
          if (!mounted) return;
          const state = ch.presenceState();
          const users: PanelOnlineUser[] = [];
          Object.entries(state).forEach(([key, presences]) => {
            if (key === uid) return;
            const p = (presences as unknown as PanelOnlineUser[])[0];
            if (p) users.push(p);
          });
          setOnlineUsers(users);
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          if (!mounted) return;
          setOnlineUsers((prev) => prev.filter((u) => u.userId !== key));
          // If the leader left, exit viewer mode
          setLeaderId((prev) => {
            if (prev === key) {
              setIsViewerMode(false);
              setReceivedState(null);
              return null;
            }
            return prev;
          });
        })
        // ── Panel UI state from leader → follower ──────────────────────────
        .on("broadcast", { event: "panel-state" }, ({ payload }) => {
          if (!payload || !payload.userId || payload.userId === uid) return;
          if (!mounted) return;

          setLeaderId((currentLeader) => {
            if (currentLeader === payload.userId) {
              // Apply received state (remove userId field)
              const { userId: _uid, ...incoming } = payload as { userId: string } & Partial<PanelSyncState>;
              setReceivedState(incoming);
            }
            return currentLeader;
          });
        })
        // ── Panel data (sections) from any collaborator → all others ───────
        .on("broadcast", { event: "panel-data" }, ({ payload }) => {
          if (!payload || !payload.userId || payload.userId === uid) return;
          if (!mounted) return;

          const remoteTsRaw = payload.ts as number | undefined;
          const remoteTs = typeof remoteTsRaw === "number" ? remoteTsRaw : Date.now();

          // 1. Timestamp LWW: discard if this packet is older than the last one we applied
          if (remoteTs < lastRemoteTsRef.current) return;

          // 2. Edit-guard: if user made a local change very recently, skip
          //    (their changes are in-flight and must not be overwritten)
          if (Date.now() - localEditTsRef.current < EDIT_GUARD_MS) return;

          lastRemoteTsRef.current = remoteTs;

          if (payload.sections) {
            const incomingSections = payload.sections as PanelSection[];

            // 3. Per-section LWW: stamp each section with remoteTs
            incomingSections.forEach(s => {
              const prev = sectionRemoteTsRef.current.get(s.id) ?? 0;
              if (remoteTs >= prev) sectionRemoteTsRef.current.set(s.id, remoteTs);
            });

            setReceivedSections(incomingSections);
          }
        })
        // ── Custom catalog from any collaborator → all others ───────────────
        .on("broadcast", { event: "panel-catalog" }, ({ payload }) => {
          if (!payload || !payload.userId || payload.userId === uid) return;
          if (!mounted) return;

          if (payload.customModules !== undefined) setReceivedCustomModules(payload.customModules as DinModule[]);
          if (payload.customCats !== undefined) setReceivedCustomCats(payload.customCats as Record<string, string>);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && mounted) {
            await ch.track({ userId: uid, name, color, online_at: new Date().toISOString() });
            setIsConnected(true);
          }
        });
    };

    setup();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [projectId, supabase]);

  return {
    broadcastPanelState,
    broadcastSections,
    broadcastCustomCatalog,
    receivedState,
    receivedSections,
    receivedCustomModules,
    receivedCustomCats,
    isViewerMode,
    leaderId,
    leaderName,
    onlineUsers,
    startFollowing,
    stopFollowing,
    isConnected,
    myUserId,
    myName,
  };
}
