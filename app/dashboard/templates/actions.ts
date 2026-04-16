"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
// requirePro removed — demo users can access all features
import { templateUpdateSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";

export type ProjectTemplate = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  region_id: string | null;
  object_type_id: string | null;
  vat_rate: number;
  rate_source: string;
  items: TemplateItem[];
  is_public: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export type TemplateItem = {
  name: string;
  unit: string;
  quantity: number;
  final_material_price: number;
  final_labor_price: number;
  catalog_item_id?: string | null;
  section?: string | null;
};

/**
 * Get all templates for current user
 */
export async function getTemplates(): Promise<ProjectTemplate[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order("use_count", { ascending: false });

  if (error) {
    logger.error("Error fetching templates", {}, error);
    return [];
  }

  return (data || []) as ProjectTemplate[];
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(templateId: string): Promise<ProjectTemplate | null> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) {
    logger.error("Error fetching template", { templateId }, error);
    return null;
  }

  return data as ProjectTemplate;
}

/**
 * Save current project as a template
 */
export async function saveProjectAsTemplate(
  projectId: string,
  templateName: string,
  templateDescription?: string
): Promise<{ success?: boolean; error?: string; templateId?: string }> {
 
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  if (!templateName || templateName.trim().length === 0) {
    return { error: "Nazwa szablonu jest wymagana" };
  }

  // Fetch the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    return { error: "Nie znaleziono projektu" };
  }

  // Fetch project items
  const { data: items, error: itemsError } = await supabase
    .from("project_items")
    .select("name, unit, quantity, final_material_price, final_labor_price, catalog_item_id, section")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    logger.error("Error fetching project items", { projectId }, itemsError);
    return { error: "Błąd podczas pobierania pozycji projektu" };
  }

  // Create template
  const { data: template, error: templateError } = await supabase
    .from("project_templates")
    .insert({
      user_id: user.id,
      name: templateName.trim(),
      description: templateDescription?.trim() || null,
      region_id: project.region_id,
      object_type_id: project.object_type_id,
      vat_rate: project.vat_rate,
      rate_source: project.rate_source || "engine",
      items: items || [],
      is_public: false, // CRITICAL: user templates are private by default
    })
    .select()
    .single();

  if (templateError) {
    logger.error("Error creating template", { templateName }, templateError);
    return { error: "Błąd podczas tworzenia szablonu" };
  }

  revalidatePath("/dashboard/templates");
  return { success: true, templateId: template.id };
}

/**
 * Create a new project from a template
 */
export async function createProjectFromTemplate(
  templateId: string,
  projectName: string
): Promise<{ success?: boolean; error?: string; projectId?: string }> {
 
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  if (!projectName || projectName.trim().length === 0) {
    return { error: "Nazwa projektu jest wymagana" };
  }

  const { data: profileForRate } = await supabase
    .from("profiles")
    .select("hourly_rate, is_pro, max_projects")
    .eq("id", user.id)
    .single();
  const defaultHourlyRate = (profileForRate as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

  // v2.0: free tier — limit tylko jeśli admin jawnie ustawił niski limit (<100).
  {
    const maxAllowed = getEffectiveMaxProjects(profileForRate as { is_pro?: boolean; max_projects?: number } | null);
    if (profileForRate && !profileForRate.is_pro && maxAllowed < 100) {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count !== null && count >= maxAllowed) {
        return {
          error: `Dla Twojego konta obowiązuje limit ${maxAllowed} projektów. Przejdź na PRO, aby tworzyć nielimitowane projekty.`,
        };
      }
    }
  }

  // Fetch the template
  const { data: template, error: templateError } = await supabase
    .from("project_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return { error: "Nie znaleziono szablonu" };
  }

  // Create new project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: projectName.trim(),
      region_id: template.region_id,
      object_type_id: template.object_type_id,
      vat_rate: template.vat_rate,
      rate_source: template.rate_source,
      status: "draft",
      default_hourly_rate: defaultHourlyRate,
    })
    .select()
    .single();

  if (projectError || !project) {
    logger.error("Error creating project from template", { templateId, projectName }, projectError);
    return { error: "Błąd podczas tworzenia projektu" };
  }

  // Insert template items into project
  const templateItems = (template.items as TemplateItem[]) || [];
  
  if (templateItems.length > 0) {
    const projectItems = templateItems.map((item, index) => ({
      project_id: project.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      final_material_price: item.final_material_price,
      final_labor_price: item.final_labor_price,
      catalog_item_id: item.catalog_item_id || null,
      section: item.section || null,
      sort_order: index + 1,
    }));

    const { error: itemsError } = await supabase
      .from("project_items")
      .insert(projectItems);

    if (itemsError) {
      logger.error("Error inserting project items", { templateId, projectName }, itemsError);
      // Project created but items failed - continue anyway
    }
  }

  // Increment template use count
  await supabase
    .from("project_templates")
    .update({ use_count: (template.use_count || 0) + 1 })
    .eq("id", templateId);

  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  updates: { name?: string; description?: string }
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error: validationError } = validate(templateUpdateSchema, updates);
  if (validationError) return { error: validationError };

  const { error } = await supabase
    .from("project_templates")
    .update({
      name: updates.name?.trim(),
      description: updates.description?.trim(),
    })
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating template", { templateId }, error);
    return { error: "Błąd podczas aktualizacji szablonu" };
  }

  revalidatePath("/dashboard/templates");
  return { success: true };
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(
  templateId: string
): Promise<{ success?: boolean; error?: string; templateId?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  // Fetch the template
  const { data: template, error: templateError } = await supabase
    .from("project_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return { error: "Nie znaleziono szablonu" };
  }

  // Create duplicate
  const { data: newTemplate, error: duplicateError } = await supabase
    .from("project_templates")
    .insert({
      user_id: user.id,
      name: `${template.name} (kopia)`,
      description: template.description,
      region_id: template.region_id,
      object_type_id: template.object_type_id,
      vat_rate: template.vat_rate,
      rate_source: template.rate_source,
      items: template.items,
      is_public: false, // User duplicates are always private
    })
    .select()
    .single();

  if (duplicateError) {
    logger.error("Error duplicating template", { templateId }, duplicateError);
    return { error: "Błąd podczas duplikowania szablonu" };
  }

  revalidatePath("/dashboard/templates");
  return { success: true, templateId: newTemplate.id };
}

/**
 * Delete a template
 */
export async function deleteTemplate(
  templateId: string
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("project_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting template", { templateId }, error);
    return { error: "Błąd podczas usuwania szablonu" };
  }

  revalidatePath("/dashboard/templates");
  return { success: true };
}
