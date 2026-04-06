"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { Team } from "@/lib/types/database";

// Get the current user's role on a project (owner / editor / viewer / null)
export async function getUserProjectRole(
  projectId: string
): Promise<"owner" | "editor" | "viewer" | "elektryk" | "kierownik" | "admin" | null> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return null;

    // Check if owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();
    if (project?.user_id === user.id) return "owner";

    // Check team membership role
    const { data: member } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .single();

    if (member?.role) return member.role as "editor" | "viewer" | "elektryk" | "kierownik" | "admin";
    return null;
  } catch {
    return null;
  }
}

// Assign project to a team member
export async function assignProject(
  projectId: string,
  assignToUserId: string | null
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Unauthorized" };

  // Verify permissions (owner only can assign)
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Tylko właściciel projektu może przypisywać" };
  }

  // If assigning to someone, verify they are a member of the project
  if (assignToUserId) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", assignToUserId)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return { error: "Użytkownik nie jest członkiem projektu" };
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ assigned_to: assignToUserId })
    .eq("id", projectId);

  if (error) {
    logger.error("Error assigning project", { projectId, assignToUserId }, error);
    return { error: "Nie udało się przypisać projektu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// Fetch user team for project page (minimal data)
export async function getUserTeamForProjectPage(): Promise<Team | null> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  const { data: member } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", member.team_id)
    .single();

  return team as Team;
}
