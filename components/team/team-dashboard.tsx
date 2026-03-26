"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Crown, Users, UserPlus, Settings, LogOut, Loader2,
  Zap, Clock, BarChart3, MessageSquare, Database,
  Package, Layers,
} from "lucide-react";
import type { Team, TeamMemberWithProfile, TeamRole } from "@/lib/types/database";
import {
  inviteTeamMember, updateMemberRole, removeTeamMember,
  updateTeam, cancelTeamInvitation, leaveTeam, deleteTeam,
} from "@/app/dashboard/team/actions";
import { TeamReports } from "@/components/team/team-reports";
import { TeamChat } from "@/components/team/team-chat";
import { TeamDataManagement } from "@/components/team/team-data-management";
import { TeamMemberList } from "@/components/team/TeamMemberList";
import { TeamInviteDialog } from "@/components/team/TeamInviteDialog";
import { TeamSettingsDialog } from "@/components/team/TeamSettingsDialog";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CatalogItemData {
  id: string; name: string; category_id: string | null;
  unit: string; base_material_price: number; base_labor_price: number;
  visibility: string; user_id: string; created_at: string;
  creator: { full_name: string | null; email: string } | null;
}

interface AssemblyData {
  id: string; name: string; description: string | null;
  visibility: string; user_id: string; created_at: string;
  creator: { full_name: string | null; email: string } | null;
  item_count: number;
}

interface TeamDashboardProps {
  team: Team;
  members: TeamMemberWithProfile[];
  currentUserId: string;
  teamCatalogItems?: CatalogItemData[];
  teamAssemblies?: AssemblyData[];
  outgoingInvitations?: { id: string; email: string; role: string; status: string; created_at: string }[];
}

