"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Shield, Wrench, Loader2, Trash2, UserPlus, Mail } from "lucide-react";
import type { Team, TeamMemberWithProfile, TeamRole } from "@/lib/types/database";
import { TEAM_ROLE_LABELS } from "@/app/dashboard/team/constants";

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  admin:     <Crown className="w-3.5 h-3.5 text-amber-500" />,
  kierownik: <Shield className="w-3.5 h-3.5 text-blue-500" />,
  elektryk:  <Wrench className="w-3.5 h-3.5 text-emerald-500" />,
};

const ROLE_GRADIENT: Record<TeamRole, string> = {
  admin:     "from-amber-400 to-orange-500",
  kierownik: "from-blue-400 to-indigo-500",
  elektryk:  "from-emerald-400 to-teal-500",
};

interface TeamMemberListProps {
  team: Team;
  members: TeamMemberWithProfile[];
  currentUserId: string;
  outgoingInvitations: { id: string; email: string; role: string; status: string; created_at: string }[];
  isAdmin: boolean;
  isManager: boolean;
  processingMember: string | null;
  cancelingInvite: string | null;
  onInviteOpen: () => void;
  onRemove: (memberId: string) => void;
  onCancelInvite: (inviteId: string) => void;
}

function getMemberName(member: TeamMemberWithProfile): string {
  if (member.profiles?.full_name) return member.profiles.full_name;
  if (member.profiles?.email) return member.profiles.email;
  return "Użytkownik";
}

function getMemberEmail(member: TeamMemberWithProfile): string {
  return member.profiles?.email || "";
}

function getMemberInitials(member: TeamMemberWithProfile): string {
  const name = getMemberName(member);
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getMemberRole(team: Team, member: TeamMemberWithProfile): TeamRole {
  if (team.owner_id === member.user_id) return "admin";
  return member.role;
}

export function TeamMemberList({
  team, members, currentUserId, outgoingInvitations,
  isAdmin, isManager, processingMember, cancelingInvite,
  onInviteOpen, onRemove, onCancelInvite,
}: TeamMemberListProps) {
  const activeMembers = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status === "pending");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeMembers.map((member) => {
          const memberRole = getMemberRole(team, member);
          const isCurrentUser = member.user_id === currentUserId;
          const isMemberOwner = team.owner_id === member.user_id;

          return (
            <div
              key={member.id}
              className={`group relative rounded-xl border p-4 transition-all hover:shadow-md ${
                isMemberOwner
                  ? "bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30"
                  : "bg-card hover:bg-accent/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md bg-gradient-to-br ${ROLE_GRADIENT[memberRole]}`}>
                    {getMemberInitials(member)}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{getMemberName(member)}</p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal">Ty</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{getMemberEmail(member)}</p>
                  </div>
                </div>

                {isAdmin && !isCurrentUser && !isMemberOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                    onClick={() => onRemove(member.id)}
                    disabled={processingMember === member.id}
                  >
                    {processingMember === member.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </Button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-medium gap-1 ${
                    isMemberOwner
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : memberRole === "admin"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        : memberRole === "kierownik"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  }`}
                >
                  {ROLE_ICONS[memberRole]}
                  {isMemberOwner ? "Właściciel" : TEAM_ROLE_LABELS[memberRole]}
                </Badge>
                {member.joined_at && (
                  <span className="text-[10px] text-muted-foreground">
                    od {new Date(member.joined_at).toLocaleDateString("pl-PL", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isManager && (
          <button
            onClick={onInviteOpen}
            className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Zaproś do zespołu</span>
          </button>
        )}
      </div>

      {isManager && (outgoingInvitations.length > 0 || pendingMembers.length > 0) && (
        <Card className="border-dashed">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              Oczekujące zaproszenia ({outgoingInvitations.length + pendingMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-2">
              {outgoingInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                      {(inv.email as string).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{inv.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Wysłano {new Date(inv.created_at).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancelInvite(inv.id)}
                    disabled={cancelingInvite === inv.id}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {cancelingInvite === inv.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : "Anuluj"
                    }
                  </Button>
                </div>
              ))}
              {pendingMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">?</div>
                    <span className="text-sm">{member.profiles?.email || "Nieznany"}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Oczekuje</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
