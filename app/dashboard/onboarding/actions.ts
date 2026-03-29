"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface OnboardingData {
  companyName: string;
}

export async function saveOnboardingProfile(data: OnboardingData): Promise<{ error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Brak autoryzacji" };

  const { error } = await supabase
    .from("profiles")
    .update({ company_name: data.companyName || null })
    .eq("id", user.id);

  if (error) return { error: "Nie udało się zapisać profilu" };

  revalidatePath("/dashboard");
  return {};
}

const DEMO_ITEMS = [
  { name: "Gniazdo podtynkowe 2P+Z Schuko", unit: "szt", quantity: 12, material_price: 28, labor_price: 35, section: "Salon" },
  { name: "Gniazdo podwójne 2P+Z podtynkowe", unit: "szt", quantity: 8, material_price: 38, labor_price: 38, section: "Kuchnia" },
  { name: "Gniazdo IP44 łazienka", unit: "szt", quantity: 3, material_price: 42, labor_price: 40, section: "Łazienka" },
  { name: "Łącznik jednobiegunowy", unit: "szt", quantity: 8, material_price: 18, labor_price: 28, section: "Salon" },
  { name: "Łącznik schodowy", unit: "szt", quantity: 4, material_price: 22, labor_price: 32, section: "Korytarz" },
  { name: "Oprawa LED downlight 10W", unit: "szt", quantity: 16, material_price: 65, labor_price: 45, section: "Salon" },
  { name: "Oprawa LED natynkowa IP65 9W", unit: "szt", quantity: 3, material_price: 75, labor_price: 50, section: "Łazienka" },
  { name: "Taśma LED 12V z zasilaczem", unit: "mb", quantity: 6, material_price: 35, labor_price: 20, section: "Kuchnia" },
  { name: "Przewód YDYp 3x1,5mm² instalacja", unit: "mb", quantity: 120, material_price: 3.80, labor_price: 2.20, section: "Salon" },
  { name: "Przewód YDYp 3x2,5mm² obwody gniazd", unit: "mb", quantity: 180, material_price: 5.50, labor_price: 2.50, section: "Kuchnia" },
  { name: "Puszka podtynkowa ø60mm", unit: "szt", quantity: 28, material_price: 2.50, labor_price: 8, section: "Salon" },
  { name: "Bruzda w tynku gipsowym", unit: "mb", quantity: 85, material_price: 0, labor_price: 6.50, section: "Salon" },
  { name: "Rozdzielnica mieszkaniowa 2x12 modułów", unit: "szt", quantity: 1, material_price: 420, labor_price: 280, section: "Korytarz" },
  { name: "Wyłącznik nadprądowy B10A 1P", unit: "szt", quantity: 6, material_price: 28, labor_price: 18, section: "Korytarz" },
  { name: "Wyłącznik nadprądowy B16A 1P", unit: "szt", quantity: 8, material_price: 30, labor_price: 18, section: "Korytarz" },
  { name: "Wyłącznik różnicowoprądowy 25A/30mA", unit: "szt", quantity: 2, material_price: 185, labor_price: 45, section: "Korytarz" },
  { name: "Ochronnik przepięć T2 4P", unit: "szt", quantity: 1, material_price: 320, labor_price: 60, section: "Korytarz" },
  { name: "Obwód kuchenka elektryczna 3x4mm²", unit: "szt", quantity: 1, material_price: 85, labor_price: 120, section: "Kuchnia" },
  { name: "Obwód zmywarka 3x2,5mm²", unit: "szt", quantity: 1, material_price: 55, labor_price: 80, section: "Kuchnia" },
  { name: "Wentylator łazienkowy z czujnikiem wilg.", unit: "szt", quantity: 1, material_price: 145, labor_price: 85, section: "Łazienka" },
  { name: "Kabel HDMI natynkowy + gniazdo", unit: "szt", quantity: 2, material_price: 55, labor_price: 40, section: "Salon" },
  { name: "Gniazdo RJ45 Cat6 podtynkowe", unit: "szt", quantity: 4, material_price: 38, labor_price: 35, section: "Salon" },
  { name: "Montaż rozdzielnicy — robocizna", unit: "kpl", quantity: 1, material_price: 0, labor_price: 450, section: "Korytarz" },
  { name: "Próby i pomiary instalacji", unit: "kpl", quantity: 1, material_price: 0, labor_price: 380, section: "Korytarz" },
];

export async function createDemoProject(): Promise<{ projectId?: string; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Brak autoryzacji" };

  const existingDemo = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", "%Demo%")
    .limit(1)
    .single();

  if (existingDemo.data) {
    return { projectId: existingDemo.data.id };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: "Mieszkanie 3-pokojowe (Demo)",
      client_name: "Jan Kowalski",
      client_address: "ul. Przykładowa 1, Warszawa",
      status: "draft",
      rate_source: "engine",
      default_hourly_rate: null,
      description: "Projekt demonstracyjny — przykładowy kosztorys mieszkania 65m²",
      is_demo_project: true,
    })
    .select("id")
    .single();

  if (projectError || !project) return { error: "Nie udało się utworzyć projektu demonstracyjnego" };

  const itemsToInsert = DEMO_ITEMS.map((item, idx) => ({
    project_id: project.id,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    material_price: item.material_price,
    labor_price: item.labor_price,
    section: item.section,
    sort_order: idx,
  }));

  await supabase.from("project_items").insert(itemsToInsert);

  revalidatePath("/dashboard/projects");
  return { projectId: project.id };
}

export async function resetOnboarding(): Promise<{ error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Brak autoryzacji" };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: false })
    .eq("id", user.id);

  if (error) return { error: "Nie udało się zresetować przewodnika" };

  revalidatePath("/dashboard");
  return {};
}
