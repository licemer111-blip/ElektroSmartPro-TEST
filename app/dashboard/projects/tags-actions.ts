"use server";

import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";

// Define type inline to avoid re-export issues in Server Actions
export type ProjectTag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

// =====================================================
// ARCHIVE FUNCTIONS
// =====================================================

/**
 * Archive a project (set status to 'archived')
 */
export async function archiveProject(projectId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error archiving project:", {}, error);
    return { error: "Błąd podczas archiwizacji projektu" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Restore a project from archive (set status to 'draft')
 */
export async function restoreProject(projectId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: "draft" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error restoring project:", {}, error);
    return { error: "Błąd podczas przywracania projektu" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// =====================================================
// TAG FUNCTIONS
// =====================================================

/**
 * Get all tags for current user
 */
export async function getTags(): Promise<ProjectTag[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching tags:", {}, error);
    return [];
  }

  return (data || []) as ProjectTag[];
}

/**
 * Create a new tag
 */
export async function createTag(
  name: string,
  color: string = "#6366f1"
): Promise<{ success?: boolean; error?: string; tag?: ProjectTag }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  if (!name || name.trim().length === 0) {
    return { error: "Nazwa tagu jest wymagana" };
  }

  const { data, error } = await supabase
    .from("project_tags")
    .insert({
      user_id: user.id,
      name: name.trim(),
      color,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Tag o tej nazwie już istnieje" };
    }
    logger.error("Error creating tag:", {}, error);
    return { error: "Błąd podczas tworzenia tagu" };
  }

  revalidatePath("/dashboard");
  return { success: true, tag: data as ProjectTag };
}

/**
 * Update a tag
 */
export async function updateTag(
  tagId: string,
  updates: { name?: string; color?: string }
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("project_tags")
    .update(updates)
    .eq("id", tagId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating tag:", {}, error);
    return { error: "Błąd podczas aktualizacji tagu" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("project_tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting tag:", {}, error);
    return { error: "Błąd podczas usuwania tagu" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Add tag to project
 */
export async function addTagToProject(
  projectId: string,
  tagId: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("project_tag_assignments")
    .insert({
      project_id: projectId,
      tag_id: tagId,
    });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ten tag jest już przypisany do projektu" };
    }
    logger.error("Error adding tag to project:", {}, error);
    return { error: "Błąd podczas dodawania tagu" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/**
 * Remove tag from project
 */
export async function removeTagFromProject(
  projectId: string,
  tagId: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("project_tag_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("tag_id", tagId);

  if (error) {
    logger.error("Error removing tag from project:", {}, error);
    return { error: "Błąd podczas usuwania tagu" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/**
 * Get tags for a project
 */
export async function getProjectTags(projectId: string): Promise<ProjectTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_tag_assignments")
    .select(`
      tag_id,
      project_tags (
        id,
        user_id,
        name,
        color,
        created_at
      )
    `)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error fetching project tags:", {}, error);
    return [];
  }

  return (data || []).map((d) => {
    const tags = (d as Record<string, unknown>).project_tags;
    return Array.isArray(tags) ? tags[0] : tags;
  }).filter(Boolean) as ProjectTag[];
}

// =====================================================
// COLOR FUNCTIONS
// =====================================================

/**
 * Update project color
 */
export async function updateProjectColor(
  projectId: string,
  color: string | null
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ color })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating project color:", {}, error);
    return { error: "Błąd podczas aktualizacji koloru" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
