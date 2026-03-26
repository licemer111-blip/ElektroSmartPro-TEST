"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
import { Bell, Check, X, Briefcase, Users, CheckCircle, AlertTriangle, Info, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getPendingInvitations,
  acceptProjectInvitation,
  declineProjectInvitation,
} from "@/app/dashboard/projects/[id]/members-actions";
import {
  getPendingTeamInvitations,
  acceptTeamInvitation,
  declineTeamInvitation,
} from "@/app/dashboard/team/actions";

interface PendingInvitation {
  id: string;
  role: string;
  invited_at: string;
  projects: {
    id: string;
    name: string;
  };
  profiles: {
    company_name: string | null;
    email: string;
  };
}

interface TeamInvitation {
  id: string;
  role: string;
  status: string;
  created_at: string;
  teams: {
    id?: string;
    name: string;
  };
  inviter?: {
    full_name: string | null;
    email: string;
  };
}

interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

function getNotifIcon(type: string) {
  switch (type) {
    case "success": return <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />;
    case "error": return <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />;
    default: return <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  const days = Math.floor(hrs / 24);
  return `${days}d temu`;
}

export function PendingInvitationsDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [projectInvitations, setProjectInvitations] = useState<PendingInvitation[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadInvitations = async () => {
    setLoading(true);
    const [projects, teams] = await Promise.all([
      getPendingInvitations() as unknown as Promise<PendingInvitation[]>,
      getPendingTeamInvitations() as unknown as Promise<TeamInvitation[]>,
    ]);
    setProjectInvitations(projects);
    setTeamInvitations(teams);
    setLoading(false);
  };

  const loadNotifications = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markNotifRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotifsRead = async () => {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    loadInvitations();
    loadNotifications();
    // Refresh every 5 minutes — Realtime subscription handles instant notification updates
    const interval = setInterval(() => { loadInvitations(); loadNotifications(); }, 5 * 60 * 1000);

    // Realtime subscription for new notifications (filtered by user_id)
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`bell-notifications-${userId}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          const n = payload.new as AppNotification;
          setNotifications(prev => [n, ...prev]);
        })
        .subscribe();
    });

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (invitationId: string) => {
    try {
      const result = await acceptProjectInvitation(invitationId);

      if (result.success) {
        toast.success("✅ Zaproszenie zaakceptowane!");
        setOpen(false);
        // Use Next.js router for soft navigation
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error || "Błąд podczas akceptowania");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error("Nieoczekiwany błąd: " + message);
    }
  };

  const handleDecline = async (invitationId: string) => {
    const result = await declineProjectInvitation(invitationId);

    if (result.success) {
      toast.success("Zaproszenie odrzucone");
      loadInvitations();
      // ⚡ AUTO-REFRESH: Update UI
      router.refresh();
    } else {
      toast.error(result.error || "Błąd podczas odrzucania");
    }
  };

  const handleAcceptTeam = async (invitationId: string) => {
    try {
      const result = await acceptTeamInvitation(invitationId);

      if (result.success) {
        toast.success("✅ Dołączyłeś do zespołu!");
        setOpen(false);
        router.push("/dashboard/team");
        router.refresh();
      } else {
        toast.error(result.error || "Błąd podczas akceptowania");
      }
    } catch (error: unknown) {
      toast.error("Nieoczekiwany błąd: " + (error instanceof Error ? error.message : "Nieznany błąd"));
    }
  };

  const handleDeclineTeam = async (invitationId: string) => {
    const result = await declineTeamInvitation(invitationId);

    if (result.success) {
      toast.success("Zaproszenie odrzucone");
      loadInvitations();
      router.refresh();
    } else {
      toast.error(result.error || "Błąd podczas odrzucania");
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "editor":
        return "Edytor";
      case "viewer":
        return "Widz";
      default:
        return role;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Zaproszenia"
        >
          <Bell className="h-5 w-5" />
          {(projectInvitations.length + teamInvitations.length + notifications.filter(n => !n.read).length) > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {projectInvitations.length + teamInvitations.length + notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Powiadomienia
          </span>
          {notifications.filter(n => !n.read).length > 0 && (
            <button onClick={markAllNotifsRead} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">
              Przeczytaj wszystkie
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading && notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Ładowanie...
          </div>
        ) : projectInvitations.length === 0 && teamInvitations.length === 0 && notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Brak powiadomień
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {/* Team Invitations */}
            {teamInvitations.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                  Zespoły ({teamInvitations.length})
                </div>
                {teamInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-3 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {invitation.teams?.name || "Zespół"}
                        </p>
                        {invitation.inviter && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            od: {invitation.inviter.full_name || invitation.inviter.email}
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs"
                        >
                          {invitation.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptTeam(invitation.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Akceptuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineTeam(invitation.id)}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Project Invitations */}
            {projectInvitations.length > 0 && (
              <>
                {teamInvitations.length > 0 && <DropdownMenuSeparator />}
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                  Projekty ({projectInvitations.length})
                </div>
                {projectInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-3 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {invitation.projects?.name || "Projekt"}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          od: {invitation.profiles?.company_name || invitation.profiles?.email}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs"
                        >
                          {getRoleLabel(invitation.role)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(invitation.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Akceptuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(invitation.id)}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* App Notifications (offers accepted/rejected, etc.) */}
            {notifications.length > 0 && (
              <>
                {(teamInvitations.length > 0 || projectInvitations.length > 0) && <DropdownMenuSeparator />}
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                  Oferty i zdarzenia ({notifications.length})
                </div>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors ${!notif.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                    onClick={() => {
                      markNotifRead(notif.id);
                      setOpen(false);
                      if (notif.action_url) {
                        if (pathname === notif.action_url) {
                          router.refresh();
                        } else {
                          router.push(notif.action_url);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm truncate ${!notif.read ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                            {notif.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400">{timeAgo(notif.created_at)}</span>
                          {notif.action_url && notif.action_label && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" />
                              {notif.action_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
