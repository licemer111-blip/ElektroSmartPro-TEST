"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createAssemblySchema, updateAssemblySchema, validate } from "@/lib/validations";
import type {
  UserAssembly,
  UserAssemblyWithItems,
  UnitType,
  DataVisibility,
} from "@/lib/types/database";

export interface CreateAssemblyItemInput {
  name: string;
  unit: UnitType;
  type: "material" | "labor";
  price: number;
  quantity: number;
  sort_order?: number;
}

export interface CreateAssemblyInput {
  name: string;
  description?: string;
  category_id?: string | null;
  building_type?: string | null;
  items: CreateAssemblyItemInput[];
  visibility?: DataVisibility;
  team_id?: string;
}

export interface UpdateAssemblyInput {
  name?: string;
  description?: string;
  category_id?: string | null;
  building_type?: string | null;
  items?: CreateAssemblyItemInput[];
  visibility?: DataVisibility;
  team_id?: string;
}

export async function getUserAssemblies(
  visibilityFilter?: "all" | "personal" | "team"
): Promise<UserAssemblyWithItems[]> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      logger.error("No authenticated user in getUserAssemblies");
      redirect("/login");
    }

    const { data: teamMembership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    const teamId = teamMembership?.team_id;

    let query = supabase
      .from("user_assemblies")
      .select(`
        *,
        user_assembly_items (
          id, assembly_id, name, unit, type, price, quantity, sort_order
        )
      `)
      .order("created_at", { ascending: false });

    if (visibilityFilter === "personal") {
      query = query.eq("user_id", user.id).eq("visibility", "personal");
    } else if (visibilityFilter === "team" && teamId) {
      query = query.eq("team_id", teamId).eq("visibility", "team");
    } else {
      if (teamId) {
        query = query.or(`user_id.eq.${user.id},and(visibility.eq.team,team_id.eq.${teamId})`);
      } else {
        query = query.eq("user_id", user.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching assemblies", {}, error);
      return [];
    }

    return (data || []).map((assembly) => ({
      ...assembly,
      user_assembly_items: (assembly.user_assembly_items || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    })) as UserAssemblyWithItems[];
  } catch (err) {
    logger.error("Unexpected error in getUserAssemblies", {}, err);
    return [];
  }
}

export async function getUserAssemblyById(
  assemblyId: string
): Promise<UserAssemblyWithItems | null> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return null;

    const { data, error } = await supabase
      .from("user_assemblies")
      .select(`*, user_assembly_items (id, assembly_id, name, unit, type, price, quantity, sort_order)`)
      .eq("id", assemblyId)
      .eq("user_id", user.id)
      .single();

    if (error) { logger.error("Error fetching assembly by ID", { assemblyId }, error); return null; }

    if (data?.user_assembly_items) {
      data.user_assembly_items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    }
    return data as UserAssemblyWithItems;
  } catch (err) {
    logger.error("Unexpected error in getUserAssemblyById", { assemblyId }, err);
    return null;
  }
}

