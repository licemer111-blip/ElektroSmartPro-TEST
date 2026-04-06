import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { TeamDashboard } from "@/components/team/team-dashboard";
import { CreateTeamCard } from "@/components/team/create-team-card";
import {
  getAllUserTeams,
  getTeamMembers,
  getTeamCatalogItems,
  getTeamAssemblies,
  getTeamOutgoingInvitations,
  getPendingTeamInvitations,
} from "./actions";
import { PendingInvitations, type PendingInvitation } from "@/components/team/pending-invitations";
import { Loader2 } from "lucide-react";
import { requireMinProjects } from "@/lib/guards/feature-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zespół — Współpraca",
  description: "Zarządzaj zespołem elektryków — zaproszenia, role, wspólne katalogi i projekty. Pracujcie razem w czasie rzeczywistym z Live Chat",
};

export default async function TeamPage() {
  await requireMinProjects();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [allTeams, pendingInvitations] = await Promise.all([
    getAllUserTeams(),
    getPendingTeamInvitations(),
  ]);

  // Fetch data for all teams
  const teamsWithData = await Promise.all(
    allTeams.map(async (team) => {
      const [members, catalogResult, assembliesResult, invitations] = await Promise.all([
        getTeamMembers(team.id),
        getTeamCatalogItems(team.id),
        getTeamAssemblies(team.id),
        getTeamOutgoingInvitations(team.id),
      ]);

      return {
        team,
        members,
        teamCatalogItems: catalogResult.items || [],
        teamAssemblies: assembliesResult.assemblies || [],
        outgoingInvitations: invitations,
      };
    })
  );

  return (
    <PageContainer>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Ładowanie zespołu...</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Incoming invitations banner at the top */}
          <PendingInvitations invitations={pendingInvitations as PendingInvitation[]} />

          {teamsWithData.length > 0 ? (
            teamsWithData.map(({ team, members, teamCatalogItems, teamAssemblies, outgoingInvitations }) => (
              <TeamDashboard
                key={team.id}
                team={team}
                members={members}
                currentUserId={user.id}
                teamCatalogItems={teamCatalogItems}
                teamAssemblies={teamAssemblies}
                outgoingInvitations={outgoingInvitations}
              />
            ))
          ) : (
            <CreateTeamCard />
          )}
        </div>
      </Suspense>
    </PageContainer>
  );
}
