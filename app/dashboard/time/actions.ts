"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
import { validate } from "@/lib/validations";
import { logger } from "@/lib/logger";
import type { TimeEntry } from "./utils";

// Re-export type for convenience


// =====================================================
// TIME TRACKING CRUD
// =====================================================

/**
 * Start a new timer for a project
 */
export async function startTimer(
  projectId: string,
  description?: string
): Promise<{ success?: boolean; error?: string; entry?: TimeEntry }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  // Check if there's already a running timer
  const { data: runningTimer } = await supabase
    .from("time_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_running", true)
    .single();

  if (runningTimer) {
    return { error: "Masz już uruchomiony timer. Zatrzymaj go przed rozpoczęciem nowego." };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      project_id: projectId,
      started_at: new Date().toISOString(),
      description: description || null,
      is_running: true,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error starting timer", { projectId }, error);
    return { error: "Błąd podczas uruchamiania timera" };
  }

  revalidatePath("/dashboard/time");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, entry: data as TimeEntry };
}

/**
 * Stop the running timer
 */
export async function stopTimer(
  entryId: string
): Promise<{ success?: boolean; error?: string; entry?: TimeEntry }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .update({
      ended_at: new Date().toISOString(),
      is_running: false,
    })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("is_running", true)
    .select()
    .single();

  if (error) {
    logger.error("Error stopping timer", { entryId }, error);
    return { error: "Błąd podczas zatrzymywania timera" };
  }

  revalidatePath("/dashboard/time");
  return { success: true, entry: data as TimeEntry };
}

/**
 * Add a manual time entry
 */
export async function addManualTimeEntry(
  projectId: string,
  startedAt: string,
  endedAt: string,
  description?: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  if (durationMinutes <= 0) {
    return { error: "Czas zakończenia musi być późniejszy niż czas rozpoczęcia" };
  }

  const { error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      project_id: projectId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      description: description || null,
      is_running: false,
    });

  if (error) {
    logger.error("Error adding time entry", { projectId }, error);
    return { error: "Błąd podczas dodawania wpisu" };
  }

  revalidatePath("/dashboard/time");
  return { success: true };
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(entryId: string): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting time entry", { entryId }, error);
    return { error: "Błąd podczas usuwania wpisu" };
  }

  revalidatePath("/dashboard/time");
  return { success: true };
}

/**
 * Get running timer for current user
 */
export async function getRunningTimer(): Promise<TimeEntry | null> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  const { data, error } = await supabase
    .from("time_entries")
    .select(`
      *,
      project:project_id (
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("is_running", true)
    .single();

  if (error || !data) return null;

  return data as TimeEntry;
}

/**
 * Get time entries for current user
 */
export async function getMyTimeEntries(
  limit: number = 50,
  startDate?: string,
  endDate?: string
): Promise<TimeEntry[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];

  let query = supabase
    .from("time_entries")
    .select(`
      *,
      project:project_id (
        name
      )
    `)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte("started_at", startDate);
  }
  if (endDate) {
    query = query.lte("started_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Error fetching time entries", {}, error);
    return [];
  }

  return (data || []) as TimeEntry[];
}

/**
 * Get time entries for a project
 */
export async function getProjectTimeEntries(
  projectId: string,
  limit: number = 50
): Promise<TimeEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_entries")
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Error fetching project time entries", { projectId }, error);
    return [];
  }

  return (data || []) as TimeEntry[];
}

/**
 * Get time summary for user
 */
export async function getTimeSummary(): Promise<{
  today: number;
  week: number;
  month: number;
  runningTimer: TimeEntry | null;
}> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { today: 0, week: 0, month: 0, runningTimer: null };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  // Get running timer
  const { data: runningTimer } = await supabase
    .from("time_entries")
    .select(`*, project:project_id (name)`)
    .eq("user_id", user.id)
    .eq("is_running", true)
    .single();

  // Get totals (simplified - sum duration_minutes)
  const { data: entries } = await supabase
    .from("time_entries")
    .select("started_at, ended_at, duration_minutes")
    .eq("user_id", user.id)
    .gte("started_at", monthStart.toISOString());

  let today = 0, week = 0, month = 0;

  (entries || []).forEach((entry: { started_at: string; ended_at: string | null; duration_minutes: number | null }) => {
    const duration = entry.duration_minutes ||
      (entry.ended_at ? Math.round((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000) : 0);

    const entryDate = new Date(entry.started_at);

    if (entryDate >= todayStart) today += duration;
    if (entryDate >= weekStart) week += duration;
    month += duration;
  });

  return {
    today,
    week,
    month,
    runningTimer: runningTimer as TimeEntry | null,
  };
}

