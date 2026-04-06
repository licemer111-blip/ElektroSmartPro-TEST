"use server";

import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export interface ProfitabilityData {
  // Revenue
  totalRevenue: number;
  materialRevenue: number;
  laborRevenue: number;
  totalRevenueGross: number;
  vatAmount: number;
  vatRate: number;
  // Costs
  totalCosts: number;
  materialCost: number;
  laborCost: number;
  // Profit
  netProfit: number;
  marginPercent: number;
  // Narzuty breakdown
  kpAmount: number;
  kpPercent: number;
  zAmount: number;
  zPercent: number;
  kzAmount: number;
  kzPercent: number;
  // Time tracking
  totalMinutes: number;
  hourlyRate: number;
  effectiveHourlyRate: number;
  // Region
  regionName: string;
  regionModifier: number;
  // KNR Safety Score
  totalItems: number;
  knrVerifiedItems: number;
  knrManualItems: number;
  knrSafetyScore: number; // 0-100
  // Adjustment
  adjustmentPercent: number;
}

export async function getProjectProfitability(projectId: string): Promise<ProfitabilityData | null> {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return null;

  // Get project with region + VAT
  const { data: project } = await supabase
    .from("projects")
    .select(`
      materials_owned_by_customer, adjustment_percentage,
      kp_percent, z_percent, kz_percent, vat_rate,
      regions ( name, coefficient )
    `)
    .eq("id", projectId)
    .single();

  if (!project) return null;

  // Get project items (including name for KNR safety score)
  const { data: items } = await supabase
    .from("project_items")
    .select("id, name, quantity, final_material_price, final_labor_price, material_price, labor_price, is_assembly_child")
    .eq("project_id", projectId);

  if (!items || items.length === 0) return null;

  const materialsOwnedByCustomer = project.materials_owned_by_customer ?? false;
  const vatRate = project.vat_rate ?? 23;
  const regionData = project.regions as unknown as { name: string; coefficient: number } | null;
  const regionName = regionData?.name ?? "—";
  const regionModifier = regionData?.coefficient ?? 1.0;

  // Step 1: Base totals
  let baseMaterialTotal = 0;
  let baseLaborTotal = 0;
  let knrVerifiedItems = 0;
  let knrManualItems = 0;
  const topLevelItems = items.filter(i => !i.is_assembly_child);

  for (const item of topLevelItems) {
    const mat = item.final_material_price ?? item.material_price ?? 0;
    const lab = item.final_labor_price ?? item.labor_price ?? 0;
    if (!materialsOwnedByCustomer) baseMaterialTotal += mat * item.quantity;
    baseLaborTotal += lab * item.quantity;

    // KNR Safety Score: parse codes from item name
    const hasManual = /\(ES-KNR-MANUAL\)/.test(item.name ?? "");
    const hasVerified = /\(ES-KNR-[A-Z0-9-]+-\d+\)/.test(item.name ?? "");
    if (hasManual) knrManualItems++;
    else if (hasVerified) knrVerifiedItems++;
    // items with no code at all count as unverified (manual)
    else knrManualItems++;
  }

  const totalItems = topLevelItems.length;
  const knrSafetyScore = totalItems > 0
    ? Math.round((knrVerifiedItems / totalItems) * 100)
    : 0;

  // Step 2: Adjustment
  const adjustmentPercent = project.adjustment_percentage || 0;
  const adjustmentMultiplier = 1 + adjustmentPercent / 100;
  const materialTotal = baseMaterialTotal * adjustmentMultiplier;
  const laborTotal = baseLaborTotal * adjustmentMultiplier;

  // Step 3: Narzuty (Kp, Z, Kz)
  const kpPercent = project.kp_percent || 0;
  const zPercent = project.z_percent || 0;
  const kzPercent = project.kz_percent || 0;
  const kpAmount = laborTotal * (kpPercent / 100);
  const zAmount = (laborTotal + kpAmount) * (zPercent / 100);
  const kzAmount = materialTotal * (kzPercent / 100);

  // Revenue
  const materialRevenue = materialTotal + kzAmount;
  const laborRevenue = laborTotal + kpAmount + zAmount;
  const totalRevenue = materialRevenue + laborRevenue;
  const vatAmount = totalRevenue * (vatRate / 100);
  const totalRevenueGross = totalRevenue + vatAmount;

  // Time entries
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("duration_minutes, started_at, ended_at")
    .eq("project_id", projectId);

  let totalMinutes = 0;
  if (timeEntries) {
    for (const entry of timeEntries) {
      if (entry.duration_minutes) {
        totalMinutes += entry.duration_minutes;
      } else if (entry.started_at && entry.ended_at) {
        totalMinutes += Math.round(
          (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000
        );
      }
    }
  }

  // Hourly rate
  const { data: profile } = await supabase
    .from("profiles")
    .select("hourly_rate")
    .eq("id", user.id)
    .single();

  const hourlyRate = profile?.hourly_rate || 0;
  const laborCost = hourlyRate > 0 && totalMinutes > 0
    ? (totalMinutes / 60) * hourlyRate : 0;
  const materialCost = materialRevenue * 0.7;
  const totalCosts = materialCost + laborCost;
  const netProfit = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const hoursWorked = totalMinutes / 60;
  const effectiveHourlyRate = hoursWorked > 0 ? laborRevenue / hoursWorked : 0;

  return {
    totalRevenue, materialRevenue, laborRevenue,
    totalRevenueGross, vatAmount, vatRate,
    totalCosts, materialCost, laborCost,
    netProfit, marginPercent,
    kpAmount, kpPercent, zAmount, zPercent, kzAmount, kzPercent,
    totalMinutes, hourlyRate, effectiveHourlyRate,
    regionName, regionModifier,
    totalItems, knrVerifiedItems, knrManualItems, knrSafetyScore,
    adjustmentPercent,
  };
}
