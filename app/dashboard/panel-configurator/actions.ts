"use server";

import { createClient } from "@/utils/supabase/server";

interface PanelConfigData {
  panelName: string;
  manufacturerId: string;
  customCoefficient: number;
  customCatalog?: {
    categories: Record<string, string>;
    modules: {
      id: string;
      name: string;
      namePl: string;
      category: string;
      modules: number;
      defaultRating?: number;
      defaultPrice?: number;
      defaultLaborPrice?: number;
      description: string;
    }[];
  };
  sections: {
    id: string;
    name: string;
    feed: string;
    type: string;
    enclosureModules: number;
    modules: {
      moduleId: string;
      rating?: number;
      label?: string;
      circuitNumber?: string;
      cableType?: string;
      customMaterialPrice?: number;
      customLaborPrice?: number;
      quantity?: number;
    }[];
    accessories?: {
      moduleId: string;
      rating?: number;
      label?: string;
      circuitNumber?: string;
      cableType?: string;
      customMaterialPrice?: number;
      customLaborPrice?: number;
      quantity?: number;
    }[];
  }[];
}

interface SavedPanelConfig {
  id: string;
  name: string;
  project_id: string | null;
  config_json: PanelConfigData;
  created_at: string;
  updated_at: string;
}

export async function savePanelConfiguration(
  name: string,
  configJson: PanelConfigData,
  projectId?: string,
  existingId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    if (existingId) {
      const { error } = await supabase
        .from("panel_configurations")
        .update({ name, config_json: configJson, project_id: projectId || null })
        .eq("id", existingId)
        .eq("user_id", user.id);
      if (error) return { success: false, error: error.message };
      return { success: true, id: existingId };
    }

    const { data, error } = await supabase
      .from("panel_configurations")
      .insert({ user_id: user.id, name, config_json: configJson, project_id: projectId || null })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Nieoczekiwany błąd zapisu" };
  }
}

export async function loadPanelConfigurations(): Promise<{ success: boolean; data?: SavedPanelConfig[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data, error } = await supabase
      .from("panel_configurations")
      .select("id, name, project_id, config_json, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []) as SavedPanelConfig[] };
  } catch {
    return { success: false, error: "Nieoczekiwany błąd odczytu" };
  }
}

export async function renamePanelConfiguration(id: string, newName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { error } = await supabase
      .from("panel_configurations")
      .update({ name: newName })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Nieoczekiwany błąd zmiany nazwy" };
  }
}

export async function duplicatePanelConfiguration(id: string, newName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { data: original, error: fetchErr } = await supabase
      .from("panel_configurations")
      .select("config_json, project_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !original) return { success: false, error: "Nie znaleziono konfiguracji" };

    const { data, error } = await supabase
      .from("panel_configurations")
      .insert({ user_id: user.id, name: newName, config_json: original.config_json, project_id: original.project_id })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id };
  } catch {
    return { success: false, error: "Nieoczekiwany błąd duplikacji" };
  }
}

export async function deletePanelConfiguration(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Brak autoryzacji" };

    const { error } = await supabase
      .from("panel_configurations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Nieoczekiwany błąd usuwania" };
  }
}
