"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { lookupKnrByName } from "@/lib/knr-local-context";

export async function listMyProjects(): Promise<{ id: string; name: string }[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return [];
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function addLineToProject(
  projectId: string,
  line: { name: string; unit: string; quantity: number },
): Promise<{ ok?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: "Nie ma takiego projektu" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("hourly_rate")
    .eq("id", user.id)
    .maybeSingle();
  const rate = Number((profile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0);
  const match = lookupKnrByName(line.name);
  const hours = match && match.laborNorm > 0 ? match.laborNorm : 0;
  const labor = rate >= 1 && hours > 0 ? Math.round(hours * rate * 100) / 100 : 0;
  const qty = Math.max(0.01, line.quantity);

  const { error } = await supabase.from("project_items").insert({
    project_id: projectId,
    name: line.name,
    unit: line.unit,
    quantity: qty,
    material_price: 0,
    labor_price: labor,
    final_material_price: 0,
    final_labor_price: labor,
    labor_norm: hours || null,
    labor_hours_total: hours ? Math.round(hours * qty * 100) / 100 : null,
    is_custom: true,
    knr_code: match?.code ?? null,
    knr_source: hours ? "system_knr" : null,
    confidence_level: hours ? "verified" : "uncertain",
  });

  if (error) return { error: "Nie udało się dodać pozycji" };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}
