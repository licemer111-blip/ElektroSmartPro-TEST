"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Team, TeamMember } from "@/lib/types/database";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ─── Read: get user's primary team ───────────────────────────────────────────

export async function getUserTeam(): Promise<Team | null> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return null;

    const { data: ownedTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (ownedTeam) return ownedTeam;

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership?.teams) return membership.teams as unknown as Team;

    return null;
  } catch (error) {
    logger.error("[getUserTeam] Error getting user team", {}, error);
    return null;
  }
}

// ─── Read: all teams for user ─────────────────────────────────────────────────

export async function getAllUserTeams(): Promise<Team[]> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return [];

    const ownedTeams: Team[] = [];
    const memberTeams: Team[] = [];
    const ownedTeamIds = new Set<string>();

    const { data: ownedTeamsData, error: ownedError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id);

    if (ownedError) logger.error("Owned teams error", {}, ownedError);

    if (ownedTeamsData) {
      ownedTeamsData.forEach((team) => {
        ownedTeams.push(team);
        ownedTeamIds.add(team.id);
      });
    }

    const { data: memberships, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (memberError) logger.error("Memberships error", {}, memberError);

    if (memberships) {
      memberships.forEach((membership: { team_id: string; teams: unknown }) => {
        const team = membership.teams as Team | null;
        if (team && !ownedTeamIds.has(team.id)) memberTeams.push(team);
      });
    }

    return [...memberTeams, ...ownedTeams];
  } catch (error) {
    logger.error("[getAllUserTeams] Error", {}, error);
    return [];
  }
}

// ─── Read: team members list ──────────────────────────────────────────────────

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error getting team members", { teamId }, error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const userIds = data.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);

    return data.map((member) => ({
      ...member,
      profiles: profiles?.find((p) => p.id === member.user_id) || null,
    })) as TeamMember[];
  } catch (error) {
    logger.error("Error getting team members", { teamId }, error);
    return [];
  }
}

// ─── Mutate: create team ──────────────────────────────────────────────────────

export async function createTeam(name: string, description?: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (existingTeam) return { error: "Możesz mieć tylko jeden zespół" };

  const { data, error } = await supabase
    .from("teams")
    .insert({ name: name.trim(), description: description?.trim() || null, owner_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error("Error creating team", { name }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true, team: data };
}

// ─── Mutate: update team settings (owner only) ───────────────────────────────

export async function updateTeam(teamId: string, data: { name?: string; description?: string }) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { error } = await supabase
    .from("teams")
    .update(data)
    .eq("id", teamId)
    .eq("owner_id", user.id);

  if (error) {
    logger.error("Error updating team", { teamId }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Mutate: delete team (owner only) ────────────────────────────────────────

export async function deleteTeam(teamId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (!team) return { error: "Zespół nie istnieje" };
  if (team.owner_id !== user.id) return { error: "Tylko właściciel może usunąć zespół" };

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Read: team shared catalog items ─────────────────────────────────────────

export async function getTeamCatalogItems(teamId: string) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { items: [] };

    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, name, category_id, unit, base_material_price, base_labor_price, visibility, user_id, team_id, created_at")
      .eq("team_id", teamId)
      .eq("visibility", "team")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Team catalog items query error", { teamId }, error);
      return { items: [], error: error.message };
    }

    if (!data || data.length === 0) return { items: [] };

    const userIds = [...new Set(data.map((item) => item.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    return {
      items: data.map((item) => ({
        ...item,
        creator: profiles?.find((p) => p.id === item.user_id) || null,
      })),
    };
  } catch {
    return { items: [] };
  }
}

// ─── Read: team shared assemblies ─────────────────────────────────────────────

export async function getTeamAssemblies(teamId: string) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { assemblies: [] };

    const { data, error } = await supabase
      .from("user_assemblies")
      .select("id, name, description, visibility, user_id, team_id, created_at")
      .eq("team_id", teamId)
      .eq("visibility", "team")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Team assemblies query error", { teamId }, error);
      return { assemblies: [], error: error.message };
    }

    if (!data || data.length === 0) return { assemblies: [] };

    const userIds = [...new Set(data.map((a) => a.user_id))];
    const assemblyIds = data.map((a) => a.id);

    const [profilesResult, itemsResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", userIds),
      supabase.from("user_assembly_items").select("assembly_id").in("assembly_id", assemblyIds),
    ]);

    const profiles = profilesResult.data || [];
    const items = itemsResult.data || [];

    const itemCounts: Record<string, number> = {};
    items.forEach((item) => {
      itemCounts[item.assembly_id] = (itemCounts[item.assembly_id] || 0) + 1;
    });

    return {
      assemblies: data.map((assembly) => ({
        ...assembly,
        creator: profiles.find((p) => p.id === assembly.user_id) || null,
        item_count: itemCounts[assembly.id] || 0,
      })),
    };
  } catch {
    return { assemblies: [] };
  }
}

// ─── Mutate: remove item from team ───────────────────────────────────────────

export async function removeItemFromTeam(itemId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { error } = await supabase
    .from("catalog_items")
    .update({ visibility: "personal", team_id: null })
    .eq("id", itemId);

  if (error) {
    logger.error("Error removing item from team", { itemId }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/catalog");
  return { success: true };
}

// ─── Mutate: remove assembly from team ───────────────────────────────────────

export async function removeAssemblyFromTeam(assemblyId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { error } = await supabase
    .from("user_assemblies")
    .update({ visibility: "personal", team_id: null })
    .eq("id", assemblyId);

  if (error) {
    logger.error("Error removing assembly from team", { assemblyId }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/assemblies");
  return { success: true };
}

// ─── Read: team data stats ────────────────────────────────────────────────────

export async function getTeamDataStats(teamId: string) {
  const supabase = await createClient();

  const [catalogResult, assembliesResult] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("visibility", "team"),
    supabase
      .from("user_assemblies")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("visibility", "team"),
  ]);

  return {
    catalogCount: catalogResult.count || 0,
    assembliesCount: assembliesResult.count || 0,
  };
}

