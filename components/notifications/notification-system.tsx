"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, ExternalLink, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isOffline: boolean;
  addNotification: (notification: Omit<Notification, "id" | "user_id" | "created_at" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const FETCH_RETRY_DELAYS = [1_000, 2_000] as const;

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
  userId: string;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupRealtime();
    
    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const fetchNotifications = async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= FETCH_RETRY_DELAYS.length; attempt++) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        setNotifications(data ?? []);
        setIsOffline(false);
        return;
      } catch (err) {
        lastError = err;
      }

      if (attempt < FETCH_RETRY_DELAYS.length) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, FETCH_RETRY_DELAYS[attempt])
        );
      }
    }

    console.error("[Notifications] Failed after retries:", lastError);
    setIsOffline(true);
  };

  const setupRealtime = () => {
    const supabase = createClient();

    const notificationChannel = supabase
      .channel(`user:${userId}:notifications`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show browser notification if permitted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/icon.png",
              tag: newNotification.id,
            });
          }
        }
      )
      .subscribe();

    setChannel(notificationChannel);
  };

  const addNotification = async (notification: Omit<Notification, "id" | "user_id" | "created_at" | "read">) => {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      ...notification,
    });

    if (error) {
      // ignore notification insert error
    }
  };

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const deleteNotification = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOffline,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationBell() {
  const ctx = useNotifications();
  const router = useRouter();

  if (!ctx) return null;
  const { notifications, unreadCount, isOffline, markAsRead, markAllAsRead, deleteNotification } = ctx;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className={cn("h-4 w-4", isOffline && "text-slate-400")} />
          {isOffline ? (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-400">
              <WifiOff className="h-2 w-2 text-white" />
            </span>
          ) : unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {isOffline ? (
            <div className="p-4 text-center text-muted-foreground">
              <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Tryb offline</p>
              <p className="text-xs mt-1">Brak połączenia z serwerem</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-4 cursor-pointer",
                  !notification.read && "bg-muted/50"
                )}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.action_url) {
                    router.push(notification.action_url);
                  }
                }}
              >
                <div className="flex w-full items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        {notification.action_url && notification.action_label && (
                          <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                            <ExternalLink className="h-2.5 w-2.5" />
                            {notification.action_label}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for easy notification creation
export function useNotify() {
  const ctx = useNotifications();
  const add = ctx?.addNotification;

  const notify = {
    info: (title: string, message: string, data?: Record<string, unknown>) =>
      add?.({ type: "info", title, message, data }),
    success: (title: string, message: string, data?: Record<string, unknown>) =>
      add?.({ type: "success", title, message, data }),
    warning: (title: string, message: string, data?: Record<string, unknown>) =>
      add?.({ type: "warning", title, message, data }),
    error: (title: string, message: string, data?: Record<string, unknown>) =>
      add?.({ type: "error", title, message, data }),
  };

  return notify;
}
