"use server";

import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import type { ProjectMember, ProjectMemberWithProfile } from "@/lib/types/database";

// ⚡ Helper for aggressive revalidation (for collaborative features)
function revalidateProject(projectId: string) {
  // Revalidate the specific project page
  revalidatePath(`/dashboard/projects/${projectId}`, 'page');
  // Also revalidate the dashboard (project list)
  revalidatePath('/dashboard', 'page');
}

/**
 * V4.0: Co-pilot Mode - Project Members Management
 * Server actions for inviting and managing project collaborators
 */

// Get all members of a project
export async function getProjectMembers(
  projectId: string
): Promise<ProjectMemberWithProfile[]> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return [];
    }

    // Fetch members using RPC (bypasses RLS with SECURITY DEFINER)
    const { data: members, error } = await supabase
      .rpc('get_project_members_list', { p_project_id: projectId });

    if (error) {
      logger.error("Error fetching project members:", {}, error);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Get all user IDs
    const userIds = members.map((m: { user_id: string }) => m.user_id);

    // Fetch profiles for all members
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, company_name, email")
      .in("id", userIds);

    // Combine the data
    const profileMap = new Map(
      (profiles || []).map((p: { id: string; company_name: string | null; email: string | null }) => [p.id, p])
    );

    const result = members.map((member: { user_id: string; [key: string]: unknown }) => ({
      ...member,
      profiles: profileMap.get(member.user_id) || null
    }));

    return result as ProjectMemberWithProfile[];
  } catch (error) {
    logger.error("Exception in getProjectMembers:", {}, error);
    return [];
  }
}

// Invite a user to the project by email
// Role types for project members
export type ProjectMemberRole = "viewer" | "editor" | "kierownik" | "admin" | "elektryk";

export async function inviteProjectMember(
  projectId: string,
  email: string,
  role: ProjectMemberRole = "viewer"
): Promise<{ success?: boolean; error?: string }> {
  try {

    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { error: "Musisz być zalogowany" };
    }


    // Check if user is project owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Tylko właściciel projektu może zapraszać członków" };
    }


    // Find user by email
    const { data: inviteeProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();


    if (!inviteeProfile) {
      return { error: "Użytkownik z tym adresem email nie istnieje" };
    }


    // Check if already a member using RPC (bypasses RLS with SECURITY DEFINER)
    const { data: existingMembers, error: checkError } = await supabase
      .rpc('check_existing_member', {
        p_project_id: projectId,
        p_user_id: inviteeProfile.id
      });


    const existingMember = existingMembers?.[0];

    if (existingMember) {
      if (existingMember.status === "active") {
        return { error: "Ten użytkownik jest już członkiem projektu" };
      } else if (existingMember.status === "pending") {
        return { error: "Zaproszenie dla tego użytkownika już zostało wysłane" };
      }
    }

    // Create invitation
    const { data: insertedData, error: insertError } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: inviteeProfile.id,
        role,
        invited_by: user.id,
        status: "pending",
      })
      .select();

    if (insertError) {
      logger.error("[inviteProjectMember] Error creating invitation:", {}, insertError);
      return { error: "Błąd podczas wysyłania zaproszenia" };
    }


    revalidateProject(projectId);
    return { success: true };
  } catch (error) {
    logger.error("💥 [inviteProjectMember] Exception:", {}, error);
    return { error: "Nieoczekiwany błąd" };
  }
}

