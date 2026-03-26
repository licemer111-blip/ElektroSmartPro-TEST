"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import throttle from 'lodash/throttle';

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export type ProjectTab = "estimate" | "materials" | "notes" | "settings";

export interface UserPresence {
  user_id: string;
  name: string;
  email: string;
  color: string;
  online_at: string;
  activeTab?: ProjectTab;
  cursor?: CursorPosition;
}

export interface PresenceState {
  [key: string]: UserPresence[];
}

// Generate consistent color from user_id
function generateUserColor(userId: string): string {
  const colors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
    "#10B981", "#EF4444", "#06B6D4", "#F97316",
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function useProjectPresence(projectId: string | null, userId?: string) {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Создаем клиент и канал ref один раз
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Мемоизируем цвет
  const myColor = useMemo(() => 
    userId ? generateUserColor(userId) : "#3B82F6", 
    [userId]
  );

  // Helper to check if channel is connected
  const isChannelConnected = useCallback(() => {
    return channelRef.current?.state === 'joined';
  }, []);

  // ВАЖНО: useMemo для throttle с ref
  const broadcastCursor = useMemo(
    () => throttle((x: number, y: number) => {
      // Only send if channel is subscribed/joined
      if (channelRef.current && userId && channelRef.current.state === 'joined') {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: { 
            user_id: userId,
            x, 
            y, 
            timestamp: Date.now()
          },
        });
      }
    }, 50),
    [userId]
  );

  // ВАЖНО: useCallback без зависимости от state
  const updatePresence = useCallback(async (updates: Partial<UserPresence>) => {
    if (channelRef.current) {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updatedPresence = {
          ...prev,
          ...updates,
          online_at: new Date().toISOString(),
        };
        channelRef.current?.track(updatedPresence);
        return updatedPresence;
      });
    }
  }, []);

  const setActiveTab = useCallback((tab: ProjectTab) => {
    updatePresence({ activeTab: tab });
  }, [updatePresence]);

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    const setupPresence = async () => {
      try {
        let userIdToUse = userId;
        
        if (!userIdToUse) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !mounted) {
            return;
          }
          userIdToUse = user.id;
        }
        
        if (!userIdToUse || !mounted) return;

        // Используем email из auth.user БЕЗ fetch к profiles
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.email?.split('@')[0] || "Anonymous";
        const userEmail = user?.email || "";

        const userPresence: UserPresence = {
          user_id: userIdToUse,
          name: userName,
          email: userEmail,
          color: myColor,
          online_at: new Date().toISOString(),
        };

        setCurrentUser(userPresence);

        const channelName = `estimate:${projectId}`;
        const newChannel = supabase.channel(channelName, {
          config: {
            presence: {
              key: userIdToUse,
            },
          },
        });

        newChannel
          .on("presence", { event: "sync" }, () => {
            if (!mounted) return;
            const state = newChannel.presenceState();
            // Используем функциональное обновление
            setPresenceState((prev) => {
              const newState = state as unknown as PresenceState;
              if (JSON.stringify(prev) === JSON.stringify(newState)) return prev;
              return newState;
            });
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          })
          .on("broadcast", { event: "cursor-pos" }, ({ payload }) => {
            if (!mounted || !payload || !payload.user_id) return;
            if (payload.user_id === userIdToUse) return;

            setPresenceState((prev) => {
              const userKey = Object.keys(prev).find((key) => {
                const presence = prev[key]?.[0];
                return presence?.user_id === payload.user_id;
              });
              
              if (userKey && prev[userKey]) {
                return {
                  ...prev,
                  [userKey]: prev[userKey].map((p) => ({
                    ...p,
                    cursor: {
                      x: payload.x,
                      y: payload.y,
                      timestamp: payload.timestamp,
                    },
                  })),
                };
              }
              
              return prev;
            });
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && mounted) {
              await newChannel.track(userPresence);
              setIsConnected(true);
            }
          });

        channelRef.current = newChannel;
      } catch {
        // presence setup error ignored
      }
    };

    setupPresence();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [projectId, userId, myColor, supabase]);

  // Вычисляем производные значения
  const otherUsers = useMemo(() => 
    Object.values(presenceState)
      .flat()
      .filter((user) => user.user_id !== currentUser?.user_id),
    [presenceState, currentUser]
  );

  const usersOnSameTab = useMemo(() =>
    otherUsers.filter((user) => user.activeTab === currentUser?.activeTab),
    [otherUsers, currentUser]
  );

  const tabActivity: Record<ProjectTab, number> = useMemo(() => {
    const activity = {
      estimate: 0,
      materials: 0,
      notes: 0,
      settings: 0,
    };
    
    otherUsers.forEach((user) => {
      if (user.activeTab) {
        activity[user.activeTab]++;
      }
    });

    return activity;
  }, [otherUsers]);

  return {
    presenceState,
    currentUser,
    otherUsers,
    usersOnSameTab,
    tabActivity,
    isConnected,
    broadcastCursor,
    updatePresence,
    setActiveTab,
  };
}
