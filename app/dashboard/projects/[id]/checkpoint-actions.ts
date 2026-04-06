"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";

export interface Checkpoint {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  status: "pending" | "in_progress" | "done" | "accepted";
  sort_order: number;
  created_at: string;
}

export async function getProjectCheckpoints(
  projectId: string
): Promise<Checkpoint[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("project_checkpoints")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || []) as Checkpoint[];
}

export async function createCheckpoint(
  projectId: string,
  title: string
): Promise<{ success: boolean; checkpoint?: Checkpoint; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

  if (!title.trim() || title.trim().length > 500) {
    return { success: false, error: "Tytuł musi mieć od 1 do 500 znaków" };
  }

  const { data: maxOrder } = await supabase
    .from("project_checkpoints")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("project_checkpoints")
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: title.trim(),
      status: "pending",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Błąd tworzenia checkpointu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, checkpoint: data as Checkpoint };
}

export async function updateCheckpoint(
  projectId: string,
  checkpointId: string,
  updates: { title?: string; status?: string }
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

  const updateData: Record<string, string> = {};
  if (updates.title !== undefined) {
    if (!updates.title.trim() || updates.title.trim().length > 500) {
      return { success: false, error: "Tytuł musi mieć od 1 do 500 znaków" };
    }
    updateData.title = updates.title.trim();
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  const { error } = await supabase
    .from("project_checkpoints")
    .update(updateData)
    .eq("id", checkpointId)
    .eq("project_id", projectId);

  if (error) {
    return { success: false, error: "Błąd aktualizacji checkpointu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function deleteCheckpoint(
  projectId: string,
  checkpointId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

  const { error } = await supabase
    .from("project_checkpoints")
    .delete()
    .eq("id", checkpointId)
    .eq("project_id", projectId);

  if (error) {
    return { success: false, error: "Błąd usuwania checkpointu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
