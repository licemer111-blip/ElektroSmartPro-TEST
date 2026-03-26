"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import type { Team, TeamMember, TeamRole } from "@/lib/types/database";

/**
 * Get the current user's primary team
 * Returns the team they own, or the first team they're a member of
 */
export async function getUserTeam(): Promise<Team | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // First, check if user owns a team
    const { data: ownedTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (ownedTeam) return ownedTeam;

    // Otherwise, get the first team they're a member of
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership?.teams) {
      return membership.teams as unknown as Team;
    }

    return null;
  } catch (error) {
    logger.error("Error getting user team:", {}, error);
    return null;
  }
}

/**
 * Get the user's role in their team
 */
export async function getUserTeamRole(): Promise<TeamRole | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if user is team owner
    const { data: ownedTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (ownedTeam) return "admin";

    // Get role from membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    return membership?.role as TeamRole || null;
  } catch (error) {
    logger.error("Error getting user team role:", {}, error);
    return null;
  }
}

/**
 * Check if user can manage team data (admin or kierownik)
 */
export async function canManageTeamData(): Promise<boolean> {
  const role = await getUserTeamRole();
  return role === "admin" || role === "kierownik";
}

/**
 * Check if user is in any team
 */
export async function isInTeam(): Promise<boolean> {
  const team = await getUserTeam();
  return team !== null;
}

/**
 * Get user's team info for UI display
 * Returns team data and user's permissions
 */
export async function getTeamContext(): Promise<{
  team: Team | null;
  role: TeamRole | null;
  canManageData: boolean;
  isInTeam: boolean;
}> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { team: null, role: null, canManageData: false, isInTeam: false };
    }

    // Check if user owns a team
    const { data: ownedTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (ownedTeam) {
      return {
        team: ownedTeam,
        role: "admin",
        canManageData: true,
        isInTeam: true,
      };
    }

    // Check membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("role, teams(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership?.teams) {
      const role = membership.role as TeamRole;
      return {
        team: membership.teams as unknown as Team,
        role,
        canManageData: role === "admin" || role === "kierownik",
        isInTeam: true,
      };
    }

    return { team: null, role: null, canManageData: false, isInTeam: false };
  } catch (error) {
    logger.error("Error getting team context:", {}, error);
    return { team: null, role: null, canManageData: false, isInTeam: false };
  }
}
