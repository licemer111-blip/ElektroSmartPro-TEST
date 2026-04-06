"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { teamInviteSchema, validate } from "@/lib/validations";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ─── Read: pending invitations for current user ───────────────────────────────

export async function getPendingTeamInvitations() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase || !user.email) return [];

    const { error: tableError } = await supabase
      .from("team_invitations")
      .select("id")
      .limit(1);

    if (tableError) return [];

    const { data, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("email", user.email.toLowerCase())
      .eq("status", "pending");

    if (error) return [];

    if (data && data.length > 0) {
      const teamIds = data.map((inv) => inv.team_id);
      const inviterIds = data.map((inv) => inv.invited_by);

      const [teamsResult, profilesResult] = await Promise.all([
        supabase.from("teams").select("id, name").in("id", teamIds),
        supabase.from("profiles").select("id, full_name, email").in("id", inviterIds),
      ]);

      if (teamsResult.error) logger.error("Error fetching teams for invitations", {}, teamsResult.error);
      if (profilesResult.error) logger.error("Error fetching profiles for invitations", {}, profilesResult.error);

      return data.map((inv) => {
        const team = teamsResult.data?.find((t) => t.id === inv.team_id);
        const inviter = profilesResult.data?.find((p) => p.id === inv.invited_by);
        return {
          ...inv,
          teams: team || { name: "Nieznany zespół" },
          inviter: inviter || { full_name: null, email: "Nieznany użytkownik" },
        };
      });
    }

    return [];
  } catch {
    return [];
  }
}

// ─── Read: outgoing invitations for a team ────────────────────────────────────

export async function getTeamOutgoingInvitations(teamId: string) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return [];

    const { data, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching team invitations", { teamId }, error);
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error("getTeamOutgoingInvitations catch", { teamId }, err);
    return [];
  }
}

// ─── Invite a new member ──────────────────────────────────────────────────────

export async function inviteTeamMember(
  teamId: string,
  email: string,
  role: string = "elektryk"
) {
  const { error: validationError } = validate(teamInviteSchema, { email, role });
  if (validationError) return { error: validationError };

  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .single();

  if (existingInvite) return { error: "Zaproszenie już zostało wysłane" };

  const { data, error } = await supabase
    .from("team_invitations")
    .insert({
      team_id: teamId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error inviting member", { teamId, email, role, code: error.code }, error);
    return { error: `Błąd: ${error.message}` };
  }

  revalidatePath("/dashboard/team");
  return { success: true, invitation: data };
}

// ─── Accept invitation ────────────────────────────────────────────────────────

export async function acceptTeamInvitation(invitationId: string) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      logger.error("Auth error in acceptTeamInvitation: No user", { invitationId });
      return { error: "Sesja wygasła. Zaloguj się ponownie." };
    }

    const { data: invitation, error: invError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      logger.error("Invitation fetch error", { invitationId }, invError);
      return { error: `Zaproszenie nie istnieje lub zostało już przetworzone. (ID: ${invitationId.substring(0, 8)})` };
    }

    if (invitation.status !== "pending") {
      return { error: `To zaproszenie ma status: ${invitation.status}` };
    }

    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", invitation.team_id)
      .eq("user_id", user.id)
      .single();

    if (!existingMember) {
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
        status: "active",
      });

      if (memberError) {
        logger.error("Error adding team member (DB)", { invitationId, teamId: invitation.team_id }, memberError);
        if (memberError.code === "42501") {
          return { error: "Błąd uprawnień RLS przy dodawaniu do zespołu." };
        }
        if (memberError.code !== "23505") {
          return { error: `Błąd bazy danych: ${memberError.message}` };
        }
      }
    }

    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (updateError) {
      logger.warn("User was added to team, but invitation status update failed", { invitationId });
    }

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (err: unknown) {
    logger.error("CRITICAL ERROR in acceptTeamInvitation", { invitationId }, err);
    return { error: `Nieoczekiwany błąd: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

// ─── Decline invitation ───────────────────────────────────────────────────────

export async function declineTeamInvitation(invitationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Cancel invitation (team manager) ────────────────────────────────────────

export async function cancelTeamInvitation(invitationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    logger.error("Error canceling invitation", { invitationId }, error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Backward-compat aliases ──────────────────────────────────────────────────

export const acceptInvitation = acceptTeamInvitation;
export const declineInvitation = declineTeamInvitation;
