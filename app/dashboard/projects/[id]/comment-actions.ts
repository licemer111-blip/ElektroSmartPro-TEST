"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Pobierz komentarze do pozycji
export async function getItemComments(projectItemId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("item_comments")
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq("project_item_id", projectItemId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Error fetching item comments:", {}, error);
    return [];
  }

  return data || [];
}

// Dodaj komentarz
export async function addItemComment(
  projectItemId: string,
  content: string,
  mentionedUserIds: string[] = []
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    throw new Error("Musisz być zalogowany");
  }

  const { error } = await supabase
    .from("item_comments")
    .insert({
      project_item_id: projectItemId,
      user_id: user.id,
      content,
      mentioned_user_ids: mentionedUserIds,
    });

  if (error) {
    logger.error("Error adding item comment:", {}, error);
    throw new Error("Nie udało się dodać komentarza");
  }

  // Pobierz ID projektu do rewalidacji
  const { data: projectItem } = await supabase
    .from("project_items")
    .select("project_id")
    .eq("id", projectItemId)
    .single();

  if (projectItem) {
    revalidatePath(`/dashboard/projects/${projectItem.project_id}`);
  }

  return { success: true };
}

// Oznacz komentarz jako rozwiązany
export async function resolveComment(commentId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    throw new Error("Musisz być zalogowany");
  }

  // Verify access — only comment author or project manager can resolve
  const { data: comment } = await supabase
    .from("item_comments")
    .select("user_id, project_item_id")
    .eq("id", commentId)
    .single();

  if (!comment) throw new Error("Komentarz nie znaleziony");
  const canResolve = comment.user_id === user.id || await canManageProject(comment.project_item_id, user.id);
  if (!canResolve) throw new Error("Nie masz uprawnień do zamknięcia tego komentarza");

  const { error } = await supabase
    .from("item_comments")
    .update({ 
      resolved: true, 
      resolved_at: new Date().toISOString(),
      resolved_by: user.id
    })
    .eq("id", commentId);

  if (error) {
    logger.error("Error resolving comment:", {}, error);
    throw new Error("Nie udało się oznaczyć komentarza jako rozwiązany");
  }

  return { success: true };
}

// Usuń komentarz
export async function deleteComment(commentId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    throw new Error("Musisz być zalogowany");
  }

  // Sprawdź prawa dostępu przed usunięciem
  const { data: comment } = await supabase
    .from("item_comments")
    .select("user_id, project_item_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    throw new Error("Komentarz nie znaleziony");
  }

  // Sprawdź czy użytkownik może usunąć komentarz
  const canDelete = comment.user_id === user.id || await canManageProject(comment.project_item_id, user.id);

  if (!canDelete) {
    throw new Error("Nie masz uprawnień do usunięcia tego komentarza");
  }

  const { error } = await supabase
    .from("item_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    logger.error("Error deleting comment:", {}, error);
    throw new Error("Nie udało się usunąć komentarza");
  }

  return { success: true };
}

// Sprawdź czy użytkownik może zarządzać projektem
async function canManageProject(projectItemId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("project_items")
    .select("project_id")
    .eq("id", projectItemId)
    .single();

  if (!data) return false;

  // Sprawdź prawa w team_members
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["admin", "kierownik"]);

  return (count || 0) > 0;
}

// Pobierz liczbę nierozwiązanych komentarzy w projekcie
export async function getProjectUnresolvedCommentsCount(projectId: string) {
  const supabase = await createClient();
  
  // Pobierz ID wszystkich pozycji w projekcie
  const { data: projectItems, error: itemsError } = await supabase
    .from("project_items")
    .select("id")
    .eq("project_id", projectId);

  if (itemsError || !projectItems) {
    logger.error("Error getting project items:", {}, itemsError);
    return 0;
  }

  // Zlicz komentarze dla tych pozycji
  const itemIds = projectItems.map(item => item.id);
  const { count, error } = await supabase
    .from("item_comments")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false)
    .in("project_item_id", itemIds);

  if (error) {
    logger.error("Error getting unresolved comments count:", {}, error);
    return 0;
  }

  return count || 0;
}
