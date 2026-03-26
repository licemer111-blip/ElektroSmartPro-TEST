"use server";

import { createClient } from "@/utils/supabase/server";

// Получить количество комментариев к проекту
export async function getProjectCommentCount(projectId: string) {
  const supabase = await createClient();
  
  // Сначала получаем ID всех позиций проекта
  const { data: projectItems } = await supabase
    .from("project_items")
    .select("id")
    .eq("project_id", projectId);

  if (!projectItems) return 0;

  const itemIds = projectItems.map(item => item.id);

  // Считаем комментарии
  const { count } = await supabase
    .from("item_comments")
    .select("*", { count: "exact", head: true })
    .in("project_item_id", itemIds);

  return count || 0;
}

// Получить время последнего изменения в проекте
export async function getLastProjectChange(projectId: string) {
  const supabase = await createClient();
  
  // Сначала получаем ID всех позиций проекта
  const { data: projectItems } = await supabase
    .from("project_items")
    .select("id")
    .eq("project_id", projectId);

  if (!projectItems || projectItems.length === 0) return null;

  const itemIds = projectItems.map(item => item.id);

  // Получаем последнее изменение из истории
  const { data } = await supabase
    .from("project_item_history")
    .select("created_at")
    .in("project_item_id", itemIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.created_at || null;
}