// Accept project invitation
export async function acceptProjectInvitation(
  membershipId: string
): Promise<{ success?: boolean; error?: string }> {
  try {

    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { error: "Musisz być zalogowany" };
    }


    // Update membership status
    const { error, data } = await supabase
      .from("project_members")
      .update({
        status: "active",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select();

    if (error) {
      logger.error("[acceptProjectInvitation] Error updating:", {}, error);
      return { error: "Błąd podczas akceptowania zaproszenia" };
    }


    // Revalidate both dashboard and the specific project
    revalidatePath("/dashboard", 'page');
    if (data && data.length > 0 && data[0].project_id) {
      revalidateProject(data[0].project_id);
    }
    return { success: true };
  } catch (error) {
    logger.error("💥 [acceptProjectInvitation] Exception:", {}, error);
    return { error: "Nieoczekiwany błąd" };
  }
}

// Decline project invitation  
export async function declineProjectInvitation(
  membershipId: string
): Promise<{ success?: boolean; error?: string }> {
  try {

    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { error: "Musisz być zalogowany" };
    }


    // Update membership status
    const { error, data } = await supabase
      .from("project_members")
      .update({
        status: "declined",
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select();

    if (error) {
      logger.error("[declineProjectInvitation] Error updating:", {}, error);
      return { error: "Błąd podczas odrzucania zaproszenia" };
    }


    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    logger.error("💥 [declineProjectInvitation] Exception:", {}, error);
    return { error: "Nieoczekiwany błąd" };
  }
}

// Remove member from project (owner only)
export async function removeProjectMember(
  projectId: string,
  membershipId: string
): Promise<{ success?: boolean; error?: string }> {
  
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      logger.error("No user logged in", {});
      return { error: "Musisz być zalogowany" };
    }

    // Check if user is project owner
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();


    if (!project || project.user_id !== user.id) {
      logger.error("User is not project owner:", {}, { projectUserId: project?.user_id, userId: user.id });
      return { error: "Tylko właściciel projektu może usuwać członków" };
    }

    // Delete membership
    const { data: deleteData, error, count } = await supabase
      .from("project_members")
      .delete()
      .eq("id", membershipId)
      .eq("project_id", projectId)
      .neq("role", "owner") // Cannot remove owner
      .select();


    if (error) {
      logger.error("Error removing member:", {}, error);
      return { error: `Błąd podczas usuwania członka: ${error.message}` };
    }

    if (!deleteData || deleteData.length === 0) {
      // Member may not exist or is project owner — safe to ignore
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    logger.error("💥 Exception in removeProjectMember:", {}, error);
    return { error: "Nieoczekiwany błąd" };
  }
}

// Update member role (owner only)
export async function updateProjectMemberRole(
  projectId: string,
  membershipId: string,
  newRole: ProjectMemberRole
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return { error: "Musisz być zalogowany" };
    }

    // Check if user is project owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Tylko właściciel projektu może zmieniać role" };
    }

    // Update role
    const { error } = await supabase
      .from("project_members")
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId)
      .eq("project_id", projectId)
      .neq("role", "owner"); // Cannot change owner role

    if (error) {
      logger.error("Error updating member role:", {}, error);
      return { error: "Błąd podczas zmiany roli" };
    }

    revalidateProject(projectId);
    return { success: true };
  } catch (error) {
    logger.error("Exception in updateProjectMemberRole:", {}, error);
    return { error: "Nieoczekiwany błąd" };
  }
}

// Get pending invitations for current user
export async function getPendingInvitations(): Promise<ProjectMemberWithProfile[]> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) {
      return [];
    }


    // Fetch invitations without JOIN — projects RLS blocks join for non-owners
    const { data: invitations, error } = await supabase
      .from("project_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("invited_at", { ascending: false });

    if (error) {
      logger.error("[getPendingInvitations] Error fetching invitations:", {}, error);
      return [];
    }

    if (!invitations || invitations.length === 0) {
      return [];
    }

    // Fetch project names via RPC to bypass RLS
    const projectIds = [...new Set(invitations.map(inv => inv.project_id))];
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    // Fetch profiles of inviters
    const inviterIds = invitations
      .map(inv => inv.invited_by)
      .filter((id): id is string => id !== null && id !== undefined);

    const { data: profiles } = inviterIds.length > 0
      ? await supabase.from("profiles").select("id, company_name, email").in("id", inviterIds)
      : { data: [] };

    // Combine
    const projectMap = new Map((projects || []).map(p => [p.id, p]));
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const result = invitations.map(inv => ({
      ...inv,
      projects: projectMap.get(inv.project_id) ?? null,
      profiles: inv.invited_by ? profileMap.get(inv.invited_by) ?? null : null,
    }));


    return result as ProjectMemberWithProfile[];
  } catch (error) {
    logger.error("💥 [getPendingInvitations] Exception:", {}, error);
    return [];
  }
}
