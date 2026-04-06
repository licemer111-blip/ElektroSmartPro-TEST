"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ── Assembly Categories ───────────────────────────────────────────────────────

export async function createAssemblyCategory(name: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Nazwa kategorii nie może być pusta" };
  const { data: existing } = await supabase
    .from("assembly_categories").select("id").eq("user_id", user.id).ilike("name", trimmedName);
  if (existing && existing.length > 0) return { error: "Kategoria o tej nazwie już istnieje" };
  const { data, error } = await supabase
    .from("assembly_categories").insert({ user_id: user.id, name: trimmedName }).select().single();
  if (error) { logger.error("Error creating assembly category", {}, error); return { error: "Błąd podczas tworzenia kategorii" }; }
  revalidatePath("/dashboard/assemblies");
  return { success: true, data };
}

export async function updateAssemblyCategory(categoryId: string, name: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Nazwa kategorii nie może być pusta" };
  const { data: existing } = await supabase
    .from("assembly_categories").select("id").eq("user_id", user.id).ilike("name", trimmedName).neq("id", categoryId);
  if (existing && existing.length > 0) return { error: "Kategoria o tej nazwie już istnieje" };
  const { error } = await supabase
    .from("assembly_categories").update({ name: trimmedName }).eq("id", categoryId).eq("user_id", user.id);
  if (error) { logger.error("Error updating assembly category", { categoryId }, error); return { error: "Błąd podczas aktualizacji kategorii" }; }
  revalidatePath("/dashboard/assemblies");
  return { success: true };
}

export async function deleteAssemblyCategory(categoryId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const { data: assemblies, error: checkError } = await supabase
    .from("user_assemblies").select("id").eq("category_id", categoryId).limit(1);
  if (checkError) { logger.error("Error checking assemblies in category", { categoryId }, checkError); return { error: "Błąd podczas sprawdzania kategorii" }; }
  if (assemblies && assemblies.length > 0) return { error: "Nie można usunąć kategorii zawierającej zestawy. Najpierw przenieś lub usuń zestawy." };
  const { error } = await supabase
    .from("assembly_categories").delete().eq("id", categoryId).eq("user_id", user.id);
  if (error) { logger.error("Error deleting assembly category", { categoryId }, error); return { error: "Błąd podczas usuwania kategorii" }; }
  revalidatePath("/dashboard/assemblies");
  return { success: true };
}

export async function moveAssemblyToCategory(assemblyId: string, categoryId: string | null) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (categoryId) {
    const { data: category, error: catError } = await supabase
      .from("assembly_categories").select("id").eq("id", categoryId).eq("user_id", user.id).single();
    if (catError || !category) return { error: "Kategoria nie istnieje" };
  }
  const { error } = await supabase
    .from("user_assemblies").update({ category_id: categoryId }).eq("id", assemblyId).eq("user_id", user.id);
  if (error) { logger.error("Error moving assembly to category", { assemblyId, categoryId }, error); return { error: "Błąd podczas przenoszenia zestawu" }; }
  revalidatePath("/dashboard/assemblies");
  return { success: true };
}

// ── Project Categories ────────────────────────────────────────────────────────

export async function createProjectCategory(name: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Nazwa kategorii nie może być pusta" };
  const { data: existing } = await supabase
    .from("project_categories").select("id").eq("user_id", user.id).ilike("name", trimmedName);
  if (existing && existing.length > 0) return { error: "Kategoria o tej nazwie już istnieje" };
  const { data, error } = await supabase
    .from("project_categories").insert({ user_id: user.id, name: trimmedName }).select().single();
  if (error) { logger.error("Error creating project category", {}, error); return { error: "Błąd podczas tworzenia kategorii" }; }
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateProjectCategory(categoryId: string, name: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Nazwa kategorii nie może być pusta" };
  const { data: existing } = await supabase
    .from("project_categories").select("id").eq("user_id", user.id).ilike("name", trimmedName).neq("id", categoryId);
  if (existing && existing.length > 0) return { error: "Kategoria o tej nazwie już istnieje" };
  const { error } = await supabase
    .from("project_categories").update({ name: trimmedName }).eq("id", categoryId).eq("user_id", user.id);
  if (error) { logger.error("Error updating project category", { categoryId }, error); return { error: "Błąd podczas aktualizacji kategorii" }; }
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProjectCategory(categoryId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  const { data: projects, error: checkError } = await supabase
    .from("projects").select("id").eq("category_id", categoryId).limit(1);
  if (checkError) { logger.error("Error checking projects in category", { categoryId }, checkError); return { error: "Błąd podczas sprawdzania kategorii" }; }
  if (projects && projects.length > 0) return { error: "Nie można usunąć kategorii zawierającej projekty. Najpierw przenieś lub usuń projekty." };
  const { error } = await supabase
    .from("project_categories").delete().eq("id", categoryId).eq("user_id", user.id);
  if (error) { logger.error("Error deleting project category", { categoryId }, error); return { error: "Błąd podczas usuwania kategorii" }; }
  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveProjectToCategory(projectId: string, categoryId: string | null) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };
  if (categoryId) {
    const { data: category, error: catError } = await supabase
      .from("project_categories").select("id").eq("id", categoryId).eq("user_id", user.id).single();
    if (catError || !category) return { error: "Kategoria nie istnieje" };
  }
  const { error } = await supabase
    .from("projects").update({ category_id: categoryId }).eq("id", projectId).eq("user_id", user.id);
  if (error) { logger.error("Error moving project to category", { projectId, categoryId }, error); return { error: "Błąd podczas przenoszenia projektu" }; }
  revalidatePath("/dashboard");
  return { success: true };
}
