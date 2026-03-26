"use client";

import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import throttle from 'lodash/throttle';

/**
 * V4.0: Global Presence Provider
 * Manages real-time presence and cursor tracking across all project routes
 * 
 * KEY FEATURES:
 * - Tracks user location by pathname (route awareness)
 * - Only renders cursors when users are on the same route
 * - Persists presence across navigation within project
 * - Broadcasts cursor position with route information
 */

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface UserPresence {
  user_id: string;
  name: string;
  email: string;
  color: string;
  online_at: string;
  route?: string;  // Current pathname (e.g., /dashboard/projects/[id]/catalog)
  cursor?: CursorPosition;
}

export interface PresenceState {
  [key: string]: UserPresence[];
}

interface GlobalPresenceContextValue {
  presenceState: PresenceState;
  currentUser: UserPresence | null;
  otherUsers: UserPresence[];
  usersOnSameRoute: UserPresence[];
  routeActivity: Record<string, number>;
  isConnected: boolean;
  broadcastCursor: (x: number, y: number) => void;
  updatePresence: (updates: Partial<UserPresence>) => Promise<void>;
}

const GlobalPresenceContext = createContext<GlobalPresenceContextValue | null>(null);

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

interface GlobalPresenceProviderProps {
  children: ReactNode;
  projectId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
}

export function GlobalPresenceProvider({ children, projectId, userId, userName, userEmail }: GlobalPresenceProviderProps) {
  const pathname = usePathname(); // Track current route
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'SUBSCRIBED' | 'ERROR'>('DISCONNECTED');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const myColor = useMemo(() => generateUserColor(userId), [userId]);

  // Throttled cursor broadcast
  const broadcastCursor = useMemo(
    () => throttle((x: number, y: number) => {
      // Only broadcast if channel is actually joined
      if (!channelRef.current || channelRef.current.state !== 'joined') {
        return;
      }
      
      if (userId) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: { 
            user_id: userId,
            x, 
            y, 
            timestamp: Date.now(),
            route: pathname,
          },
        });
      }
    }, 50),
    [userId, pathname]
  );

  // Update presence with new information
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

  // Update route when pathname changes
  useEffect(() => {
    if (currentUser) {
      updatePresence({ route: pathname });
    }
  }, [pathname, updatePresence, currentUser]);

  // Setup presence channel
  useEffect(() => {
    if (!projectId || !userId) {
      return;
    }

    let mounted = true;

    const setupPresence = async () => {
      try {
        setConnectionStatus('CONNECTING');

        if (!mounted) {
          setConnectionStatus('DISCONNECTED');
          return;
        }

        // НЕ вызываем auth.getUser() на клиенте!
        // Полностью доверяем данным из серверного пропса
        const userPresence: UserPresence = {
          user_id: userId,
          name: userName || userEmail?.split('@')[0] || `User ${userId.slice(0, 8)}`,
          email: userEmail || "",
          color: myColor,
          online_at: new Date().toISOString(),
          route: pathname,
        };

        setCurrentUser(userPresence);

        const channelName = `project:${projectId}`;

        const newChannel = supabase.channel(channelName, {
          config: {
            presence: {
              key: userId,
            },
          },
        });

        newChannel
          .on("presence", { event: "sync" }, () => {
            if (!mounted) return;
            const state = newChannel.presenceState();
            setPresenceState((prev) => {
              const newState = state as unknown as PresenceState;
              if (JSON.stringify(prev) === JSON.stringify(newState)) return prev;
              return newState;
            });
          })
          .on("presence", { event: "join" }, ({ key }) => {
            if (!mounted) return;
          })
          .on("presence", { event: "leave" }, ({ key }) => {
            if (!mounted) return;
          })
          .on("broadcast", { event: "cursor-pos" }, ({ payload }) => {
            if (!mounted || !payload || !payload.user_id) return;
            if (payload.user_id === userId) return;

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
                    route: payload.route,
                  })),
                };
              }
              
              return prev;
            });
          })
          .subscribe(async (status) => {
            if (!mounted) return;

            if (status === "SUBSCRIBED") {
              await newChannel.track(userPresence);
              setIsConnected(true);
              setConnectionStatus('SUBSCRIBED');
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setIsConnected(false);
              setConnectionStatus('ERROR');
            } else if (status === "CLOSED") {
              setIsConnected(false);
              setConnectionStatus('DISCONNECTED');
            }
          });

        channelRef.current = newChannel;
      } catch {
        setConnectionStatus('ERROR');
        setIsConnected(false);
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
      setConnectionStatus('DISCONNECTED');
    };
  }, [projectId, userId, myColor, pathname, userName, userEmail, supabase]);

  // Derive computed values
  const otherUsers = useMemo(() => 
    Object.values(presenceState)
      .flat()
      .filter((user) => user.user_id !== currentUser?.user_id),
    [presenceState, currentUser]
  );

  // Only show cursors for users on the SAME ROUTE
  const usersOnSameRoute = useMemo(() => {
    return otherUsers.filter((user) => user.route === pathname);
  }, [otherUsers, pathname]);

  // Track how many users are on each route
  const routeActivity: Record<string, number> = useMemo(() => {
    const activity: Record<string, number> = {};
    
    otherUsers.forEach((user) => {
      if (user.route) {
        activity[user.route] = (activity[user.route] || 0) + 1;
      }
    });

    return activity;
  }, [otherUsers]);

  // Handle mouse move for cursor tracking (global viewport coordinates)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Only track mouse if connected
    if (connectionStatus !== 'SUBSCRIBED') return;
    
    // Use viewport coordinates directly for fixed positioning
    broadcastCursor(e.clientX, e.clientY);
  }, [broadcastCursor, connectionStatus]);

  // Attach global mouse move listener
  useEffect(() => {
    if (connectionStatus === 'SUBSCRIBED') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove, connectionStatus]);

  const contextValue: GlobalPresenceContextValue = {
    presenceState,
    currentUser,
    otherUsers,
    usersOnSameRoute,
    routeActivity,
    isConnected,
    broadcastCursor,
    updatePresence,
  };

  return (
    <GlobalPresenceContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative min-h-screen">
        {children}
      </div>
    </GlobalPresenceContext.Provider>
  );
}

// Custom hook to access presence context
export function useGlobalPresence() {
  const context = useContext(GlobalPresenceContext);
  if (!context) {
    throw new Error("useGlobalPresence must be used within GlobalPresenceProvider");
  }
  return context;
}