export async function createUserAssembly(input: CreateAssemblyInput) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { error: validationError } = validate(createAssemblySchema, input);
    if (validationError) return { error: validationError };

    if (!input.name?.trim()) return { error: "Nazwa zestawu jest wymagana" };
    if (input.name.length > 200) return { error: "Nazwa zestawu jest zbyt długa (max 200 znaków)" };
    if (!input.items?.length) return { error: "Zestaw musi zawierać co najmniej jeden element" };

    for (const item of input.items) {
      if (!item.name?.trim()) return { error: "Wszystkie elementy muszą mieć nazwę" };
      if (!item.unit?.trim()) return { error: "Wszystkie elementy muszą mieć jednostkę" };
      if (!["material", "labor"].includes(item.type)) return { error: "Typ elementu musi być 'material' lub 'labor'" };
      if (item.price < 0) return { error: "Cena nie może być ujemna" };
      if (item.quantity <= 0) return { error: "Ilość musi być większa od zera" };
    }

    const assemblyInsertData: Record<string, unknown> = {
      user_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      building_type: input.building_type || "Dom",
      visibility: input.visibility || "personal",
    };
    if (input.visibility === "team" && input.team_id) {
      assemblyInsertData.team_id = input.team_id;
    }

    const { data: assembly, error: assemblyError } = await supabase
      .from("user_assemblies").insert(assemblyInsertData).select().single();

    if (assemblyError) {
      logger.error("Error creating assembly", {}, assemblyError);
      if (assemblyError.code === "42501") return { error: "Brak uprawnień do tworzenia zestawu" };
      return { error: `Błąd podczas tworzenia zestawu: ${assemblyError.message}` };
    }

    const itemsToInsert = input.items.map((item, index) => ({
      assembly_id: assembly.id,
      name: item.name.trim(),
      unit: item.unit,
      type: item.type,
      price: item.price,
      quantity: item.quantity,
      sort_order: item.sort_order ?? index,
    }));

    const { error: itemsError } = await supabase.from("user_assembly_items").insert(itemsToInsert);
    if (itemsError) {
      await supabase.from("user_assemblies").delete().eq("id", assembly.id);
      return { error: `Błąd podczas dodawania elementów: ${itemsError.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assemblies");
    return { success: true, assemblyId: assembly.id, message: "Zestaw został utworzony pomyślnie" };
  } catch (err) {
    logger.error("Unexpected error in createUserAssembly", {}, err);
    return { error: "Nieoczekiwany błąd podczas tworzenia zestawu" };
  }
}

export async function updateUserAssembly(assemblyId: string, input: UpdateAssemblyInput) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { error: validationError } = validate(updateAssemblySchema, input);
    if (validationError) return { error: validationError };

    if (input.name !== undefined || input.description !== undefined || input.category_id !== undefined || input.building_type !== undefined) {
      const updateData: Partial<UserAssembly> = {};
      if (input.name !== undefined) {
        if (!input.name.trim()) return { error: "Nazwa zestawu jest wymagana" };
        updateData.name = input.name.trim();
      }
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.category_id !== undefined) updateData.category_id = input.category_id || null;
      if (input.building_type !== undefined) updateData.building_type = input.building_type || "Dom";

      const { error: updateError } = await supabase.from("user_assemblies").update(updateData).eq("id", assemblyId);
      if (updateError) return { error: `Błąd podczas aktualizacji zestawu: ${updateError.message}` };
    }

    if (input.items !== undefined) {
      if (!input.items.length) return { error: "Zestaw musi zawierać co najmniej jeden element" };
      for (const item of input.items) {
        if (!item.name?.trim()) return { error: "Wszystkie elementy muszą mieć nazwę" };
        if (!["material", "labor"].includes(item.type)) return { error: "Typ elementu musi być 'material' lub 'labor'" };
        if (item.price < 0) return { error: "Cena nie może być ujemna" };
        if (item.quantity <= 0) return { error: "Ilość musi być większa od zera" };
      }

      const { error: deleteError } = await supabase.from("user_assembly_items").delete().eq("assembly_id", assemblyId);
      if (deleteError) return { error: "Błąd podczas usuwania starych elementów" };

      const itemsToInsert = input.items.map((item, index) => ({
        assembly_id: assemblyId,
        name: item.name.trim(),
        unit: item.unit,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
        sort_order: item.sort_order ?? index,
      }));

      const { error: insertError } = await supabase.from("user_assembly_items").insert(itemsToInsert);
      if (insertError) return { error: `Błąd podczas dodawania nowych elementów: ${insertError.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assemblies");
    return { success: true, message: "Zestaw został zaktualizowany pomyślnie" };
  } catch (err) {
    logger.error("Unexpected error in updateUserAssembly", { assemblyId }, err);
    return { error: "Nieoczekiwany błąd podczas aktualizacji zestawu" };
  }
}

export async function deleteUserAssembly(assemblyId: string) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { error, count } = await supabase
      .from("user_assemblies").delete({ count: "exact" }).eq("id", assemblyId);

    if (error) {
      if (error.code === "42501" || error.code === "PGRST301") return { error: "Nie masz uprawnień do usunięcia tego zestawu" };
      return { error: `Błąd podczas usuwania zestawu: ${error.message}` };
    }
    if (count === 0) return { error: "Zestaw nie został znaleziony lub nie masz uprawnień do jego usunięcia" };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assemblies");
    return { success: true, message: "Zestaw został usunięty pomyślnie" };
  } catch (err) {
    logger.error("Unexpected error in deleteUserAssembly", { assemblyId }, err);
    return { error: "Nieoczekiwany błąd podczas usuwania zestawu" };
  }
}

