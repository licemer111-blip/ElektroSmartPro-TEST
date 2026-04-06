"use server";

import { logger } from "@/lib/logger";
import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export async function getProjectMessages(
  projectId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data: messages, error } = await supabase
    .from("project_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !messages) return [];

  // Fetch user profiles for display names
  const userIds = [...new Set(messages.map((m: { user_id: string }) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles || []).map((p: { id: string; email: string | null; full_name: string | null; company_name: string | null }) => [
      p.id,
      { email: p.email || "Nieznany", name: p.full_name || p.company_name || p.email || "Nieznany" },
    ])
  );

  return messages.map((m: { id: string; project_id: string; user_id: string; content: string; created_at: string }) => ({
    ...m,
    user_email: profileMap.get(m.user_id)?.email || "Nieznany",
    user_name: profileMap.get(m.user_id)?.name || "Nieznany",
  }));
}

export async function sendProjectMessage(
  projectId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Wiadomość nie może być pusta" };
  if (trimmed.length > 2000) return { success: false, error: "Maksymalnie 2000 znaków" };

  const { error } = await supabase.from("project_messages").insert({
    project_id: projectId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) {
    logger.error("Error sending message:", {}, error);
    return { success: false, error: "Nie udało się wysłać wiadomości" };
  }

  return { success: true };
}

export async function getUnreadMessageCount(
  projectId: string
): Promise<number> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return 0;

  // Count messages from last 24h that are not from the current user
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("project_messages")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .neq("user_id", user.id)
    .gte("created_at", since);

  if (error) return 0;
  return count || 0;
}
