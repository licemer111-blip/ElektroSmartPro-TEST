"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { Profile } from "@/lib/types/database";

export async function getUserProfile(): Promise<Profile | null> {
  noStore();
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) redirect("/login");

  let { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    const { error: insertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, is_pro: false, role: "user" }, { onConflict: "id", ignoreDuplicates: true });
    if (insertError) {
      logger.error("Failed to create profile", {}, insertError);
      return null;
    }
    const { data: newData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    data = newData;
  } else if (error) {
    logger.error("Error fetching profile", {}, error);
    return null;
  }

  return data as Profile;
}

export async function getRecentClientActivity(): Promise<{
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  data?: Record<string, unknown>;
}[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, read, created_at, action_url, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data || []) as {
    id: string; type: string; title: string; message: string;
    read: boolean; created_at: string; action_url?: string; data?: Record<string, unknown>;
  }[];
}

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await requireAuth();
  if (!user || !supabase) return { success: false, error: "Brak autoryzacji" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function clearAllNotifications(): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await requireAuth();
  if (!user || !supabase) return { success: false, error: "Brak autoryzacji" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