export async function duplicateUserAssembly(assemblyId: string) {
  try {
    const original = await getUserAssemblyById(assemblyId);
    if (!original) return { error: "Zestaw nie został znaleziony" };

    const copyInput: CreateAssemblyInput = {
      name: `${original.name} (kopia)`,
      description: original.description || undefined,
      items: (original.user_assembly_items || []).map((item) => ({
        name: item.name,
        unit: item.unit,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
        sort_order: item.sort_order,
      })),
    };

    const result = await createUserAssembly(copyInput);
    if (result.error) return result;
    return { success: true, assemblyId: result.assemblyId, message: "Zestaw został skopiowany pomyślnie" };
  } catch (err) {
    logger.error("Unexpected error in duplicateUserAssembly", { assemblyId }, err);
    return { error: "Nieoczekiwany błąd podczas kopiowania zestawu" };
  }
}

const SEED_ASSEMBLIES: CreateAssemblyInput[] = [
  {
    name: "Montaż gniazdka pojedynczego",
    description: "Standardowy montaż gniazdka elektrycznego 230V w ścianie",
    items: [
      { name: "Gniazdko pojedyncze 230V", unit: "szt." as UnitType, type: "material", price: 25, quantity: 1 },
      { name: "Puszka podtynkowa fi60", unit: "szt." as UnitType, type: "material", price: 3, quantity: 1 },
      { name: "Przewód YDYp 3x2.5", unit: "mb" as UnitType, type: "material", price: 6, quantity: 5 },
      { name: "Montaż gniazdka podtynkowego", unit: "szt." as UnitType, type: "labor", price: 45, quantity: 1 },
      { name: "Kucie bruzd w ścianie", unit: "mb" as UnitType, type: "labor", price: 25, quantity: 3 },
    ],
  },
  {
    name: "Montaż punktu oświetleniowego",
    description: "Punkt oświetleniowy z włącznikiem i oprawą",
    items: [
      { name: "Włącznik pojedynczy", unit: "szt." as UnitType, type: "material", price: 20, quantity: 1 },
      { name: "Oprawa sufitowa LED", unit: "szt." as UnitType, type: "material", price: 85, quantity: 1 },
      { name: "Puszka podtynkowa fi60", unit: "szt." as UnitType, type: "material", price: 3, quantity: 2 },
      { name: "Przewód YDYp 3x1.5", unit: "mb" as UnitType, type: "material", price: 4.5, quantity: 8 },
      { name: "Montaż oprawy oświetleniowej", unit: "szt." as UnitType, type: "labor", price: 55, quantity: 1 },
      { name: "Montaż włącznika podtynkowego", unit: "szt." as UnitType, type: "labor", price: 35, quantity: 1 },
      { name: "Kucie bruzd w ścianie", unit: "mb" as UnitType, type: "labor", price: 25, quantity: 4 },
    ],
  },
  {
    name: "Rozdzielnica mieszkaniowa 12-mod",
    description: "Montaż rozdzielnicy podtynkowej z zabezpieczeniami",
    items: [
      { name: "Rozdzielnica podtynkowa 12-mod", unit: "szt." as UnitType, type: "material", price: 120, quantity: 1 },
      { name: "Wyłącznik nadprądowy B16 1P", unit: "szt." as UnitType, type: "material", price: 22, quantity: 4 },
      { name: "Wyłącznik nadprądowy B10 1P", unit: "szt." as UnitType, type: "material", price: 22, quantity: 2 },
      { name: "Wyłącznik różnicowoprądowy 25A/30mA", unit: "szt." as UnitType, type: "material", price: 95, quantity: 1 },
      { name: "Szyna TH35", unit: "szt." as UnitType, type: "material", price: 12, quantity: 1 },
      { name: "Montaż rozdzielnicy podtynkowej", unit: "szt." as UnitType, type: "labor", price: 250, quantity: 1 },
      { name: "Podłączenie aparatów w rozdzielnicy", unit: "szt." as UnitType, type: "labor", price: 35, quantity: 7 },
    ],
  },
];

