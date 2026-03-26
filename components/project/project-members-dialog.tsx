"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Mail, CheckCircle, Clock, XCircle, Shield, Phone, MessageCircle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import {
  getProjectMembers,
  inviteProjectMember,
  removeProjectMember,
} from "@/app/dashboard/projects/[id]/members-actions";
import type { ProjectMemberWithProfile } from "@/lib/types/database";

interface ProjectMembersDialogProps {
  projectId: string;
  isOwner: boolean;
  onCoPilotClick?: () => void;
  onLiveChatClick?: () => void;
  projectStatus?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function ProjectMembersDialog({ projectId, isOwner, onCoPilotClick, onLiveChatClick, projectStatus = "draft", externalOpen, onExternalOpenChange }: ProjectMembersDialogProps) {
  const isFinal = projectStatus === "final";
  const [open, setOpen] = useState(false);

  // Sync with external (viewer) open state
  const prevExternalOpen = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== prevExternalOpen.current) {
      prevExternalOpen.current = externalOpen;
      setOpen(externalOpen);
    }
  }, [externalOpen]);
  const [members, setMembers] = useState<ProjectMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, projectId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getProjectMembers(projectId);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      if (!inviteEmail || !inviteEmail.includes("@")) {
        sonnerToast.error("Podaj prawidłowy adres email");
        return;
      }

      setInviting(true);

      // Всегда приглашаем как "editor" - доверенное лицо может редактировать
      const result = await inviteProjectMember(projectId, inviteEmail, "editor");

      if (result.success) {
        sonnerToast.success("Zaproszenie wysłane!");
        setInviteEmail("");
        loadMembers();
        router.refresh();
      } else {
        sonnerToast.error(result.error || "Błąd podczas wysyłania zaproszenia");
      }
    } catch {
      sonnerToast.error("Nieoczekiwany błąd");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    try {
      const result = await removeProjectMember(projectId, membershipId);

      if (result.success) {
        sonnerToast.success("Członek usunięty z projektu");
        loadMembers();
        router.refresh();
      } else {
        sonnerToast.error(result.error || "Błąd podczas usuwania członka");
      }
    } catch {
      sonnerToast.error("Nieoczekiwany błąd");
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Właściciel";
      case "editor":
        return "Współpracownik";
      default:
        return "Współpracownik";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aktywny
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Oczekuje
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="text-slate-500">
            <XCircle className="w-3 h-3 mr-1" />
            Odrzucone
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v && isFinal) {
        toast({ title: "\ud83d\udd12 Projekt zablokowany", description: "Odblokuj projekt, aby zarządzać uczestnikami", variant: "destructive" });
        return;
      }
      setOpen(v);
      onExternalOpenChange?.(v);
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 rounded-md ${isFinal ? "opacity-50 cursor-not-allowed" : ""}`}>
          <Users className="h-3.5 w-3.5" />
          <span>Uczestnicy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Zarządzaj współpracownikami
          </DialogTitle>
          <DialogDescription>
            Zaproś zaufane osoby do wspólnej pracy nad projektem
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form - Only for owners */}
        {isOwner && (
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <UserPlus className="w-4 h-4" />
              <h3 className="font-semibold">Zaproś współpracownika</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email użytkownika</Label>
                <Input
                  id="invite-email"
                  name="invite-email"
                  type="email"
                  placeholder="jan.kowalski@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>

              <Button
                onClick={handleInvite}
                disabled={inviting}
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {inviting ? (
                  <>Wysyłanie...</>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Wyślij zaproszenie
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-green-700 dark:text-green-300">
              Zaproszony współpracownik będzie mógł edytować kosztorys
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Współpracownicy ({members.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Ładowanie...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Brak współpracowników. Zaproś kogoś do projektu!
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {(member.profiles as { email?: string } | null)?.email || "Nieznany"}
                      </p>
                      {member.role === "owner" && (
                        <Shield className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(member.status)}
                      <Badge variant="outline">{getRoleLabel(member.role)}</Badge>
                    </div>
                  </div>

                  {/* Remove button - Only for owner and non-owner members */}
                  {isOwner && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Co-Pilot Audio & Live Chat */}
        {(onCoPilotClick || onLiveChatClick) && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {onCoPilotClick && (
              <div>
                <Button
                  onClick={() => { setOpen(false); onCoPilotClick(); }}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Co-Pilot Audio — steruj głosem
                </Button>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">
                  Uruchom sesję głosową do sterowania projektem
                </p>
              </div>
            )}
            {onLiveChatClick && (
              <div>
                <Button
                  onClick={() => { setOpen(false); onLiveChatClick(); }}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Live Chat — napisz do zespołu
                </Button>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">
                  Komunikacja tekstowa w czasie rzeczywistym
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
