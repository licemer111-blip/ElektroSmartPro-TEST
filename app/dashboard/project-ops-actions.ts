"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { tryAuth } from "@/lib/auth";
import { projectSettingsSchema, validate } from "@/lib/validations";
import type { Region, ObjectType, ProjectWithRelations } from "@/lib/types/database";
import { logger } from "@/lib/logger";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";

export async function getProjects(): Promise<ProjectWithRelations[]> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) redirect("/login");

  const { data: allProjects, error } = await supabase
    .from("projects")
    .select(`
      *,
      regions ( id, name, slug, price_modifier ),
      object_types ( id, name, slug, default_vat_rate ),
      project_members ( role, status )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching projects", {}, error);
    return [];
  }

  const projects = (allProjects || []) as ProjectWithRelations[];

  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id);

    const [countResult, offerLinksResult] = await Promise.all([
      supabase
        .from("project_items")
        .select("project_id, section, is_assembly_child, material_price, labor_price, confidence_level")
        .in("project_id", projectIds),
      supabase
        .from("offer_links")
        .select("project_id, status")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false }),
    ]);

    if (countResult.data) {
      const countsMap = new Map<string, { items: number; sections: Set<string>; unpriced: number }>();
      countResult.data.forEach((item) => {
        if (item.is_assembly_child) return;
        const entry = countsMap.get(item.project_id) || { items: 0, sections: new Set<string>(), unpriced: 0 };
        entry.items++;
        if (item.section) entry.sections.add(item.section);
        const totalPrice = (item.material_price ?? 0) + (item.labor_price ?? 0);
        const isUnpriced = totalPrice <= 1 && item.confidence_level !== "manual";
        if (isUnpriced) entry.unpriced++;
        countsMap.set(item.project_id, entry);
      });
      projects.forEach((p) => {
        const counts = countsMap.get(p.id);
        p.item_count = counts?.items || 0;
        p.section_count = counts?.sections.size || 0;
        p.unpriced_count = counts?.unpriced || 0;
      });
    }

    if (offerLinksResult.data) {
      // Pick the most recent link status per project (priority: negotiating > pending > viewed > accepted > rejected)
      const STATUS_PRIORITY: Record<string, number> = {
        negotiating: 5, pending: 4, viewed: 3, accepted: 2, rejected: 1,
      };
      const offerStatusMap = new Map<string, string>();
      offerLinksResult.data.forEach((link) => {
        const current = offerStatusMap.get(link.project_id);
        const newPriority = STATUS_PRIORITY[link.status] ?? 0;
        const currentPriority = current ? (STATUS_PRIORITY[current] ?? 0) : -1;
        if (newPriority > currentPriority) {
          offerStatusMap.set(link.project_id, link.status);
        }
      });
      projects.forEach((p) => {
        const status = offerStatusMap.get(p.id);
        p.offer_link_status = (status as ProjectWithRelations["offer_link_status"]) ?? null;
      });
    }
  }

  return projects;
}

export async function getRegions(): Promise<Region[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      logger.error("Error fetching regions", {}, error);
      return [];
    }
    return (data as Region[]) || [];
  } catch (err) {
    logger.error("Unexpected error fetching regions", {}, err);
    return [];
  }
}

export async function getObjectTypes(): Promise<ObjectType[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("object_types")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      logger.error("Error fetching object types", {}, error);
      return [];
    }
    return (data as ObjectType[]) || [];
  } catch (err) {
    logger.error("Unexpected error fetching object types", {}, err);
    return [];
  }
}

export async function createProject(formData: FormData) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_pro, max_projects, hourly_rate, default_region_id")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code === "PGRST116") {
    const { error: insertError } = await supabase.from("profiles").upsert({
      id: user.id,
      is_pro: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (insertError) {
      logger.error("Failed to create profile during project creation", {}, insertError);
      return { error: "Błąd inicjalizacji profilu. Spróbuj ponownie lub skontaktuj się z administratorem." };
    }
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("is_pro, max_projects, hourly_rate, default_region_id")
      .eq("id", user.id)
      .single();
    profile = newProfile;
  }

  // v2.0: free tier ma praktycznie nielimitowane projekty (FREE_TIER_MAX_PROJECTS=999).
  // Admin może w DB ustawić konkretny limit per-user — getEffectiveMaxProjects to honoruje.
  const maxAllowed = getEffectiveMaxProjects(profile as { is_pro?: boolean; max_projects?: number } | null);
  if (profile && !profile.is_pro && maxAllowed < 100) {
    // Enforce tylko kiedy admin jawnie ustawił niski limit dla tego konta.
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (count !== null && count >= maxAllowed) {
      return {
        error: `Dla Twojego konta obowiązuje limit ${maxAllowed} projektów. Usuń istniejący projekt lub przejdź na PRO.`,
        requiresUpgrade: true,
      };
    }
  }

  const name = formData.get("name") as string;
  const object_type_id = formData.get("object_type_id") as string;
  const vat_rate = parseInt(formData.get("vat_rate") as string) || 8;
  const client_name = (formData.get("client_name") as string) || null;
  const client_address = (formData.get("client_address") as string) || null;
  const client_nip = (formData.get("client_nip") as string) || null;

  if (!name || name.trim().length === 0) return { error: "Nazwa projektu jest wymagana" };
  if (!object_type_id) return { error: "Wybierz typ obiektu" };
  if (name.length > 100) return { error: "Nazwa projektu jest zbyt długa (max 100 znaków)" };

  // Auto-resolve region: use profile default (UUID or slug) → look up UUID in regions table
  const profileDefaultRegion = (profile as { default_region_id?: string | null } | null)?.default_region_id ?? null;
  let resolvedRegionId: string | null = null;
  if (profileDefaultRegion) {
    const { data: regionRow } = await supabase
      .from("regions")
      .select("id")
      .or(`id.eq.${profileDefaultRegion},slug.eq.${profileDefaultRegion}`)
      .maybeSingle();
    resolvedRegionId = regionRow?.id ?? null;
  }

  const defaultHourlyRate = (profile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: name.trim(),
      region_id: resolvedRegionId,
      object_type_id,
      vat_rate,
      client_name: client_name?.trim() || null,
      client_address: client_address?.trim() || null,
      client_nip: client_nip?.trim() || null,
      default_hourly_rate: defaultHourlyRate,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating project", { code: error.code, details: error.details }, error);
    if (error.code === "42501") return { error: "Brak uprawnień do tworzenia projektu. Skontaktuj się z administratorem." };
    if (error.code === "23503") return { error: "Nieprawidłowe województwo lub typ obiektu. Odśwież stronę i spróbuj ponownie." };
    if (error.code === "23505") return { error: "Projekt o tej nazwie już istnieje" };
    if (error.message?.includes("JWT")) return { error: "Sesja wygasła. Zaloguj się ponownie." };
    return { error: `Błąd podczas tworzenia projektu: ${error.message || "nieznany błąd"}` };
  }

  revalidatePath("/dashboard");
  return { success: true, project: data };
}

export async function duplicateProject(projectId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  // v2.0: patrz createProject — limit tylko gdy admin explicit ustawił <100.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, max_projects")
    .eq("id", user.id)
    .single();
  {
    const maxAllowed = getEffectiveMaxProjects(profile as { is_pro?: boolean; max_projects?: number } | null);
    if (profile && !profile.is_pro && maxAllowed < 100) {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count !== null && count >= maxAllowed) {
        return {
          error: `Dla Twojego konta obowiązuje limit ${maxAllowed} projektów. Usuń istniejący projekt lub przejdź na PRO.`,
          requiresUpgrade: true,
        };
      }
    }
  }

  const { data: originalProject, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !originalProject) {
    logger.error("Error fetching project for duplication", { projectId }, fetchError);
    return { error: "Nie znaleziono projektu lub brak uprawnień" };
  }

  const { data: projectItems, error: itemsError } = await supabase
    .from("project_items")
    .select("*")
    .eq("project_id", projectId);

  if (itemsError) {
    logger.error("Error fetching project items for duplication", { projectId }, itemsError);
    return { error: "Błąd podczas pobierania pozycji projektu" };
  }

  const { data: newProject, error: createError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: `(Kopia) ${originalProject.name}`,
      status: "draft",
      region_id: originalProject.region_id,
      object_type_id: originalProject.object_type_id,
      vat_rate: originalProject.vat_rate,
      rate_source: originalProject.rate_source,
      adjustment_percentage: originalProject.adjustment_percentage,
      materials_owned_by_customer: originalProject.materials_owned_by_customer,
      client_name: originalProject.client_name,
      client_address: originalProject.client_address,
      client_nip: originalProject.client_nip,
      pdf_notes: originalProject.pdf_notes,
      default_hourly_rate: (originalProject as { default_hourly_rate?: number | null }).default_hourly_rate ?? 0,
    })
    .select()
    .single();

  if (createError || !newProject) {
    logger.error("Error creating duplicate project", { projectId }, createError);
    return { error: "Błąd podczas tworzenia kopii projektu" };
  }

  if (projectItems && projectItems.length > 0) {
    const idMapping: Record<string, string> = {};
    const newItems = projectItems.map((item) => {
      const newId = crypto.randomUUID();
      idMapping[item.id] = newId;
      return {
        id: newId,
        project_id: newProject.id,
        catalog_item_id: item.catalog_item_id,
        assembly_id: item.assembly_id,
        name: item.name,
        description: item.description,
        notes: item.notes ?? null,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        material_price: item.material_price,
        labor_price: item.labor_price,
        final_material_price: item.final_material_price,
        final_labor_price: item.final_labor_price,
        price_min: item.price_min,
        price_max: item.price_max,
        is_from_assembly: item.is_from_assembly,
        assembly_name: item.assembly_name,
        is_custom: item.is_custom,
        is_ai_generated: item.is_ai_generated,
        is_assembly_child: item.is_assembly_child ?? false,
        sort_order: item.sort_order,
        section: item.section ?? null,
        knr_code: item.knr_code ?? null,
        knr_source: item.knr_source ?? null,
        confidence_level: item.confidence_level ?? null,
        confidence_note: item.confidence_note ?? null,
        labor_norm: item.labor_norm ?? null,
        labor_hours_total: item.labor_hours_total ?? null,
        origin_id: null,
        origin_type: null,
        parent_assembly_id: null,
      };
    });

    const { error: itemsInsertError } = await supabase.from("project_items").insert(newItems);
    if (itemsInsertError) {
      logger.error("Error copying items to duplicate project", { projectId, newProjectId: newProject.id }, itemsInsertError);
      return { success: true, projectId: newProject.id, warning: "Projekt skopiowany, ale wystąpił błąd podczas kopiowania pozycji" };
    }

    const itemsWithParent = projectItems.filter((item) => item.parent_assembly_id);
    for (const item of itemsWithParent) {
      const newId = idMapping[item.id];
      const newParentId = idMapping[item.parent_assembly_id];
      if (newId && newParentId) {
        await supabase.from("project_items").update({ parent_assembly_id: newParentId }).eq("id", newId);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, projectId: newProject.id, message: `Projekt skopiowany pomyślnie: ${newProject.name}` };
}

export async function deleteProject(projectId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Nie masz uprawnień do usunięcia tego projektu" };
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) {
    logger.error("Error deleting project", { projectId }, error);
    return { error: "Błąd podczas usuwania projektu" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProjectSettings(
  projectId: string,
  settings: { name: string; vat_rate: number; region_id: string | null; object_type_id: string | null }
) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const { error: validationError } = validate(projectSettingsSchema, settings);
  if (validationError) return { error: validationError };

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Nie masz uprawnień do edycji tego projektu" };
  }

  // Iron Rule: VAT rate is ALWAYS the user's sovereign choice.
  // No automatic override based on object_type — the professional decides.
  const { error } = await supabase
    .from("projects")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    logger.error("Error updating project settings", { projectId }, error);
    return { error: "Błąd podczas zapisywania ustawień" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function bulkDeleteProjects(
  projectIds: string[]
): Promise<{ success?: boolean; error?: string; deletedCount?: number }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!projectIds || projectIds.length === 0) return { error: "Nie wybrano projektów" };

  const { error: itemsError } = await supabase
    .from("project_items")
    .delete()
    .in("project_id", projectIds);
  if (itemsError) logger.error("Error deleting project items during bulk delete", { projectIds }, itemsError);

  const { data, error } = await supabase
    .from("projects")
    .delete()
    .in("id", projectIds)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    logger.error("Error bulk deleting projects", { projectIds }, error);
    return { error: "Błąd podczas usuwania projektów" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, deletedCount: data?.length || 0 };
}

export async function bulkArchiveProjects(
  projectIds: string[]
): Promise<{ success?: boolean; error?: string; archivedCount?: number }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!projectIds || projectIds.length === 0) return { error: "Nie wybrano projektów" };

  const { data, error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .in("id", projectIds)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    logger.error("Error bulk archiving projects", { projectIds }, error);
    return { error: "Błąd podczas archiwizowania projektów" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, archivedCount: data?.length || 0 };
}

export async function bulkRestoreProjects(
  projectIds: string[]
): Promise<{ success?: boolean; error?: string; restoredCount?: number }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!projectIds || projectIds.length === 0) return { error: "Nie wybrano projektów" };

  const { data, error } = await supabase
    .from("projects")
    .update({ status: "draft" })
    .in("id", projectIds)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    logger.error("Error bulk restoring projects", { projectIds }, error);
    return { error: "Błąd podczas przywracania projektów" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, restoredCount: data?.length || 0 };
}

export async function bulkMoveToCategory(
  projectIds: string[],
  categoryId: string | null
): Promise<{ success?: boolean; error?: string; movedCount?: number }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (!projectIds || projectIds.length === 0) return { error: "Nie wybrano projektów" };

  const { data, error } = await supabase
    .from("projects")
    .update({ category_id: categoryId })
    .in("id", projectIds)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    logger.error("Error bulk moving projects", { projectIds, categoryId }, error);
    return { error: "Błąd podczas przenoszenia projektów" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, movedCount: data?.length || 0 };
}

export async function createDemoProject(): Promise<{ success?: boolean; error?: string; projectId?: string }> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  // Free-tier limit check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, max_projects")
    .eq("id", user.id)
    .single();
  const maxAllowed = (profile as { is_pro: boolean; max_projects?: number } | null)?.max_projects ?? 3;
  if (profile && !profile.is_pro) {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (count !== null && count >= maxAllowed) {
      return { error: "Osiągnięto limit projektów. Usuń istniejący projekt lub przejdź na PRO.", };
    }
  }

  // Resolve region + object_type dynamically (IDs differ between envs)
  const [{ data: regionData }, { data: objTypeData }] = await Promise.all([
    supabase.from("regions").select("id").eq("slug", "mazowieckie").single(),
    supabase.from("object_types").select("id").eq("slug", "mieszkanie").single(),
  ]);

  const regionId = (regionData as { id: string } | null)?.id;
  const objectTypeId = (objTypeData as { id: string } | null)?.id;
  if (!regionId || !objectTypeId) return { error: "Błąd konfiguracji bazy — brak regionów lub typów obiektów" };

  // Create project
  const { data: project, error: projError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: "DEMO — Instalacja Elektryczna Dom 150m²",
      region_id: regionId,
      object_type_id: objectTypeId,
      vat_rate: 8,
      client_name: "Jan Kowalski",
      client_address: "ul. Przykładowa 12, 00-001 Warszawa",
      status: "draft",
      default_hourly_rate: 0,
      is_demo_project: true,
    })
    .select("id")
    .single();

  if (projError || !project) {
    logger.error("Demo project creation failed", {}, projError);
    return { error: "Błąd podczas tworzenia projektu demonstracyjnego" };
  }

  // Seed demo items — realistic residential installation
  const demoItems = [
    { name: "Punkt elektryczny gniazdo 230V", unit: "pkt", quantity: 32, material_price: 28, labor_price: 38, section: "Instalacja gniazd" },
    { name: "Punkt elektryczny oświetlenie", unit: "pkt", quantity: 24, material_price: 18, labor_price: 32, section: "Instalacja oświetlenia" },
    { name: "Przewód YDYp 3x2.5mm²", unit: "mb", quantity: 180, material_price: 4.80, labor_price: 2.20, section: "Okablowanie" },
    { name: "Przewód YDYp 3x1.5mm²", unit: "mb", quantity: 120, material_price: 3.20, labor_price: 1.80, section: "Okablowanie" },
    { name: "Przewód YDYp 5x2.5mm²", unit: "mb", quantity: 40, material_price: 7.50, labor_price: 2.80, section: "Okablowanie" },
    { name: "Rozdzielnica natynkowa 24-modułowa", unit: "szt", quantity: 1, material_price: 180, labor_price: 240, section: "Rozdzielnica" },
    { name: "Wyłącznik nadprądowy B16A 1P", unit: "szt", quantity: 8, material_price: 18, labor_price: 12, section: "Rozdzielnica" },
    { name: "Wyłącznik nadprądowy B10A 1P", unit: "szt", quantity: 6, material_price: 16, labor_price: 12, section: "Rozdzielnica" },
    { name: "Wyłącznik różnicowoprądowy 40A/30mA 4P", unit: "szt", quantity: 1, material_price: 280, labor_price: 60, section: "Rozdzielnica" },
    { name: "Puszka instalacyjna podtynkowa 60mm", unit: "szt", quantity: 56, material_price: 2.50, labor_price: 4.50, section: "Puszki i osprzęt" },
    { name: "Gniazdo podwójne 230V z uziemieniem", unit: "szt", quantity: 32, material_price: 14, labor_price: 0, section: "Puszki i osprzęt" },
    { name: "Łącznik jednobiegunowy", unit: "szt", quantity: 12, material_price: 12, labor_price: 0, section: "Puszki i osprzęt" },
    { name: "Oprawa LED sufitowa podtynkowa", unit: "szt", quantity: 24, material_price: 45, labor_price: 22, section: "Instalacja oświetlenia" },
    { name: "Bruzda w ścianie ceglanej", unit: "mb", quantity: 180, material_price: 0, labor_price: 8.50, section: "Roboty budowlane" },
    { name: "Przebicie przez ścianę/strop", unit: "szt", quantity: 14, material_price: 0, labor_price: 35, section: "Roboty budowlane" },
    { name: "Uziom otokowy poziomy", unit: "mb", quantity: 40, material_price: 12, labor_price: 15, section: "Uziemienie" },
    { name: "Tablica licznikowa z licznikiem 3-fazowym", unit: "kpl", quantity: 1, material_price: 420, labor_price: 180, section: "Przyłącze" },
    { name: "Pomiary i odbiór instalacji elektrycznej", unit: "kpl", quantity: 1, material_price: 0, labor_price: 450, section: "Pomiary" },
  ];

  const itemsToInsert = demoItems.map((item, idx) => ({
    project_id: project.id,
    user_id: user.id,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    material_price: item.material_price,
    labor_price: item.labor_price,
    section: item.section,
    sort_order: idx,
    confidence_level: "manual" as const,
  }));

  const { error: itemsError } = await supabase.from("project_items").insert(itemsToInsert);
  if (itemsError) {
    logger.error("Demo project items insert failed", {}, itemsError);
    // Project created but items failed — still redirect, user can add manually
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true, projectId: project.id };
}