export async function seedAssembliesSmart() {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany", summary: { added: 0, skipped: 0 } };

    const { data: existing } = await supabase.from("user_assemblies").select("name").eq("user_id", user.id);
    const existingNames = new Set((existing || []).map((a: { name: string }) => a.name.toLowerCase()));

    let added = 0, skipped = 0;

    for (const template of SEED_ASSEMBLIES) {
      if (existingNames.has(template.name.toLowerCase())) { skipped++; continue; }

      const { data: assembly, error: assemblyError } = await supabase
        .from("user_assemblies")
        .insert({ user_id: user.id, name: template.name, description: template.description || null, category_id: null, visibility: "personal" })
        .select("id").single();

      if (assemblyError || !assembly) { logger.error("Error seeding assembly", { name: template.name }, assemblyError); skipped++; continue; }

      await supabase.from("user_assembly_items").insert(
        template.items.map((item, idx) => ({ assembly_id: assembly.id, name: item.name, unit: item.unit, type: item.type, price: item.price, quantity: item.quantity, sort_order: idx + 1 }))
      );
      added++;
    }

    revalidatePath("/dashboard/assemblies");
    return { success: true, summary: { added, skipped }, error: null };
  } catch (err) {
    logger.error("Unexpected error in seedAssembliesSmart", {}, err);
    return { error: "Wystąpił błąd podczas tworzenia zestawów", summary: { added: 0, skipped: 0 } };
  }
}

export async function updateAssemblyVisibility(assemblyId: string, visibility: DataVisibility, teamId?: string) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { data: assembly, error: fetchError } = await supabase.from("user_assemblies").select("user_id, team_id, visibility").eq("id", assemblyId).single();
    if (fetchError || !assembly) return { error: "Zestaw nie został znaleziony" };
    if (assembly.user_id !== user.id) return { error: "Tylko właściciel może zmienić widoczność zestawu" };

    const updateData: Record<string, unknown> = { visibility };

    if (visibility === "team") {
      if (!teamId) {
        const { data: ownedTeam } = await supabase.from("teams").select("id").eq("owner_id", user.id).limit(1).single();
        const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).eq("status", "active").limit(1).single();
        teamId = ownedTeam?.id || membership?.team_id;
        if (!teamId) return { error: "Musisz być członkiem zespołu, aby udostępniać zestawy zespołowi" };
      }
      updateData.team_id = teamId;
    } else {
      updateData.team_id = null;
    }

    const { error } = await supabase.from("user_assemblies").update(updateData).eq("id", assemblyId).eq("user_id", user.id);
    if (error) return { error: "Błąd podczas aktualizacji widoczności" };

    revalidatePath("/dashboard/assemblies");
    revalidatePath("/dashboard/team");
    return { success: true, message: visibility === "team" ? "Zestaw jest teraz dostępny dla zespołu" : "Zestaw jest teraz prywatny" };
  } catch (err) {
    logger.error("Unexpected error in updateAssemblyVisibility", { assemblyId, visibility }, err);
    return { error: "Nieoczekiwany błąd podczas aktualizacji widoczności" };
  }
}

export async function shareAssemblyCategoryWithTeam(categoryId: string, teamId: string): Promise<{ success?: boolean; sharedCount?: number; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Musisz być zalogowany" };

    const { data: assemblies, error: fetchError } = await supabase
      .from("user_assemblies").select("id").eq("user_id", user.id).eq("category_id", categoryId).or("visibility.eq.personal,visibility.is.null");
    if (fetchError) return { error: "Nie udało się pobrać zestawów" };
    if (!assemblies?.length) return { success: true, sharedCount: 0 };

    const { error: updateError } = await supabase
      .from("user_assemblies").update({ visibility: "team", team_id: teamId }).in("id", assemblies.map(a => a.id)).eq("user_id", user.id);
    if (updateError) return { error: "Nie udało się udostępnić zestawów" };

    revalidatePath("/dashboard/assemblies");
    revalidatePath("/dashboard/team");
    return { success: true, sharedCount: assemblies.length };
  } catch (err) {
    logger.error("Unexpected error in shareAssemblyCategoryWithTeam", { categoryId, teamId }, err);
    return { error: "Nieoczekiwany błąd" };
  }
}
