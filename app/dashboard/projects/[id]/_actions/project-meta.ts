"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { clientDataSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";
import type { ProjectWithRelations } from "@/lib/types/database";
import { canUserEditProject, revalidateProject } from "./utils";

// Fetch project with all relations
export async function getProjectDetails(
  projectId: string
): Promise<ProjectWithRelations | null> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) redirect("/login");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      logger.error("Invalid UUID format", { projectId });
      return null;
    }

    const { data: hasAccess } = await supabase
      .rpc("has_project_access", { p_project_id: projectId, p_user_id: user.id });

    if (!hasAccess) return null;

    const { data: baseProject, error: baseError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (baseError) {
      if (baseError.code === "PGRST116") return null;
      logger.error("Error fetching project", { projectId, code: baseError.code }, baseError);
      return null;
    }

    if (!baseProject) return null;

    const [regionsData, objectTypesData] = await Promise.all([
      baseProject.region_id
        ? supabase.from("regions").select("id, name, slug, price_modifier").eq("id", baseProject.region_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      baseProject.object_type_id
        ? supabase.from("object_types").select("id, name, slug, default_vat_rate").eq("id", baseProject.object_type_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      ...baseProject,
      regions: regionsData.data,
      object_types: objectTypesData.data,
    } as ProjectWithRelations;
  } catch (error) {
    logger.error("Exception in getProjectDetails", { projectId }, error);
    return null;
  }
}

// Update project name
export async function updateProjectName(projectId: string, newName: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  if (!newName || newName.trim().length === 0) return { error: "Nazwa projektu nie może być pusta" };

  const { error } = await supabase
    .from("projects")
    .update({ name: newName.trim() })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project name", { projectId }, error);
    return { error: "Nie udało się zaktualizować nazwy projektu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// Toggle project status between draft and final
export async function toggleProjectStatus(projectId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) {
    logger.error("Error fetching project status", { projectId }, fetchError);
    return { error: "Nie udało się pobrać statusu projektu" };
  }

  const newStatus = project.status === "final" ? "draft" : "final";

  if (newStatus === "final") {
    try {
      const { data: snapshotItems } = await supabase
        .from("project_items")
        .select("id, name, unit, quantity, final_material_price, final_labor_price, material_price, labor_price, sort_order, is_assembly_child, parent_assembly_id")
        .eq("project_id", projectId)
        .order("sort_order");

      if (snapshotItems && snapshotItems.length > 0) {
        const snapshot = {
          version: new Date().toISOString(),
          itemCount: snapshotItems.length,
          items: snapshotItems,
        };
        const fileName = `Snapshot_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        await supabase.storage
          .from("project-documents")
          .upload(`${projectId}/client/${fileName}`, new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
      }
    } catch (snapErr) {
      logger.error("Failed to save finalization snapshot", { projectId }, snapErr);
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project status", { projectId }, error);
    return { error: "Nie udało się zmienić statusu projektu" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true, newStatus };
}

// Update project status to final (backward compatibility)
export async function markProjectAsFinal(projectId: string) {
  return toggleProjectStatus(projectId);
}

// Update client data
export async function updateClientData(
  projectId: string,
  clientData: {
    client_name?: string | null;
    client_address?: string | null;
    client_nip?: string | null;
  }
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error: validationError } = validate(clientDataSchema, clientData);
  if (validationError) return { error: validationError };

  const { error } = await supabase
    .from("projects")
    .update({
      client_name: clientData.client_name?.trim() || null,
      client_address: clientData.client_address?.trim() || null,
      client_nip: clientData.client_nip?.trim() || null,
    })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating client data", { projectId }, error);
    return { error: "Nie udało się zaktualizować danych klienta" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// Update project adjustment percentage
export async function updateAdjustmentPercentage(projectId: string, adjustmentPercentage: number) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  if (adjustmentPercentage < -20 || adjustmentPercentage > 20) {
    return { error: "Adjustment must be between -20% and +20%" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ adjustment_percentage: adjustmentPercentage })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating adjustment percentage", { projectId, adjustmentPercentage }, error);
    return { error: "Nie udało się zaktualizować korekty ceny" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project narzuty (surcharges: Kp, Z, Kz)
export async function updateProjectNarzuty(
  projectId: string,
  narzuty: { kp_percent: number; z_percent: number; kz_percent: number }
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { kp_percent, z_percent, kz_percent } = narzuty;
  if (kp_percent < 0 || kp_percent > 100 || z_percent < 0 || z_percent > 100 || kz_percent < 0 || kz_percent > 100) {
    return { error: "Narzuty muszą być w zakresie 0-100%" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ kp_percent, z_percent, kz_percent })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating narzuty", { projectId, narzuty }, error);
    return { error: "Nie udało się zaktualizować narzutów" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project safety factors (Materiały pomocnicze + Zapas kabli)
export async function updateProjectSafetyFactors(
  projectId: string,
  factors: { aux_material_pct: number; cable_waste_pct: number }
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { aux_material_pct, cable_waste_pct } = factors;
  if (aux_material_pct < 0 || aux_material_pct > 20 || cable_waste_pct < 0 || cable_waste_pct > 20) {
    return { error: "Współczynniki muszą być w zakresie 0–20%" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ aux_material_pct, cable_waste_pct })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating safety factors", { projectId, factors }, error);
    return { error: "Nie udało się zaktualizować współczynników" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project v3.0 finance settings (split markups, contingency, complexity)
export async function updateProjectV3Settings(
  projectId: string,
  settings: {
    mat_markup_pct?: number;
    lab_markup_pct?: number;
    contingency_pct?: number;
    complexity_factor?: number;
  }
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { mat_markup_pct, lab_markup_pct, contingency_pct, complexity_factor } = settings;

  if (mat_markup_pct !== undefined && (mat_markup_pct < 0 || mat_markup_pct > 100))
    return { error: "Narzut na materiały musi być w zakresie 0–100%" };
  if (lab_markup_pct !== undefined && (lab_markup_pct < 0 || lab_markup_pct > 100))
    return { error: "Narzut na robociznę musi być w zakresie 0–100%" };
  if (contingency_pct !== undefined && (contingency_pct < 0 || contingency_pct > 20))
    return { error: "Rezerwa musi być w zakresie 0–20%" };
  if (complexity_factor !== undefined && (complexity_factor < 0.5 || complexity_factor > 3.0))
    return { error: "Współczynnik złożoności musi być w zakresie 0.5–3.0" };

  const payload: Record<string, number> = {};
  if (mat_markup_pct !== undefined) payload.mat_markup_pct = mat_markup_pct;
  if (lab_markup_pct !== undefined) payload.lab_markup_pct = lab_markup_pct;
  if (contingency_pct !== undefined) payload.contingency_pct = contingency_pct;
  if (complexity_factor !== undefined) payload.complexity_factor = complexity_factor;

  const { error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating v3 settings", { projectId, settings }, error);
    return { error: "Nie udało się zaktualizować ustawień" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project region (voivodeship)
export async function updateProjectRegion(projectId: string, regionId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("projects")
    .update({ region_id: regionId || null })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project region", { projectId, regionId }, error);
    return { error: "Nie udało się zaktualizować województwa" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project VAT rate — VAT Guard: only 8% or 23% allowed
export async function updateProjectVatRate(projectId: string, vatRate: number) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  if (![8, 23].includes(vatRate)) {
    return { error: "Nieprawidłowa stawka VAT (dozwolone: 8% lub 23%)" };
  }

  const { error } = await supabase
    .from("projects")
    .update({ vat_rate: vatRate })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project VAT rate", { projectId, vatRate }, error);
    return { error: "Nie udało się zaktualizować stawki VAT" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project notes
export async function updateProjectNotes(projectId: string, notes: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("projects")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project notes", { projectId }, error);
    return { error: "Nie udało się zapisać notatek" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Append text to project notes (e.g. from AI analysis)
export async function appendProjectNotes(projectId: string, textToAppend: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { data: project } = await supabase
    .from("projects")
    .select("notes")
    .eq("id", projectId)
    .single();

  const currentNotes = (project?.notes as string) || "";
  const newNotes = currentNotes.trim()
    ? `${currentNotes.trim()}\n\n${textToAppend.trim()}`
    : textToAppend.trim();

  const { error } = await supabase
    .from("projects")
    .update({ notes: newNotes, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    logger.error("Error appending project notes", { projectId }, error);
    return { error: "Nie udało się dodać do notatek" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Toggle "Customer owns materials" mode
export async function toggleMaterialsOwnedByCustomer(projectId: string, enabled: boolean) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("projects")
    .update({ materials_owned_by_customer: enabled })
    .eq("id", projectId);

  if (error) {
    logger.error("Error toggling materials mode", { projectId, enabled }, error);
    return { error: "Błąd podczas aktualizacji ustawienia" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project deadline
export async function updateProjectDeadline(
  projectId: string,
  deadline: string | null
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("projects")
    .update({ deadline })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project deadline", { projectId }, error);
    return { error: "Nie udało się zaktualizować terminu realizacji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Duplicate entire project with all items
export async function duplicateProject(
  projectId: string,
  newName?: string
): Promise<{ project?: ProjectWithRelations; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  try {
    const { data: originalProject, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !originalProject) {
      logger.error("Error fetching project for duplication", { projectId }, projectError);
      return { error: "Nie znaleziono projektu" };
    }

    const { data: originalItems, error: itemsError } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      logger.error("Error fetching project items for duplication", { projectId }, itemsError);
      return { error: "Nie udało się pobrać pozycji projektu" };
    }

    const { data: newProject, error: createError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: newName || `${originalProject.name} (kopia)`,
        status: "draft",
        region_id: originalProject.region_id,
        object_type_id: originalProject.object_type_id,
        vat_rate: originalProject.vat_rate,
        adjustment_percentage: originalProject.adjustment_percentage,
        rate_source: originalProject.rate_source,
        notes: originalProject.notes,
        client_name: originalProject.client_name,
        client_address: originalProject.client_address,
        client_nip: originalProject.client_nip,
        client_id: originalProject.client_id,
        materials_owned_by_customer: originalProject.materials_owned_by_customer,
        category_id: originalProject.category_id,
        color: originalProject.color,
        default_hourly_rate: (originalProject as { default_hourly_rate?: number | null }).default_hourly_rate ?? 0,
      })
      .select("*, regions(*), object_types(*)")
      .single();

    if (createError || !newProject) {
      logger.error("Error creating project copy", { projectId }, createError);
      return { error: "Nie udało się utworzyć kopii projektu" };
    }

    if (originalItems && originalItems.length > 0) {
      const idMapping: Record<string, string> = {};

      const itemsToInsert = originalItems.map((item) => {
        const newId = crypto.randomUUID();
        idMapping[item.id] = newId;
        return {
          id: newId,
          project_id: newProject.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          material_price: item.material_price,
          labor_price: item.labor_price,
          final_material_price: item.final_material_price,
          final_labor_price: item.final_labor_price,
          sort_order: item.sort_order,
          catalog_item_id: item.catalog_item_id,
          is_custom: item.is_custom,
          is_ai_generated: item.is_ai_generated,
          is_assembly_child: item.is_assembly_child || false,
          section: item.section || null,
          parent_assembly_id: null,
        };
      });

      const { error: insertError } = await supabase.from("project_items").insert(itemsToInsert);
      if (insertError) {
        logger.error("Error copying project items", { projectId }, insertError);
      }

      const itemsWithParent = originalItems.filter(item => item.parent_assembly_id);
      for (const item of itemsWithParent) {
        const newId = idMapping[item.id];
        const newParentId = idMapping[item.parent_assembly_id];
        if (newId && newParentId) {
          await supabase
            .from("project_items")
            .update({ parent_assembly_id: newParentId })
            .eq("id", newId);
        }
      }
    }

    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard");
    return { project: newProject as ProjectWithRelations };
  } catch (error) {
    logger.error("Error duplicating project", { projectId }, error);
    return { error: "Wystąpił nieoczekiwany błąd" };
  }
}

// Update project default hourly rate (stawka r-g)
export async function updateHourlyRate(
  projectId: string,
  hourlyRate: number
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  if (hourlyRate < 0 || hourlyRate > 9999) return { error: "Nieprawidłowa stawka" };

  const { error } = await supabase
    .from("projects")
    .update({ default_hourly_rate: hourlyRate })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating hourly rate", { projectId }, error);
    return { error: "Błąd podczas aktualizacji stawki" };
  }

  await supabase
    .from("profiles")
    .update({ hourly_rate: hourlyRate, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidateProject(projectId);
  return { success: true };
}

// Toggle "show labor hours in PDF" setting
export async function toggleLaborHoursInPdf(
  projectId: string,
  enabled: boolean
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień" };

  const { error } = await supabase
    .from("projects")
    .update({ show_labor_hours_in_pdf: enabled })
    .eq("id", projectId);

  if (error) {
    logger.error("Error toggling labor hours PDF", { projectId }, error);
    return { error: "Błąd podczas aktualizacji ustawienia" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project document output settings (Pult 5-w-1)
// Iron Rule: These flags control PDF/Portal OUTPUT only — internal editor is never affected.
export async function updateProjectDocSettings(
  projectId: string,
  settings: {
    show_knr?: boolean;
    brutto_mode?: boolean;
    expert_coloring?: boolean;
    show_labor_hours_in_pdf?: boolean;
  }
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do tego projektu" };

  const { error } = await supabase
    .from("projects")
    .update(settings)
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating doc settings", { projectId }, error);
    return { error: "Błąd podczas zapisywania ustawień dokumentu" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project-level KNR pricing overrides (Sprint v1.2+)
// NULL value for a field means "use global profile setting" (no override)
export async function updateProjectPricingOverrides(
  projectId: string,
  overrides: {
    coeff_height?:     boolean | null;
    coeff_difficulty?: boolean | null;
    coeff_surface?:    boolean | null;
  }
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do tego projektu" };

  // Build the JSONB object — only include keys that are explicitly set (non-undefined)
  // Passing null for a key removes the project override and falls back to global settings
  const payload: Record<string, boolean | null> = {};
  if (overrides.coeff_height     !== undefined) payload.coeff_height     = overrides.coeff_height;
  if (overrides.coeff_difficulty !== undefined) payload.coeff_difficulty = overrides.coeff_difficulty;
  if (overrides.coeff_surface    !== undefined) payload.coeff_surface    = overrides.coeff_surface;

  const { error } = await supabase
    .from("projects")
    .update({ pricing_overrides: Object.keys(payload).length > 0 ? payload : null })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project pricing overrides", { projectId }, error);
    return { error: "Błąd podczas zapisywania ustawień kalkulacji" };
  }

  revalidateProject(projectId);
  return { success: true };
}

// Update project PDF notes (Uwagi do kosztorysu)
export async function updateProjectPdfNotes(projectId: string, notes: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const canEdit = await canUserEditProject(supabase, projectId, user.id);
  if (!canEdit) return { error: "Nie masz uprawnień do tego projektu" };

  const { error } = await supabase
    .from("projects")
    .update({ pdf_notes: notes })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating pdf notes", { projectId }, error);
    return { error: "Błąd podczas zapisywania uwag" };
  }

  return { success: true };
}
