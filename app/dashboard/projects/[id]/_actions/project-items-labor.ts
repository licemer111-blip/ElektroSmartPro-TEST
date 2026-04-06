"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { canUserEditProject, revalidateProject } from "./utils";

// Update work completion status for a project item
export async function updateWorkStatus(
  projectId: string,
  itemId: string,
  workStatus: "pending" | "in_progress" | "done" | "accepted" | "purchased" | "delivered" | "installed" | "checked"
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("project_items")
    .update({ work_status: workStatus })
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error updating work status", { projectId, itemId }, error);
    return { error: "Błąd aktualizacji statusu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

// Update labor_norm and recalculate labor_hours_total + labor_price for an item
export async function updateItemLaborNorm(
  projectId: string,
  itemId: string,
  laborNorm: number | null,
  hourlyRate: number
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: item } = await supabase
    .from("project_items")
    .select("quantity")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .single();

  if (!item) return { error: "Nie znaleziono pozycji" };

  let updatePayload: Record<string, number | null | boolean>;

  if (laborNorm == null) {
    updatePayload = { labor_norm: null, labor_hours_total: null, norm_protected: false };
  } else {
    const laborHoursTotal = Math.round(item.quantity * laborNorm * 100) / 100;
    const laborPrice = Math.round(laborHoursTotal * hourlyRate * 100) / 100;
    updatePayload = {
      labor_norm: laborNorm,
      labor_hours_total: laborHoursTotal,
      final_labor_price: laborPrice,
      norm_protected: true,
    };
  }

  const { error } = await supabase
    .from("project_items")
    .update(updatePayload)
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error updating labor norm", { projectId, itemId }, error);
    return { error: "Błąd podczas aktualizacji normy" };
  }

  revalidateProject(projectId);
  return { success: true };
}

/**
 * "Sбросить к нормам КНР" — unlocks a protected norm.
 * Clears norm_protected, labor_norm, labor_hours_total, suggested_norm.
 * Next engine run will fill it fresh from es_dictionary.
 */
export async function resetItemNormToKnr(
  projectId: string,
  itemId: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("project_items")
    .update({
      norm_protected: false,
      labor_norm: null,
      labor_hours_total: null,
      suggested_norm: null,
    })
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    logger.error("Error resetting norm protection", { projectId, itemId }, error);
    return { error: "Błąd podczas resetowania normy" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Recalculate ALL items with labor_norm when hourly rate changes
export async function recalcAllLaborNorms(
  projectId: string,
  newHourlyRate: number
): Promise<{ success?: boolean; updatedCount?: number; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: items } = await supabase
    .from("project_items")
    .select("id, quantity, labor_norm")
    .eq("project_id", projectId)
    .not("labor_norm", "is", null);

  if (!items || items.length === 0) return { success: true, updatedCount: 0 };

  const updates = items
    .filter(i => i.labor_norm != null && i.labor_norm > 0)
    .map(i => {
      const laborHoursTotal = Math.round(i.quantity * i.labor_norm! * 100) / 100;
      const laborPrice = Math.round(laborHoursTotal * newHourlyRate * 100) / 100;
      return { id: i.id, labor_hours_total: laborHoursTotal, final_labor_price: laborPrice };
    });

  if (updates.length === 0) return { success: true, updatedCount: 0 };

  const results = await Promise.all(
    updates.map(u =>
      supabase
        .from("project_items")
        .update({ labor_hours_total: u.labor_hours_total, final_labor_price: u.final_labor_price })
        .eq("id", u.id)
        .eq("project_id", projectId)
    )
  );

  const failed = results.filter(r => r.error);
  if (failed.length > 0) {
    logger.error("recalcAllLaborNorms partial failure", { projectId, failed: failed.length });
  }

  revalidateProject(projectId);
  return { success: true, updatedCount: updates.length - failed.length };
}

// Get project work progress summary
export async function getProjectWorkProgress(projectId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  const { data: items } = await supabase
    .from("project_items")
    .select("id, work_status")
    .eq("project_id", projectId);

  if (!items || items.length === 0) return null;

  const total = items.length;
  const counts = {
    pending: items.filter(i => !i.work_status || i.work_status === "pending").length,
    purchased: items.filter(i => i.work_status === "purchased").length,
    delivered: items.filter(i => i.work_status === "delivered").length,
    installed: items.filter(i => i.work_status === "installed").length,
    checked: items.filter(i => i.work_status === "checked").length,
  };

  const completedWeight =
    counts.purchased * 0.25 +
    counts.delivered * 0.5 +
    counts.installed * 0.75 +
    counts.checked * 1;
  const progressPercent = Math.round((completedWeight / total) * 100);

  return { total, counts, progressPercent };
}