export function TeamDashboard({
  team, members, currentUserId,
  teamCatalogItems = [], teamAssemblies = [], outgoingInvitations = [],
}: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [processingMember, setProcessingMember] = useState<string | null>(null);
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState(team.name);
  const [settingsDescription, setSettingsDescription] = useState(team.description || "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<string | null>(null);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [showLeaveTeamConfirm, setShowLeaveTeamConfirm] = useState(false);
  const router = useRouter();

  const isOwner = team.owner_id === currentUserId;
  const currentMember = members.find(m => m.user_id === currentUserId);
  const isAdmin = isOwner || currentMember?.role === "admin";
  const isManager = isAdmin || currentMember?.role === "kierownik";
  const activeMembers = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status === "pending");
  const totalSharedItems = teamCatalogItems.length + teamAssemblies.length;

  const ROLE_GRADIENT: Record<TeamRole, string> = {
    admin: "from-amber-400 to-orange-500",
    kierownik: "from-blue-400 to-indigo-500",
    elektryk: "from-emerald-400 to-teal-500",
  };

  function getMemberRole(member: TeamMemberWithProfile): TeamRole {
    if (team.owner_id === member.user_id) return "admin";
    return member.role;
  }
  function getMemberName(member: TeamMemberWithProfile): string {
    if (member.profiles?.full_name) return member.profiles.full_name;
    if (member.profiles?.email) return member.profiles.email;
    return "Użytkownik";
  }
  function getMemberInitials(member: TeamMemberWithProfile): string {
    const name = getMemberName(member);
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Podaj email"); return; }
    setInviting(true);
    try {
      const result = await inviteTeamMember(team.id, inviteEmail, "admin");
      if (result.error) { toast.error(result.error); }
      else { toast.success("Zaproszenie wysłane!"); setInviteOpen(false); setInviteEmail(""); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setInviting(false); }
  };

  const handleRemove = (memberId: string) => {
    setPendingRemoveMemberId(memberId);
  };

  const executeRemove = async () => {
    if (!pendingRemoveMemberId) return;
    const memberId = pendingRemoveMemberId;
    setPendingRemoveMemberId(null);
    setProcessingMember(memberId);
    try {
      const result = await removeTeamMember(team.id, memberId);
      if (result.error) { toast.error(result.error); } else { toast.success("Członek usunięty"); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setProcessingMember(null); }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancelingInvite(inviteId);
    try {
      const result = await cancelTeamInvitation(inviteId);
      if (result.error) { toast.error(result.error); } else { toast.success("Zaproszenie anulowane"); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setCancelingInvite(null); }
  };

  const handleSaveSettings = async () => {
    if (!settingsName.trim()) { toast.error("Nazwa zespołu jest wymagana"); return; }
    setSavingSettings(true);
    try {
      const result = await updateTeam(team.id, { name: settingsName.trim(), description: settingsDescription.trim() || undefined });
      if (result.error) { toast.error(result.error); }
      else { toast.success("Ustawienia zapisane!"); setSettingsOpen(false); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setSavingSettings(false); }
  };

  const handleDeleteTeam = () => {
    setShowDeleteTeamConfirm(true);
  };

  const executeDeleteTeam = async () => {
    setShowDeleteTeamConfirm(false);
    setDeletingTeam(true);
    try {
      const result = await deleteTeam(team.id);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Zespół został usunięty"); setSettingsOpen(false); router.push("/dashboard/team"); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setDeletingTeam(false); }
  };

  const handleLeaveTeam = () => {
    setShowLeaveTeamConfirm(true);
  };

  const executeLeaveTeam = async () => {
    setShowLeaveTeamConfirm(false);
    setLeaving(true);
    try {
      const result = await leaveTeam(team.id);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Opuściłeś zespół"); router.push("/dashboard/team"); router.refresh(); }
    } catch { toast.error("Wystąpił błąd"); } finally { setLeaving(false); }
  };

  const handleCopyTeamId = () => {
    navigator.clipboard.writeText(team.id);
    setCopiedId(true);
    toast.success("ID zespołu skopiowane");
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 border-emerald-200/70 dark:border-emerald-800/50">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.07]">
          <Users className="w-full h-full" />
        </div>
        <div className="relative p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600">
                {isOwner ? <Crown className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight truncate">{team.name}</h2>
                  <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30">
                    {isOwner ? "Właściciel" : "Członek"}
                  </Badge>
                </div>
                {team.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{team.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{activeMembers.length} członków</span>
                  {pendingMembers.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="w-3 h-3 inline-block"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
                      {pendingMembers.length} oczekuje
                    </span>
                  )}
                  {outgoingInvitations.length > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <UserPlus className="w-3 h-3" />{outgoingInvitations.length} wysłanych
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isManager && (
                <Button size="sm" onClick={() => setInviteOpen(true)}
                  className="h-8 text-xs shadow-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />Zaproś
                </Button>
              )}
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="h-8 text-xs">
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isOwner && (
                <Button size="sm" variant="outline" onClick={handleLeaveTeam} disabled={leaving}
                  title="Opuść zespół"
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800">
                  {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 border-blue-200/50 dark:border-blue-800/40 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Panel zespołu</p>
              <p className="text-xs text-blue-700/70 dark:text-blue-300/70 truncate">
                {activeMembers.length} aktywnych / {teamCatalogItems.length} pozycji w katalogu / {teamAssemblies.length} zestawów
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30">
            <Clock className="w-3 h-3 mr-1" />
            Utworzono {new Date(team.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
          </Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "members", icon: Users, label: "Członków", value: activeMembers.length, gradient: "blue" },
          { key: "chat", icon: MessageSquare, label: "Komunikacja", value: "Czat", gradient: "violet" },
          { key: "resources", icon: Database, label: "Zasobów", value: totalSharedItems, gradient: "emerald" },
          { key: "reports", icon: BarChart3, label: "Raporty", value: "Dane", gradient: "orange" },
        ].map(({ key, icon: Icon, label, value, gradient }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`group relative overflow-hidden rounded-xl p-3 sm:p-4 text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 ${
              activeTab === key
                ? `bg-gradient-to-br from-${gradient}-500 to-${gradient}-600 text-white border-${gradient}-600 shadow-lg shadow-${gradient}-500/25`
                : `bg-gradient-to-br from-${gradient}-50 to-${gradient}-100 dark:from-${gradient}-950/50 dark:to-${gradient}-900/30 border-${gradient}-200 dark:border-${gradient}-800 hover:border-${gradient}-400`
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.12] -mr-3 -mt-3">
              <Icon className="w-full h-full" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === key ? "bg-white/20" : `bg-${gradient}-500/10`}`}>
                <Icon className={`w-4 h-4 ${activeTab === key ? "text-white" : `text-${gradient}-600 dark:text-${gradient}-400`}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${activeTab !== key ? `text-${gradient}-700 dark:text-${gradient}-300` : ""}`}>{value}</div>
            <div className={`text-[11px] font-semibold ${activeTab === key ? `text-${gradient}-100` : `text-${gradient}-600/70 dark:text-${gradient}-400/70`}`}>{label}</div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-11 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-1">
          <TabsTrigger value="members" className="text-xs sm:text-sm gap-1.5 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Users className="w-3.5 h-3.5 hidden sm:block" />Członkowie
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs sm:text-sm gap-1.5 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <MessageSquare className="w-3.5 h-3.5 hidden sm:block" />Czat
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs sm:text-sm gap-1.5 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Database className="w-3.5 h-3.5 hidden sm:block" />Zasoby
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm gap-1.5 font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <BarChart3 className="w-3.5 h-3.5 hidden sm:block" />Raporty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-0 space-y-4">
          <TeamMemberList
            team={team}
            members={members}
            currentUserId={currentUserId}
            outgoingInvitations={outgoingInvitations}
            isAdmin={isAdmin ?? false}
            isManager={isManager ?? false}
            processingMember={processingMember}
            cancelingInvite={cancelingInvite}
            onInviteOpen={() => setInviteOpen(true)}
            onRemove={handleRemove}
            onCancelInvite={handleCancelInvite}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <TeamChat teamId={team.id} currentUserId={currentUserId} teamName={team.name} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          {isManager ? (
            <TeamDataManagement
              teamId={team.id}
              isAdmin={isAdmin ?? false}
              initialCatalogItems={teamCatalogItems}
              initialAssemblies={teamAssemblies}
            />
          ) : (
            <Card className="p-8 text-center">
              <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Wspólne zasoby zespołu są dostępne dla kierowników i administratorów.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <TeamReports teamId={team.id} members={activeMembers} />
        </TabsContent>
      </Tabs>

      {/* Bottom info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Katalog</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Udostępnij pozycje w Katalogu zmieniając widoczność na &quot;Zespół&quot;, a pojawią się tutaj dla wszystkich.
          </p>
          <div className="mt-2.5">
            <Badge variant="outline" className="text-[10px]">
              <Package className="w-2.5 h-2.5 mr-1" />{teamCatalogItems.length} pozycji udostępnionych
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zespół</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeMembers.length === 1
              ? "W zespole jest 1 osoba. Zaproś współpracowników, żeby zacząć współpracę!"
              : `${activeMembers.length} osób w zespole. Używajcie czatu i wspólnego katalogu.`
            }
          </p>
          <div className="mt-2.5 flex gap-1.5">
            {activeMembers.slice(0, 5).map((m) => (
              <div key={m.id}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-br ${ROLE_GRADIENT[getMemberRole(m)]}`}
                title={getMemberName(m)}>
                {getMemberInitials(m).charAt(0)}
              </div>
            ))}
            {activeMembers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{activeMembers.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zestawy</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Zestawy to gotowe grupy materiałów. Udostępnij je zespołowi, by przyspieszyć kosztorysowanie.
          </p>
          <div className="mt-2.5">
            <Badge variant="outline" className="text-[10px]">
              <Layers className="w-2.5 h-2.5 mr-1" />{teamAssemblies.length} zestawów udostępnionych
            </Badge>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TeamInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        inviteEmail={inviteEmail}
        inviting={inviting}
        cancelingInvite={cancelingInvite}
        outgoingInvitations={outgoingInvitations}
        setInviteEmail={setInviteEmail}
        onInvite={handleInvite}
        onCancelInvite={handleCancelInvite}
      />

      <TeamSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        team={team}
        settingsName={settingsName}
        settingsDescription={settingsDescription}
        savingSettings={savingSettings}
        deletingTeam={deletingTeam}
        copiedId={copiedId}
        isOwner={isOwner}
        setSettingsName={setSettingsName}
        setSettingsDescription={setSettingsDescription}
        onSave={handleSaveSettings}
        onDelete={handleDeleteTeam}
        onCopyTeamId={handleCopyTeamId}
      />
      <AlertDialog open={!!pendingRemoveMemberId} onOpenChange={(open) => !open && setPendingRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń członka</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć tego członka z zespółu?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeRemove} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteTeamConfirm} onOpenChange={setShowDeleteTeamConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń zespół</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć zespół? Tej operacji nie można cofnąć!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteTeam} className="bg-red-600 hover:bg-red-700 text-white">Usuń zespół</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showLeaveTeamConfirm} onOpenChange={setShowLeaveTeamConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opuść zespół</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz opuścić zespół?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeLeaveTeam} className="bg-red-600 hover:bg-red-700 text-white">Opuść</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
