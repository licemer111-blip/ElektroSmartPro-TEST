"use server";

import { logger } from "@/lib/logger";
// UnitGuard removed — units are preserved as-is from the user's estimate
// ═══════════════════════════════════════════════════════════════════
// _ai_actions/pricing.ts — AI Pricing Server Actions
// estimatePricesWithAI, applyAiPrices
// ═══════════════════════════════════════════════════════════════════

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { getEffectiveRate } from "@/lib/global-benchmarks";
import {
  buildRateSourceInstruction,
  buildModeFieldRestriction,
  buildTopCatalogCandidates,
  findBestCatalogMatchWithHint,
  type RateSource,
  PRICING_STATIC_SYSTEM_PROMPT,
} from "@/lib/services/ai";
import { checkGuard, checkAuthOnly, createAdminClient } from "./utils";
import { canUserEditProject } from "../_actions/utils";
import { revalidatePath } from "next/cache";
import {
  resolveImportedRows,
  type MatchResult,
} from "@/lib/services/matching-engine";
import { buildLocalKnrContext, lookupKnrByName } from "@/lib/knr-local-context";
import { validateAgainstCanonicalL0 } from "@/lib/services/canonical-knr-l0";
import { findCanonicalL0WithOverrides } from "@/lib/services/canonical-l0-overrides";
import { scaleLaborNorm, getUnitBaseSize } from "@/lib/labor-time";
import { getPricingCacheName, CACHE_MODEL_ID } from "@/lib/services/ai/gemini-context-cache";
import {
  normalizeKnrCode,
} from "@/lib/services/pricing-config";
import { clampPrice } from "@/lib/utils/price-validator";
import { applyRealityCheck } from "@/lib/services/reality-check";
import { findMaterialBenchmark, clampToBenchmark, buildBenchmarkPromptContext } from "@/lib/data/material-benchmarks";
import {
  // v2.4: getModernizationFactor / getMFactorLabel are no longer used in
  // storage formulas (KNR 2026 norms already factor in modern tooling).
  // Re-import only if reintroducing M-Factor for AI L3 calibration context.
  CONNECTION_MIN_NORM, HEAVY_CONNECTION_MIN_NORM,
  CONNECTION_RE, HEAVY_APPLIANCE_RE,
  normalizePlName, isZelbet,
  getCeilingModifier, getHeightModifier,
  classifyIntent, GROOVE_FLOOR_RE, DRILL_FLOOR_RE,
} from "@/lib/services/semantic-classifier";
import { buildEnrichedItemListWithAssembly, detectSector, expandToAssembly } from "@/lib/ai/smart-mapping-engine";

// ── Re-export types for external consumers ────────────────────────
export type { AiPriceEstimate } from "./pricing-types";
// Internal type imports
import type { AiPriceEstimate, AiPriceResult } from "./pricing-types";

// ── Import helpers from extracted module ──────────────────────────
import {
  isOfficialKnr,
  isSyntheticKnr,
  detectAmbiguity,
  EXCAVATION_RE,
  isPureLaborByKeyword,
  isMaterialMandatory,
  normaliseName,
  applyDemontazRule,
  isCableItem,
  CABLE_SECTION_RE,
  getCableComplexityModifier,
  MAX_COMBINED_MODIFIER,
  clampLocalModifiers,
  getSurfaceModifier,
  buildModifierWarnings,
  GROOVE_ZELBET_MIN_NORM,
  DRILL_SILKA_MIN_NORM,
  DRILL_BETON_MIN_NORM,
  WYMIANA_RE,
  DEMONTAZ_MONTAZ_RE,
  WYMIANA_FACTOR,
  applySanityCheck,
  enforceExpertGuards,
  securityAuditLayer,
  applyPostProcessPipeline,
} from "./pricing-helpers";

// ─────────────────────────────────────────────────────────────────
// priceRowWithGlobalFallback
// Single-row pricing bypassing Tryb Własny L1-exclusive lock.
// Saves result directly to DB. Used by "Szukaj w KNR/AI" button.
// ─────────────────────────────────────────────────────────────────

export async function priceRowWithGlobalFallback(
  projectId: string,
  itemId: string,
  mode: "material" | "labor" | "all" = "all"
): Promise<{ success: boolean; errorCode?: string; error?: string; estimate?: AiPriceEstimate }> {
  try {
    // ── RATE GUARD (Hard Fail) ────────────────────────────────────────
    // Block execution immediately if project.default_hourly_rate == 0
    // AND profiles.hourly_rate == 0 (no global fallback either).
    {
      const authCheck = await checkAuthOnly();
      if ("error" in authCheck) return { success: false, error: authCheck.error };
      const { user: authUser, supabase: sc } = authCheck;
      const [{ data: projRate }, { data: profileRate }] = await Promise.all([
        sc.from("projects").select("default_hourly_rate").eq("id", projectId).single(),
        sc.from("profiles").select("hourly_rate").eq("id", authUser.id).single(),
      ]);
      const projectRate = (projRate?.default_hourly_rate as number | null) ?? 0;
      const profileFallbackRate = (profileRate as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;
      if (projectRate <= 0 && profileFallbackRate <= 0) {
        return {
          success: false,
          errorCode: "MISSING_RATE",
          error: "Obliczenia zablokowane: Ustaw stawkę rbh w ustawieniach (PLN/rbh).",
        };
      }
      // Auto-heal: if project rate is 0 but profile has a rate, propagate it
      if (projectRate <= 0 && profileFallbackRate > 0) {
        await sc.from("projects")
          .update({ default_hourly_rate: profileFallbackRate })
          .eq("id", projectId);
      }
    }
    // ─────────────────────────────────────────────────────────────────
    const result = await estimatePricesWithAI(projectId, mode, {
      targetItemIds: [itemId],
      keepExistingPrices: false,
      bypassL1Exclusive: true,
    });
    if (!result.success || !result.estimates?.length) {
      return { success: false, error: result.error ?? "Brak wyników z KNR/AI" };
    }

    const est = result.estimates[0];

    // Add P1 Fallback marker to note
    const fallbackNote = `P1 Fallback: ${est.note ?? "Znaleziono w globalnej bazie"}`.slice(0, 300);

    // Map confidence to DB confidence_level
    const confidenceLevel = est.confidence === "high"
      ? "verified"
      : est.confidence === "medium"
      ? "analog"
      : "estimated";

    // Map knrSource to DB knr_source format (canonical — matches applyAiPrices mapping)
    const dbKnrSource = est.knrSource === "official" ? "system_knr"
      : est.knrSource === "es-synthetic" ? "es_synthetic"
      : est.knrSource === "catalog-l1" ? "user_knr"
      : est.knrSource ?? null;

    const guard = await checkAuthOnly();
    if ("error" in guard) return { success: false, error: guard.error };
    const { supabase } = guard;

    // Protected Data Logic v2.3 — protect only explicitly user-locked norms.
    //
    // CHANGED (v2.3): The original v2.2 "any non-zero labor_norm is protected"
    // rule unintentionally locked AI-hallucinated norms (e.g. RJ45 priced at
    // 8.5 rbh by an old L3 run) — preventing reprice on subsequent
    // "Wyceń wszystko". Now only norms with an explicit user-set guard
    // are protected:
    //   - norm_protected         = true  (explicit lock toggle)
    //   - confidence_level       = manual (user-entered)
    //   - expert_override        = true  (Expert Shield raised the price)
    // All engine-derived norms (verified/analog/estimated/uncertain/unmatched)
    // are eligible for re-pricing.
    const { data: currentItem } = await supabase
      .from("project_items")
      .select("id, labor_norm, norm_protected, knr_code, material_price, quantity, confidence_level, expert_override")
      .eq("id", itemId)
      .single();

    const isNormProtected = currentItem != null && (
      (currentItem.norm_protected as boolean) === true ||
      (currentItem.confidence_level as string | null) === "manual" ||
      (currentItem.expert_override as boolean) === true
    );

    const updatePayload: Record<string, unknown> = {};

    if (isNormProtected) {
      if (!(currentItem.material_price as number | null)) {
        updatePayload.material_price = est.suggestedMaterial;
        updatePayload.final_material_price = est.suggestedMaterial;
      }
      if (!(currentItem.knr_code as string | null) && est.knrCode) {
        updatePayload.knr_code = est.knrCode;
        updatePayload.knr_source = dbKnrSource;
      }
      if (est.suggestedNorm !== undefined) updatePayload.suggested_norm = est.suggestedNorm;
      updatePayload.confidence_note = `[Norma chroniona] ${fallbackNote}`.substring(0, 400);
    } else {
      const qty: number = (currentItem?.quantity as number | null) ?? 1;
      updatePayload.material_price = est.suggestedMaterial;
      updatePayload.labor_price = est.suggestedLabor;
      updatePayload.final_material_price = est.suggestedMaterial;
      updatePayload.final_labor_price = est.suggestedLabor;
      updatePayload.knr_code = est.knrCode;
      updatePayload.knr_source = dbKnrSource;
      updatePayload.confidence_level = confidenceLevel;
      updatePayload.confidence_note = fallbackNote;
      if (est.laborNorm !== null && est.laborNorm !== undefined) {
        updatePayload.labor_norm = est.laborNorm;
        updatePayload.labor_hours_total = Math.round(est.laborNorm * qty * 100) / 100;
      }
      if (est.suggestedNorm !== undefined) updatePayload.suggested_norm = est.suggestedNorm;
    }

    const { error: dbErr } = await supabase
      .from("project_items")
      .update(updatePayload)
      .eq("id", itemId);

    if (dbErr) return { success: false, error: dbErr.message };

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, estimate: { ...est, note: fallbackNote } };
  } catch (err) {
    logger.error("[priceRowWithGlobalFallback]", {}, err);
    return { success: false, error: "Błąd wewnętrzny" };
  }
}

/* NOTE: Surface Engine, Sanity Check, Expert Guards, Security Audit Layer,
 * and PostProcessPipeline have been extracted to ./pricing-helpers.ts.
 * All constants (SURFACE_KEYWORDS, WYMIANA_RE, etc.) and functions
 * (getSurfaceModifier, applySanityCheck, enforceExpertGuards, securityAuditLayer,
 * applyPostProcessPipeline) are imported at the top of this file.
 */

// ─────────────────────────────────────────────────────────────────
// estimatePricesWithAI
// ─────────────────────────────────────────────────────────────────

export async function estimatePricesWithAI(
  projectId: string,
  mode: "material" | "labor" | "all",
  options?: {
    targetItemIds?: string[];
    keepExistingPrices?: boolean;
    /** Bypass Tryb Własny L1-exclusive lock — go straight to KNR/AI (used by Manual Global Fallback button) */
    bypassL1Exclusive?: boolean;
  }
): Promise<AiPriceResult> {
  const { targetItemIds, keepExistingPrices = false, bypassL1Exclusive = false } = options ?? {};
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.aiPricing);
    if ("error" in guard) return { success: false, error: guard.error };
    const { user, supabase } = guard;

    const canEdit = await canUserEditProject(supabase, projectId, user.id);
    if (!canEdit) return { success: false, error: "Nie masz uprawnień do tego projektu" };

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions (name, price_modifier), object_types (slug)")
      .eq("id", projectId)
      .single();

    if (!project) return { success: false, error: "Projekt nie znaleziony" };
    if (project.status === "final") return { success: false, error: "Projekt jest zablokowany. Odblokuj go, aby wyceniac pozycje." };

    const { data: items, error: itemsError } = await supabase
      .from("project_items")
      .select("id, name, unit, quantity, material_price, labor_price, final_material_price, final_labor_price, section, description, parent_assembly_id, knr_code, is_assembly_child")
      .eq("project_id", projectId)
      .order("sort_order");

    if (itemsError) {
      logger.error("estimatePricesWithAI items query error:", {}, itemsError);
      return { success: false, error: "Blad pobierania pozycji z bazy danych" };
    }

    type PricingItem = { id: string; name: string; unit: string; quantity: number; material_price: number | null; labor_price: number | null; final_material_price: number | null; final_labor_price: number | null; section: string | null; description: string | null; parent_assembly_id: string | null; knr_code: string | null; is_assembly_child: boolean | null };
    const allItems = (items || []) as PricingItem[];
    
    // Assembly expansion: if targetItemIds contains assembly parents, expand to their children
    // Children (is_assembly_child=true) are the actual priceable items; parents are just headers
    let expandedTargetIds: Set<string> | null = null;
    if (targetItemIds && targetItemIds.length > 0) {
      expandedTargetIds = new Set(targetItemIds);
      // Find assembly parents in target and add their children
      for (const id of targetItemIds) {
        const item = allItems.find(i => i.id === id);
        if (item && !item.parent_assembly_id) {
          // This is a top-level item — check if it's an assembly parent
          const children = allItems.filter(i => i.parent_assembly_id === id);
          if (children.length > 0) {
            // It's an assembly parent — add children instead of parent
            expandedTargetIds.delete(id); // Don't price the parent header
            children.forEach(c => expandedTargetIds!.add(c.id));
          }
        }
      }
    }

    // Include ALL items (including assembly children) for pricing
    // Assembly parents (items with children) are excluded — only children get priced
    const assemblyParentIds = new Set(allItems.filter(i => i.parent_assembly_id).map(i => i.parent_assembly_id!));
    let itemsForPricing = allItems.filter((item) => !assemblyParentIds.has(item.id));
    if (itemsForPricing.length === 0) return { success: false, error: "Brak pozycji w kosztorysie" };

    if (expandedTargetIds && expandedTargetIds.size > 0) {
      itemsForPricing = itemsForPricing.filter((item) => expandedTargetIds!.has(item.id));
      if (itemsForPricing.length === 0) return { success: false, error: "Zadna z zaznaczonych pozycji nie jest dostepna do wyceny" };
    }

    // RULE 0: 0.00 = Pustka. Używamy final_* jako źródło prawdy (uwzględnia ręczne edycje i bulk).
    // Jeśli użytkownik jawnie zaznaczył pozycje (targetItemIds) → ZAWSZE przetwarzaj (rozkaz).
    type ItemWithFinal = { material_price: number | null; labor_price: number | null; final_material_price?: number | null; final_labor_price?: number | null };
    const effectiveMat = (item: ItemWithFinal) => item.final_material_price ?? item.material_price ?? 0;
    const effectiveLab = (item: ItemWithFinal) => item.final_labor_price ?? item.labor_price ?? 0;
    const isBlank = (item: ItemWithFinal) => effectiveMat(item) === 0 && effectiveLab(item) === 0;

    const userSelectedItems = !!(targetItemIds && targetItemIds.length > 0);

    const itemsToPrice = itemsForPricing.filter((item) => {
      // Explicit selection = always reprice (user command overrides everything)
      if (userSelectedItems) return true;

      // SecurityAuditLayer pre-check: force-reprice items whose existing labor price
      // is below the hard floor for their category — even if price > 0.
      // This is the PRIMARY fix for "2.16 PLN stays forever" syndrome:
      // items priced by a previous bad L0/KNR run are stuck below floor because
      // the filter excludes them (effectiveLab !== 0), so securityAuditLayer never fires.
      // Iron Rule: an item priced at 2.16 PLN for "Podłączenie pompy" MUST be corrected.
      if (mode === "labor" || mode === "all") {
        const curLab = effectiveLab(item);
        if (curLab > 0) {
          // Use SemanticInterpreter to detect underpriced items of any category
          const profile = classifyIntent(item.name);
          if (profile.intent !== "GENERAL" && curLab < profile.baseFloor) return true;
        }
      }

      // No selection: reprice only blank items (or when keepExistingPrices=false)
      if (keepExistingPrices) {
        if (mode === "material") return effectiveMat(item) === 0;
        if (mode === "labor") return effectiveLab(item) === 0;
        return isBlank(item);
      }
      if (mode === "material") return effectiveMat(item) === 0;
      if (mode === "labor") return effectiveLab(item) === 0;
      return isBlank(item);
    });

    if (itemsToPrice.length === 0) {
      return { success: false, error: "Brak pozycji do wyceny. Zaznacz pozycje lub ustaw ceny na 0, aby ponownie wycenić." };
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("investment_context, hourly_rate")
      .eq("id", user.id)
      .single();
    const investmentContextDB = (userProfile?.investment_context as string | null) ?? "";
    const projectLaborRate = (project.default_hourly_rate as number | null) ?? 0;
    // Fallback: if project rate = 0, use global profile rate
    const profileHourlyRate = (userProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;
    const effectiveLaborRate = projectLaborRate > 0 ? projectLaborRate : profileHourlyRate;
    const projectRegionName = (project.regions as { name: string; price_modifier: number } | null)?.name || null;
    const rateResult = await getEffectiveRate(projectRegionName, effectiveLaborRate);
    if (rateResult.usedDefaultRate) {
      return { success: false, error: "Nie ustawiono stawki robocizny. Ustaw stawkę w ustawieniach (PLN/rbh).", errorCode: "MISSING_RATE" };
    }
    const userHourlyRate = rateResult.laborRate;
    // FORMULA: Final_Labor = baseRateForCalc × regionModifier × KNR_norm × unit_factor × complexity_mods
    const baseRateForCalc = rateResult.regionModifier > 0
      ? Math.round((rateResult.laborRate / rateResult.regionModifier) * 100) / 100
      : rateResult.laborRate;

    const globalLaborMod = 1.0;
    const surfaceExtraMod = 1.0;

    // D2: project-level context fallback for getSurfaceModifier when item.section is null
    const projectFallback = (
      (project.description as string | null) ||
      (project.name as string | null) ||
      ""
    ).trim();

    const { data: userCatalogRaw } = await supabase
      .from("catalog_items")
      .select("name, unit, base_material_price, base_labor_price, knr_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(500);
    const userCatalog = userCatalogRaw || [];

    const regionName = (project.regions as { name: string; price_modifier: number } | null)?.name || "Polska";
    const priceModifier = (project.regions as { name: string; price_modifier: number } | null)?.price_modifier || 1.0;

    // ─── STEP 0: Direct KNR lookup for items with pre-extracted knr_code (PDF Przedmiar) ───
    // Items imported from PDF “Przedmiar Robót” carry knr_code from the “Podstawa” column.
    // Skip L1/L2/L3 for these — look up labor_norm_rbh directly in es_dictionary.
    const l0Estimates: AiPriceEstimate[] = [];
    const l0ResolvedIds = new Set<string>();

    const itemsWithKnr = itemsToPrice.filter(item => {
      const code = (item as typeof item & { knr_code?: string | null }).knr_code;
      return typeof code === "string" && code.trim().length > 0;
    });

    if (itemsWithKnr.length > 0) {
      // Normalize KNR codes via centralised helper (e.g. "5-08 0401/01" → "5-08 0401-01")
      const uniqueCodes = [...new Set(
        itemsWithKnr.map(item => normalizeKnrCode((item as typeof item & { knr_code: string }).knr_code))
      )];

      // ── L0 FIX: knr_norms is the correct table (full_code + labor_norm) ──────
      // Task 3: parallel — labor norms + material benchmark prices from es_dictionary
      const [{ data: knrRows }, { data: matL0Rows }] = await Promise.all([
        supabase.from("knr_norms").select("full_code, labor_norm, unit").in("full_code", uniqueCodes),
        supabase.from("es_dictionary").select("knr_ref, material_unit_price").in("knr_ref", uniqueCodes).gt("material_unit_price", 0),
      ]);

      // knrMap stores norm normalised to per-base-unit (e.g. per mb/m/szt)
      const knrMap = new Map<string, { normBase: number; dictUnit: string }>();
      for (const row of (knrRows || [])) {
        if (row.labor_norm != null && !knrMap.has(row.full_code)) {
          const rawUnit = (row.unit ?? "").toLowerCase().trim();
          const dictBase = getUnitBaseSize(rawUnit);
          const normBase = Number(row.labor_norm) / dictBase;
          knrMap.set(row.full_code, { normBase, dictUnit: rawUnit });
        }
      }
      const matL0Map = new Map<string, number>();
      for (const row of (matL0Rows || [])) {
        if (row.knr_ref && row.material_unit_price && !matL0Map.has(row.knr_ref)) {
          matL0Map.set(row.knr_ref, Number(row.material_unit_price));
        }
      }

      for (const item of itemsWithKnr) {
        const code = normalizeKnrCode((item as typeof item & { knr_code: string }).knr_code);
        const knrEntry = knrMap.get(code);
        if (knrEntry != null) {
          const { normBase, dictUnit } = knrEntry;
          // Unit Scaling v2.3: scale normBase (per-base-unit) to item unit
          const itemUnit = (item.unit ?? "").toLowerCase().trim();

          // L0 unit-mismatch guard: a point-unit KNR norm (szt/kpl) applied to a
          // linear item (mb/m) — or vice versa — produces nonsensical results and
          // causes sanity-check failures (e.g. "Bruzdownie do lamp" gets the lamp-
          // fixture norm KNR 5-08 0701-01 @ 4.0 rbh/szt instead of 0.4 rbh/mb).
          // Reject the match → item falls through to L2 where the correct mb norm is found.
          const isPointUnit = (u: string) => u === "szt" || u === "kpl" || u === "krot";
          const isLinearUnit = (u: string) => u === "m" || u === "mb" || u === "mb2";
          if ((isPointUnit(dictUnit) && isLinearUnit(itemUnit)) ||
              (isLinearUnit(dictUnit) && isPointUnit(itemUnit))) {
            // L0 mismatch — fall through to L2/L3 for correct unit-aware matching
            continue;
          }

          const cableMod = getCableComplexityModifier(item.name);
          // L0: KNR codes (knr_norms table) always encode surface natively.
          // e.g. KNR 5-04 0701-02 = bruzdowanie w betonie (0.18 rbh) — surface baked in.
          // getSurfaceModifier() and surfaceExtraMod must NOT be applied here.
          // They would silently double-count the surface penalty already in the norm.
          const surfaceModL0 = 1.0; // surface = KNR-native, no extra modifier
          // Height/ceiling modifiers apply even for L0 (KNR norms are base-height,
          // not adjusted for work above 3.5m or on ceilings).
          const itemSectionCtxL0 = (() => {
            const t = item as typeof item & { section?: string | null; description?: string | null };
            return `${t.section ?? ""} ${t.description ?? ""}`.trim() || projectFallback;
          })();
          const ceilingModL0 = getCeilingModifier(item.name, itemSectionCtxL0);
          const heightModL0  = getHeightModifier(item.name, itemSectionCtxL0);
          const globalModTagL0 = "";
          const ceilingTagL0  = ceilingModL0 !== 1.0 ? ` ×${ceilingModL0.toFixed(2)}(sufit)` : "";
          const heightTagL0   = heightModL0  !== 1.0 ? ` ×${heightModL0.toFixed(2)}(wysokość)` : "";
          const warnings = buildModifierWarnings(cableMod, surfaceModL0, ceilingModL0);
          const itemBase = getUnitBaseSize(itemUnit);
          const laborNormScaled = Math.round(normBase * itemBase * 1_000_000) / 1_000_000;
          const scaleNote = (dictUnit && dictUnit !== "mb" && dictUnit !== "m" && dictUnit !== "szt" && dictUnit !== "kpl")
            ? ` [KNR: ${dictUnit}]` : "";
          // v2.4: M-Factor REMOVED from storage formula (KNR 2026 norms already
          // factor in modern tooling — applying it again was double-discount).
          // M-Factor remains available via getModernizationFactor() for AI L3
          // calibration context only. See _l0CableSection / _mFactorL0Reference
          // below — kept for trace continuity / future calibration logging.
          const _l0CableSection = isCableItem(item.name) ? (() => { const _m = item.name.match(CABLE_SECTION_RE); return _m ? parseFloat(_m[2].replace(",", ".")) : null; })() : null;
          void _l0CableSection; // reserved for future calibration logging
          const localModL0 = clampLocalModifiers(cableMod, surfaceModL0, ceilingModL0, heightModL0);
          const sugLab = Math.round(laborNormScaled * localModL0 * baseRateForCalc * globalLaborMod * 100) / 100;
          // Effective hours = norm × modifiers × qty (no M-Factor in storage formula)
          const laborHoursTotalL0 = baseRateForCalc > 0
            ? Math.round(sugLab / baseRateForCalc * (item.quantity ?? 1) * 1000) / 1000
            : null;
          // Region hint — informational suffix showing final price after region modifier
          // Region is NOT baked into DB price; it's applied lazily in calcRowPrices at display time
          const regionMod = rateResult.regionModifier;
          const regionLabel = projectRegionName ?? "brak";
          const regionHintL0 = regionMod !== 1.0
            ? ` → ×${regionMod.toFixed(2)}(${regionLabel}) → ${(sugLab * regionMod).toFixed(2)}PLN`
            : "";
          const capTagL0 = localModL0 >= MAX_COMBINED_MODIFIER ? ` [⚠️ cap×${MAX_COMBINED_MODIFIER}]` : "";
          const traceL0 = `${laborNormScaled.toFixed(4)}rbh × ${localModL0.toFixed(2)}(local${capTagL0}) × ${baseRateForCalc.toFixed(1)}PLN/h${globalModTagL0} = ${sugLab.toFixed(2)}PLN${regionHintL0}`;
          l0ResolvedIds.add(item.id);
          l0Estimates.push({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            currentMaterial: item.material_price || 0,
            currentLabor: item.labor_price || 0,
            suggestedMaterial: mode === "labor"
              ? (item.material_price || 0)
              : (isPureLaborByKeyword(item.name) ? 0 : (matL0Map.get(code) ?? 0)),
            suggestedLabor: mode === "material" ? (item.labor_price || 0) : sugLab,
            laborHoursTotal: laborHoursTotalL0,
            confidence: "high" as const,
            note: `L0 Przedmiar KNR: ${code}${scaleNote} | ${traceL0}${warnings}`,
            knrCode: code,
            knrSource: "official" as const,
            laborNorm: laborNormScaled,
            suggestedNorm: laborNormScaled,
            isAmbiguous: false,
            trace: `L0 Direct KNR: "${code}" | ${traceL0}`,
          });
        }
        // L0 miss: item falls through to L1/L2/L3 (not added to l0ResolvedIds)
      }
    }
    // ────────────────────────────────────────────────────────────────────────────────

    // ─── STEP 0.5: Canonical L0 by name pattern (verified KNR 2026 reference) ───
    // For items WITHOUT pre-extracted knr_code, try the canonical reference table
    // (lib/services/canonical-knr-l0.ts) — top ~60 most common Polish electrical
    // positions with hardcoded high-precision regex patterns + verified KNR 2026
    // norms. This bypasses the fuzzy L1/L2/L3 cascade for items where we already
    // KNOW the right answer (cables, sockets, switches, light fixtures, chasing,
    // breakers, measurements, fire detection).
    //
    // Effect: for the ~80% of typical estimates that match canonical patterns,
    // labor_norm is correct out of the box — eliminates the per-project manual
    // fix burden caused by L2 keyword matcher mismaps and L3 AI hallucinations.
    const canonicalCandidates = itemsToPrice.filter(
      (it) => !l0ResolvedIds.has(it.id),
    );
    for (const item of canonicalCandidates) {
      const canonical = await findCanonicalL0WithOverrides(item.name, item.unit);
      if (!canonical) continue;
      const itemUnit = (item.unit ?? "").toLowerCase().trim();
      const cableMod = getCableComplexityModifier(item.name);
      // Canonical norms encode substrate natively (e.g. bruzdowanie cegła vs beton
      // are SEPARATE entries with separate norms). Surface modifier must NOT be
      // re-applied — same rule as STEP 0 above.
      const surfaceModC0 = 1.0;
      const sectionCtxC0 = (() => {
        const t = item as typeof item & { section?: string | null; description?: string | null };
        return `${t.section ?? ""} ${t.description ?? ""}`.trim() || projectFallback;
      })();
      const ceilingModC0 = getCeilingModifier(item.name, sectionCtxC0);
      const heightModC0 = getHeightModifier(item.name, sectionCtxC0);
      const localModC0 = clampLocalModifiers(cableMod, surfaceModC0, ceilingModC0, heightModC0);
      const wymianaActiveC0 = WYMIANA_RE.test(item.name) || DEMONTAZ_MONTAZ_RE.test(item.name);
      const wymianaFactorC0 = wymianaActiveC0 ? WYMIANA_FACTOR : 1.0;
      const sugLabBaseC0 = Math.round(canonical.laborNorm * localModC0 * baseRateForCalc * globalLaborMod * 100) / 100;
      const sugLabC0 = Math.round(sugLabBaseC0 * wymianaFactorC0 * 100) / 100;
      const laborHoursTotalC0 = baseRateForCalc > 0
        ? Math.round(sugLabC0 / baseRateForCalc * (item.quantity ?? 1) * 1000) / 1000
        : null;
      const matBenchC0 = canonical.materialPrice ?? 0;
      const isPureLaborC0 = isPureLaborByKeyword(item.name);
      const sugMatC0 = mode === "labor"
        ? (item.material_price || 0)
        : isPureLaborC0
          ? 0
          : matBenchC0;
      const regionMod = rateResult.regionModifier;
      const regionLabel = projectRegionName ?? "brak";
      const regionHintC0 = regionMod !== 1.0
        ? ` → ×${regionMod.toFixed(2)}(${regionLabel}) → ${(sugLabC0 * regionMod).toFixed(2)}PLN`
        : "";
      const wymianaTagC0 = wymianaActiveC0 ? ` ×${WYMIANA_FACTOR.toFixed(1)}(wymiana)` : "";
      const traceC0 = `${canonical.laborNorm.toFixed(4)}rbh × ${localModC0.toFixed(2)}(local) × ${baseRateForCalc.toFixed(1)}PLN/h${wymianaTagC0} = ${sugLabC0.toFixed(2)}PLN${regionHintC0}`;
      l0ResolvedIds.add(item.id);
      l0Estimates.push({
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        currentMaterial: item.material_price || 0,
        currentLabor: item.labor_price || 0,
        suggestedMaterial: sugMatC0,
        suggestedLabor: mode === "material" ? (item.labor_price || 0) : sugLabC0,
        laborHoursTotal: laborHoursTotalC0,
        regionModifier: regionMod,
        confidence: "high" as const,
        note: `L0 Canonical KNR 2026: ${canonical.knrCode} (${canonical.description}) | ${traceC0}`,
        knrCode: canonical.knrCode,
        knrSource: "official" as const,
        laborNorm: canonical.laborNorm,
        suggestedNorm: canonical.laborNorm,
        isAmbiguous: false,
        trace: `L0 Canonical (${canonical.unitMatch}): "${item.name}" → ${canonical.knrCode} | ${traceC0}`,
      });
      // Use itemUnit only for trace (no-op assignment to keep var usage explicit)
      void itemUnit;
    }
    // ────────────────────────────────────────────────────────────────────────────────

    // ─── STEP 1: UNIVERSAL L1 — Personal catalog ABSOLUTE PRIORITY (runs before es_dictionary) ───
    // Rule: If item matches user's personal catalog (fuzzy ≥0.2 threshold or typo-tolerant Levenshtein),
    // it is IMMEDIATELY resolved. Search STOPS — no es_dictionary, no AI, no region multiplier applied.
    // Any L1 hit wins over ALL other tiers regardless of es_dictionary L1/L2 confidence scores.
    //
    // L1 hits are always final (added to l1Estimates, excluded via l1ResolvedIds downstream).
    // Misses always proceed to L2/L3.
    // bypassL1Exclusive: user clicked "Szukaj w KNR/AI" — skip L1 catalog entirely.

    // Collect all L1 results here — declared before the if-block so it's available for merge later
    const l1Estimates: AiPriceEstimate[] = [];
    // Set of item IDs resolved by L1 — used for ID-based filtering downstream (no splice!)
    const l1ResolvedIds = new Set<string>();

    if (userCatalog.length > 0) {
      type CatalogEntry = { name: string; unit: string; base_material_price: number | null; base_labor_price: number | null; knr_code?: string | null };
      const catalogForMatch = userCatalog.map((c: CatalogEntry) => ({
        id: c.name,
        name: c.name,
        unit: c.unit,
        base_material_price: c.base_material_price,
        base_labor_price: c.base_labor_price,
        knr_code: c.knr_code ?? null,
      }));

      logger.info(`[L1-STEP1] catalog=${catalogForMatch.length} items=${itemsToPrice.length}`);

      type NotInCatalogEntry = typeof itemsToPrice[number] & {
        __catalogHint?: { name: string; score: number } | null;
        __catalogCandidates?: Array<{ name: string; mat: number; lab: number; score: number }>;
      };

      // ── Phase A: synchronous keyword matching for ALL items ──────────────────
      const keywordMisses: NotInCatalogEntry[] = [];

      for (const item of itemsToPrice) {
        if (l0ResolvedIds.has(item.id)) continue; // L0: already priced via direct KNR lookup
        if (detectAmbiguity(item.name)) {
          l1ResolvedIds.add(item.id);
          l1Estimates.push({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            currentMaterial: item.material_price || 0,
            currentLabor: item.labor_price || 0,
            suggestedMaterial: 0,
            suggestedLabor: 0,
            confidence: "low" as const,
            note: "ES-Engine: Zbyt ogólny opis. Podaj konkretne materiały, aby uzyskać rzetelną wycenę",
            knrCode: null,
            knrSource: null,
            laborNorm: null,
            isAmbiguous: true,
            trace: "L1 Skip: ambiguity detected",
          });
          continue;
        }

        const { match, trace, bestMiss } = findBestCatalogMatchWithHint(item.name, catalogForMatch, true);
        if (match) {
          // Iron Rule: material sovereign. Labor stored as BASE — calcRowPrices applies regionModifier at display
          const rawMat = Math.round((match.base_material_price ?? 0) * 100) / 100;
          const rawLab = Math.round((match.base_labor_price ?? 0) * 100) / 100;
          // If catalog item has no prices set — fall through to L2/L3 for automatic pricing
          if (rawMat === 0 && rawLab === 0) {
            const topCandidates = buildTopCatalogCandidates(item.name, catalogForMatch);
            keywordMisses.push({ ...item, __catalogHint: bestMiss, __catalogCandidates: topCandidates });
            continue;
          }
          l1ResolvedIds.add(item.id);
          l1Estimates.push({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            currentMaterial: item.material_price || 0,
            currentLabor: item.labor_price || 0,
            suggestedMaterial: mode === "labor" ? (item.material_price || 0) : rawMat,
            suggestedLabor: mode === "material" ? (item.labor_price || 0) : rawLab,
            confidence: "high" as const,
            note: `P1: Twój katalog → ${match.name}${priceModifier !== 1.0 ? ` (×${priceModifier} ${regionName})` : ""}`,
            knrCode: match.knr_code ?? null,
            knrSource: "catalog-l1" as const,
            laborNorm: null,
            trace: `L1 Hit (${trace.method}): ${trace.detail}`,
          });
        } else {
          const topCandidates = buildTopCatalogCandidates(item.name, catalogForMatch);
          keywordMisses.push({ ...item, __catalogHint: bestMiss, __catalogCandidates: topCandidates });
        }
      }

      // Phase B (Semantic L1) removed in v10.5 — exclusiveMode was hardcoded false
      // since One Rate Refactor (use_custom_rates eliminated). Dead code cleaned up.
      const notInCatalog: NotInCatalogEntry[] = keywordMisses;

      // All items resolved via personal catalog — return immediately, skip AI entirely
      if (notInCatalog.length === 0) {
        return { success: true, estimates: l1Estimates };
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── STEP 2: ES-Engine dictionary pre-resolution (L2) ──────────────────────
    // Filter to items NOT resolved by L1 (ID-based — no splice, no index issues)
    const l2Candidates = itemsToPrice.filter((item) => !l0ResolvedIds.has(item.id) && !l1ResolvedIds.has(item.id));

    // L2 FIX: strip embedded KNR code references from item names before matching.
    // PDF imports sometimes store "Bruzdowanie w betonie (KNR 5-08 0701-01)" as the name.
    // This prevents Phase 1 exact match — stripped name "Bruzdowanie w betonie" matches cleanly.
    const KNR_REF_RE = /\s*\(?\bKNR\s+[\d][-/][\d]+\s+[\d]+-[\d]+\b\)?/gi;
    const stripKnrRef = (name: string) => name.replace(KNR_REF_RE, "").trim();

    type EsResolvedRow = Awaited<ReturnType<typeof resolveImportedRows>>[number];
    let esResolved: EsResolvedRow[] = [];
    try {
      esResolved = await resolveImportedRows(
        l2Candidates.map((item) => ({ name: stripKnrRef(item.name) })),
        supabase,
        { sensitivity: "elastyczna", defaultMontage: "pod_tynkiem", autoLearning: false },
      );
    } catch {
      // Non-critical — continue without L2
    }

    // Separate ambiguous items (from l2Candidates — items NOT resolved by L1)
    const ambiguousItems = l2Candidates.filter((item) => detectAmbiguity(item.name));
    const clearItems = l2Candidates.filter((item) => !detectAmbiguity(item.name));

    // Build ambiguous estimates immediately
    const ambiguousEstimates: AiPriceEstimate[] = ambiguousItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      currentMaterial: item.material_price || 0,
      currentLabor: item.labor_price || 0,
      suggestedMaterial: 0,
      suggestedLabor: 0,
      confidence: "low" as const,
      note: "ES-Engine: Zbyt ogólny opis. Podaj konkretne materiały, aby uzyskać rzetelną wycenę",
      knrCode: null,
      knrSource: null,
      laborNorm: null,
      isAmbiguous: true,
      trace: "L2 Skip: ambiguity detected",
    }));

    if (clearItems.length === 0) {
      return { success: true, estimates: [...l1Estimates, ...ambiguousEstimates] };
    }

    // Map l2Candidates by ID for O(1) esResolved index lookup
    const l2IndexByItemId = new Map(l2Candidates.map((item, i) => [item.id, i]));

    // Task 3: pre-fetch material benchmark prices for L2 hits (es_dictionary.material_unit_price)
    const l2KnrCodes = [...new Set(esResolved.map(r => r.knr_code).filter((c): c is string => !!c && c.length > 0))];
    const matL2Map = new Map<string, number>();
    if (l2KnrCodes.length > 0) {
      const { data: matL2Rows } = await supabase
        .from("es_dictionary")
        .select("knr_ref, material_unit_price")
        .in("knr_ref", l2KnrCodes)
        .gt("material_unit_price", 0);
      for (const row of (matL2Rows || [])) {
        if (row.knr_ref && row.material_unit_price && !matL2Map.has(row.knr_ref)) {
          matL2Map.set(row.knr_ref, Number(row.material_unit_price));
        }
      }
    }

    // ─── Build L2 estimates — no AI (L3 is on-demand only via triggerL3Estimation) ───
    const l2Estimates: AiPriceEstimate[] = clearItems.map((item) => {
      const originalItem = itemsToPrice.find((o) => o.id === item.id);
      const l2Idx = l2IndexByItemId.get(item.id);
      const esRow = l2Idx !== undefined ? esResolved[l2Idx] : undefined;
      const m: MatchResult | undefined = esRow?._match;

      // ── L2 HIT: es_dictionary found a match (L1 exact or L2 fuzzy) ──────────
      if (esRow && esRow.knr_code && m && (m.confidence_level === "L1" || m.confidence_level === "L2")) {
        const laborNorm = esRow.labor_norm_rbh ?? null;
        const isL1Hit = m.confidence_level === "L1";
        const isRegexExact = m.match_method === "regex_cable" || m.match_method === "regex_pipe";
        const hitLabel = isL1Hit ? "exact" : "analog";
        // Store BASE price — calcRowPrices applies regionModifier dynamically at display time
        const itemWithCtx2 = item as typeof item & { section?: string | null; description?: string | null };
        const itemSectionCtx2 = `${itemWithCtx2.section ?? ""} ${itemWithCtx2.description ?? ""}`.trim();
        const globalCtx2 = itemSectionCtx2 || projectFallback;
        const cableMod = getCableComplexityModifier(item.name);
        // ── Surface modifier — Phase 2 transparent calculation ─────────────────
        // Step 1 (auto): Use DB flag keyword_encodes_surface (set by migration on seed entries).
        //   true  → keyword norm already accounts for surface (e.g. "bruzdowanie w betonie" = 0.18 rbh/mb)
        //           → autoSurfaceMod = 1.0 (no double-count)
        //   false → apply getSurfaceModifier() from item.name / context
        // Step 2 (proj): surfaceExtraMod from coeff_surface project flag (1.15 = +15% extra difficulty).
        //   Applied ONLY when auto surface was detected (unknown surface + project flag).
        //   NOT applied when keyword encodes surface (would be ghost multiplier on known surface).
        const keywordEncodesSurface = m.keyword_encodes_surface === true;
        // ── Surface modifier with delta correction ─────────────────────────────
        // When keyword_encodes_surface=TRUE, the norm already bakes in the keyword's surface.
        // But if the ITEM has a HARDER surface than the keyword encoded, we must apply delta:
        //   delta = item_surface_tier / keyword_surface_tier
        // Examples:
        //   keyword="w tynku" (0.75), item="beton" (1.50): delta=2.0 → correct!
        //   keyword="w GK" (1.88), item="żelbecie" (2.25): delta=1.196 → zelbet override catches 2.25
        //   keyword="w betonie" (1.50), item="beton" (1.50): delta=1.0 → no double-count ✓
        const kwSurfaceMod = keywordEncodesSurface
          ? getSurfaceModifier(m.matched_keyword ?? "")
          : 1.0;
        const itemSurfaceMod = getSurfaceModifier(item.name, globalCtx2);
        // Hardest Surface Rule: itemSurfaceMod ALWAYS wins if it is harder than what keyword encoded.
        // Unconditional: does NOT require keywordEncodesSurface=TRUE.
        // "tynku (beton pod spodem)" → itemSurfaceMod=1.50, kwSurfaceMod=0.75 → delta=2.0
        // kw_enc=FALSE: itemSurfaceMod=1.50 is used directly (no double-count since kwSurfaceMod=1.0)
        const forceHardSurface = itemSurfaceMod > kwSurfaceMod;
        const autoSurfaceMod = keywordEncodesSurface
          ? forceHardSurface
            ? (itemSurfaceMod / Math.max(kwSurfaceMod, 0.1))  // delta ratio: item_tier / kw_tier
            : 1.0                                              // kw already encodes correct surface
          : itemSurfaceMod;                                   // no encoding: use item directly
        const projSurfaceAdj = (!keywordEncodesSurface && autoSurfaceMod > 1.0) ? surfaceExtraMod : 1.0;
        let surfaceMod = autoSurfaceMod * projSurfaceAdj;
        // FINAL SURFACE GUARD — unconditional hard-surface tier enforcement.
        // Runs AFTER all delta / forceHardSurface logic. Cannot be bypassed.
        // Priority: żelbet(2.25) > silka(1.75) > beton(1.50). First match wins.
        // "tynku (beton pod spodem)" → surfaceMod = max(autoSurface, 1.50) ≥ 1.50.
        if (isZelbet(item.name) || isZelbet(globalCtx2)) {
          surfaceMod = Math.max(surfaceMod, 2.25);
        } else if (/silk[aąąei]|silce/i.test(item.name + " " + globalCtx2)) {
          surfaceMod = Math.max(surfaceMod, 1.75);
        } else if (/\bbeton/i.test(item.name + " " + globalCtx2)) {
          surfaceMod = Math.max(surfaceMod, 1.50);
        }
        const ceilingMod = getCeilingModifier(item.name, globalCtx2);
        const heightMod = getHeightModifier(item.name, globalCtx2);
        const warnings = buildModifierWarnings(cableMod, surfaceMod, ceilingMod);
        // Unit Scaling v2.3: normalize rawNorm from dict unit to item unit
        // formula: scaledNorm = rawNorm × (itemBaseSize / dictBaseSize)
        // → stored labor_norm is ALWAYS rbh per 1 item unit, labor_hours_total = qty × norm
        // Use item.unit directly (no guardUnit correction applied).
        const itemUnitForScale = (item.unit ?? originalItem?.unit ?? "");
        const scaledNorm = laborNorm != null
          ? scaleLaborNorm(laborNorm, esRow.unit, itemUnitForScale)
          : null;
        const dictUnit = (esRow.unit ?? "").toLowerCase().trim();
        const scaleNote = (dictUnit && dictUnit !== "mb" && dictUnit !== "m" && dictUnit !== "szt" && dictUnit !== "kpl")
          ? ` [KNR: ${dictUnit}]`
          : "";
        // Norm floors — Iron Rule: wrong keyword match CANNOT under-price hard-material work
        const itemAndCtx = item.name + " " + globalCtx2;
        // Normalize item name for ASCII regex matching (Polish ł ≠ l without this)
        const normalizedItemName = normalizePlName(item.name);
        const isConnectionItem = CONNECTION_RE.test(normalizedItemName);
        const isHeavyConnectionItem = isConnectionItem && HEAVY_APPLIANCE_RE.test(normalizedItemName + " " + item.name);
        const normWithFloor = scaledNorm != null
          ? (
              // Connection/commissioning: minimum norm prevents cable-like under-pricing
              // CRITICAL: uses normalizePlName() — Podłączenie has ł which breaks plain /^podlacz/
              isHeavyConnectionItem
                ? Math.max(scaledNorm, HEAVY_CONNECTION_MIN_NORM)        // heavy appliance ≥1.30 rbh/szt
            : isConnectionItem
                ? Math.max(scaledNorm, CONNECTION_MIN_NORM)              // general connection ≥0.50 rbh/szt
              // Hard surface norms
            : (GROOVE_FLOOR_RE.test(item.name) && isZelbet(itemAndCtx))
                ? Math.max(scaledNorm, GROOVE_ZELBET_MIN_NORM)           // bruzda w zelbet ≥0.25
            : (DRILL_FLOOR_RE.test(item.name) && isZelbet(itemAndCtx))
                ? Math.max(scaledNorm, GROOVE_ZELBET_MIN_NORM)           // wiercenie w zelbet ≥0.25
            : (DRILL_FLOOR_RE.test(item.name) && /\bbeton/i.test(itemAndCtx))
                ? Math.max(scaledNorm, DRILL_BETON_MIN_NORM)             // wiercenie w betonie ≥0.25
            : (DRILL_FLOOR_RE.test(item.name) && (itemAndCtx.toLowerCase().includes("silka") || itemAndCtx.toLowerCase().includes("silce")))
                ? Math.max(scaledNorm, DRILL_SILKA_MIN_NORM)             // wiercenie w silce ≥0.15
            : scaledNorm
            )
          : scaledNorm;
        const normFloorApplied = normWithFloor !== scaledNorm;
        // Wymiana factor: replacement = montaż + 0.5 × demontaż = base × 1.5
        const wymianaActive = WYMIANA_RE.test(item.name) || DEMONTAZ_MONTAZ_RE.test(item.name);
        const wymianaFactor = wymianaActive ? WYMIANA_FACTOR : 1.0;
        // v2.4: M-Factor REMOVED — see L0 above for rationale.
        const _l2CableSection = isCableItem(item.name) ? (() => { const _m = item.name.match(CABLE_SECTION_RE); return _m ? parseFloat(_m[2].replace(",", ".")) : null; })() : null;
        void _l2CableSection;
        const localModL2 = clampLocalModifiers(cableMod, surfaceMod, ceilingMod, heightMod);
        const sugLabBase = normWithFloor != null
          ? Math.round(normWithFloor * localModL2 * baseRateForCalc * globalLaborMod * 100) / 100
          : 0;
        // ── Absolute PLN floor for connection/commissioning items ─────────────────
        // Floor = HEAVY_CONNECTION_MIN_NORM × baseRate (M-Factor=1.0 in v2.4)
        const connectionPriceFlatFloor = isConnectionItem
          ? Math.round(
              (isHeavyConnectionItem ? HEAVY_CONNECTION_MIN_NORM : CONNECTION_MIN_NORM)
              * baseRateForCalc * globalLaborMod * 100
            ) / 100
          : 0;
        const sugLabBaseFloored = Math.max(sugLabBase, connectionPriceFlatFloor);
        const sugLab = Math.round(sugLabBaseFloored * wymianaFactor * 100) / 100;
        // Effective hours = sugLab / baseRate × qty — includes all modifiers (not bare norm × qty)
        const laborHoursTotalL2 = (scaledNorm != null && baseRateForCalc > 0)
          ? Math.round(sugLab / baseRateForCalc * (item.quantity ?? 1) * 1000) / 1000
          : null;
        const matFromDict = matL2Map.get(esRow.knr_code ?? "") ?? 0;
        const sugMat = mode === "labor" ? (item.material_price || 0) : matFromDict;
        const isPureLaborItem = isPureLaborByKeyword(item.name);
        const effectiveSugMat = isPureLaborItem ? 0 : sugMat;
        const matNote = !isPureLaborItem && effectiveSugMat === 0 && mode !== "labor"
          ? " · ⚠️ brak ceny mat. w KNR — dodaj do własnego katalogu"
          : "";
        // ── Transparent trace: every multiplier named and sourced ─────────────
        // Formula: norm × 0.75(narz) × cable × autoSurface × projSurface × rate × globalLaborMod = sugLab
        // autoSurface: 1.0 when keyword_encodes_surface (norm already correct), else getSurfaceModifier()
        // projSurface: coeff_surface project flag (1.15) — applied only when auto surface > 1.0
        // globalLaborMod: coeff_height(×1.25) × coeff_difficulty(×1.22) × complexityFactor
        const surfaceTag = forceHardSurface
          ? `${autoSurfaceMod.toFixed(2)}(żelbet-force)`
          : keywordEncodesSurface
            ? `1.0(KW-enc)`
            : autoSurfaceMod !== 1.0
              ? `${autoSurfaceMod.toFixed(2)}(podł.)${projSurfaceAdj > 1.0 ? ` ×${projSurfaceAdj.toFixed(2)}(proj)` : ""}`
              : `1.0(neutral)`;
        const ceilingTag = ceilingMod !== 1.0 ? ` ×${ceilingMod.toFixed(2)}(sufit)` : "";
        const heightTag  = heightMod  !== 1.0 ? ` ×${heightMod.toFixed(2)}(wysokość)` : "";
        const globalModTag = "";
        const normFloorTag = normFloorApplied ? `[⬆floor ${GROOVE_ZELBET_MIN_NORM}] ` : "";
        const wymianaTag = wymianaActive ? ` ×${WYMIANA_FACTOR.toFixed(1)}(wymiana)` : "";
        const capTagL2 = localModL2 >= MAX_COMBINED_MODIFIER ? ` ⚠️cap×${MAX_COMBINED_MODIFIER}` : "";
        const traceFormula = normWithFloor != null
          ? `${normFloorTag}${normWithFloor.toFixed(4)}rbh × ${localModL2.toFixed(2)}(local:${surfaceTag}${ceilingTag}${heightTag}${capTagL2}) × ${baseRateForCalc.toFixed(1)}PLN/h${globalModTag}${wymianaTag} = ${sugLab.toFixed(2)}PLN`
          : "brak normy";
        const regionModL2 = rateResult.regionModifier;
        const regionLabelL2 = projectRegionName ?? "brak";
        const regionHintL2 = regionModL2 !== 1.0
          ? ` → ×${regionModL2.toFixed(2)}(${regionLabelL2}) → ${(sugLab * regionModL2).toFixed(2)}PLN`
          : "";
        const noteFormula = normWithFloor != null
          ? ` | norma: ${normFloorTag}${normWithFloor.toFixed(4)} rbh/${itemUnitForScale} × ${localModL2.toFixed(2)}(local${capTagL2}) × ${baseRateForCalc.toFixed(1)}PLN/h${globalModTag} = ${sugLab.toFixed(2)} PLN${regionHintL2}`
          : "";
        return {
          itemId: item.id,
          name: item.name,
          unit: originalItem?.unit ?? item.unit,
          quantity: item.quantity,
          currentMaterial: item.material_price || 0,
          currentLabor: item.labor_price || 0,
          suggestedMaterial: effectiveSugMat,
          suggestedLabor: mode === "material" ? (item.labor_price || 0) : sugLab,
          laborHoursTotal: laborHoursTotalL2,
          regionModifier: regionModL2,
          confidence: isL1Hit ? "high" as const : "medium" as const,
          note: `ES-Słownik (${hitLabel}): ${m.matched_keyword ?? esRow.name} → ${esRow.knr_code}${noteFormula}${scaleNote}${warnings}${matNote}`,
          knrCode: esRow.knr_code,
          knrSource: (isL1Hit || isRegexExact) ? "official" as const : "es-synthetic" as const,
          laborNorm: normWithFloor ?? scaledNorm,
          suggestedNorm: normWithFloor ?? scaledNorm,
          isAmbiguous: false,
          trace: `${isL1Hit ? "L1" : "L2"} Hit (${hitLabel}${isRegexExact ? "/regex" : ""}): "${m.matched_keyword ?? esRow.name}" → ${esRow.knr_code} | ${traceFormula}`,
        };
      }

      // ── L2 MISS: not in personal catalog or ES-Dictionary → try L2.5 name-lookup ─
      // v2.5 Name-Lookup Fallback: Before falling through to L3 AI (which frequently
      // hallucinates KNR codes and norms), try local fuzzy name-matching against the
      // 35+ KNR JSON files via lookupKnrByName(). This catches the common failure mode
      // where Quick-Estimate AI generates wrong/fake KNR codes (e.g. "KNR 5-04 0501-01"
      // — an outdated series that doesn't exist in knr_norms) but the item name clearly
      // maps to a known norm (e.g. "Gniazdo pojedyncze" → KNR 5-08 0401, 0.68 rbh/szt).
      // Without this layer, such items went to L3 AI which hallucinated labor_norm=0.33
      // rbh (wrong) instead of the correct 0.68 rbh.
      const normalizedItemName_miss = normalizePlName(item.name);
      const isConnMiss = CONNECTION_RE.test(normalizedItemName_miss);
      const isHeavyConnMiss = isConnMiss && HEAVY_APPLIANCE_RE.test(normalizedItemName_miss + " " + item.name);

      const l25Match = lookupKnrByName(item.name);
      if (l25Match) {
        // Re-compute context + modifiers (same cascade as L2 HIT for pricing consistency)
        const itemWithCtx25 = item as typeof item & { section?: string | null; description?: string | null };
        const itemSectionCtx25 = `${itemWithCtx25.section ?? ""} ${itemWithCtx25.description ?? ""}`.trim();
        const globalCtx25 = itemSectionCtx25 || projectFallback;
        const cableMod25 = getCableComplexityModifier(item.name);
        const autoSurfaceMod25 = getSurfaceModifier(item.name, globalCtx25);
        let surfaceMod25 = autoSurfaceMod25 * (autoSurfaceMod25 > 1.0 ? surfaceExtraMod : 1.0);
        if (isZelbet(item.name) || isZelbet(globalCtx25)) surfaceMod25 = Math.max(surfaceMod25, 2.25);
        else if (/silk[aąei]|silce/i.test(item.name + " " + globalCtx25)) surfaceMod25 = Math.max(surfaceMod25, 1.75);
        else if (/\bbeton/i.test(item.name + " " + globalCtx25)) surfaceMod25 = Math.max(surfaceMod25, 1.50);
        const ceilingMod25 = getCeilingModifier(item.name, globalCtx25);
        const heightMod25 = getHeightModifier(item.name, globalCtx25);
        // Unit scaling: convert dict norm (per dict unit) to item unit (per 1 item unit)
        const itemUnitForScale25 = (item.unit ?? originalItem?.unit ?? "");
        const scaledNorm25 = scaleLaborNorm(l25Match.laborNorm, l25Match.unit, itemUnitForScale25);
        // Apply connection floor (heavy appliance or general commissioning)
        const normWithFloor25 = isHeavyConnMiss
          ? Math.max(scaledNorm25, HEAVY_CONNECTION_MIN_NORM)
          : isConnMiss
            ? Math.max(scaledNorm25, CONNECTION_MIN_NORM)
            : scaledNorm25;
        // v2.4: M-Factor REMOVED — see L0 above for rationale.
        const _l25CableSection = isCableItem(item.name)
          ? (() => { const _m = item.name.match(CABLE_SECTION_RE); return _m ? parseFloat(_m[2].replace(",", ".")) : null; })()
          : null;
        void _l25CableSection;
        const localMod25 = clampLocalModifiers(cableMod25, surfaceMod25, ceilingMod25, heightMod25);
        const wymianaActive25 = WYMIANA_RE.test(item.name) || DEMONTAZ_MONTAZ_RE.test(item.name);
        const wymianaFactor25 = wymianaActive25 ? WYMIANA_FACTOR : 1.0;
        const sugLab25Base = Math.round(normWithFloor25 * localMod25 * baseRateForCalc * globalLaborMod * 100) / 100;
        const sugLab25 = Math.round(sugLab25Base * wymianaFactor25 * 100) / 100;
        const laborHoursTotal25 = baseRateForCalc > 0
          ? Math.round(sugLab25 / baseRateForCalc * (item.quantity ?? 1) * 1000) / 1000
          : null;
        const regionHint25 = rateResult.regionModifier !== 1.0
          ? ` → ×${rateResult.regionModifier.toFixed(2)}(${projectRegionName ?? ""}) → ${(sugLab25 * rateResult.regionModifier).toFixed(2)}PLN`
          : "";
        return {
          itemId: item.id,
          name: item.name,
          unit: originalItem?.unit ?? item.unit,
          quantity: item.quantity,
          currentMaterial: item.material_price || 0,
          currentLabor: item.labor_price || 0,
          suggestedMaterial: 0, // L2.5 lookup has no material price — Task3 mat-fallback will supply
          suggestedLabor: mode === "material" ? (item.labor_price || 0) : sugLab25,
          laborHoursTotal: laborHoursTotal25,
          regionModifier: rateResult.regionModifier,
          confidence: "medium" as const,
          note: `L2.5 Name-match: "${item.name}" → ${l25Match.code} | norma: ${normWithFloor25.toFixed(4)} rbh/${itemUnitForScale25} × ${localMod25.toFixed(2)}(local) × ${baseRateForCalc.toFixed(1)}PLN/h = ${sugLab25.toFixed(2)} PLN${regionHint25}`,
          knrCode: l25Match.code,
          knrSource: isOfficialKnr(l25Match.code) ? ("official" as const) : ("es-synthetic" as const),
          laborNorm: normWithFloor25,
          suggestedNorm: normWithFloor25,
          isAmbiguous: false,
          trace: `L2.5 Name Lookup: "${item.name}" → ${l25Match.code} | ${normWithFloor25.toFixed(4)}rbh × ${localMod25.toFixed(2)}(local) × ${baseRateForCalc.toFixed(1)}PLN/h = ${sugLab25.toFixed(2)}PLN`,
        };
      }

      // L2.5 also missed → existing connection floor (or full L3 AI fallback for non-connection)
      const connFloorMiss = isConnMiss
        ? Math.round(
            (isHeavyConnMiss ? HEAVY_CONNECTION_MIN_NORM : CONNECTION_MIN_NORM)
            * baseRateForCalc * 100
          ) / 100
        : 0;
      return {
        itemId: item.id,
        name: item.name,
        unit: originalItem?.unit ?? item.unit,
        quantity: item.quantity,
        currentMaterial: item.material_price || 0,
        currentLabor: item.labor_price || 0,
        suggestedMaterial: 0,
        suggestedLabor: connFloorMiss,
        confidence: isConnMiss ? "medium" as const : "low" as const,
        note: isConnMiss
          ? `ES-Engine: Brak dokładnej normy KNR. Zastosowano minimalny koszt podłączenia: ${connFloorMiss.toFixed(2)} PLN/szt.`
          : `Brak w katalogu osobistym i ES-Dictionary. Kliknij „Wyceń" aby uruchomić wycenę AI.`,
        knrCode: null,
        knrSource: null,
        laborNorm: isConnMiss ? (isHeavyConnMiss ? HEAVY_CONNECTION_MIN_NORM : CONNECTION_MIN_NORM) : null,
        isAmbiguous: false,
        trace: isConnMiss
          ? `L2 Miss → connection floor: ${isHeavyConnMiss ? "heavy" : "std"} (${isHeavyConnMiss ? HEAVY_CONNECTION_MIN_NORM : CONNECTION_MIN_NORM}rbh × ${baseRateForCalc.toFixed(1)}PLN/h = ${connFloorMiss.toFixed(2)}PLN)`
          : "unmatched",
      };
    });

    // ── L3: Auto-batch AI estimation for all L2 misses (chunked 50/batch) ───────
    // Items that didn't match personal catalog (L1) or ES-Dictionary (L2)
    // get priced automatically via Gemini. Split into chunks of 50 to stay
    // well within token limits and prevent Vercel function timeouts.
    // Task 2: ctxMap for L3 post-processing — cable/surface complexity applied after AI response
    const l3CtxMap = new Map<string, string>(
      clearItems.map(item => {
        const t = item as typeof item & { section?: string | null; description?: string | null };
        const sectionCtx = `${t.section ?? ""} ${t.description ?? ""}`.trim();
        return [item.id, sectionCtx || projectFallback];
      })
    );

    const L3_CHUNK_SIZE = 50;
    const l2MissItems = clearItems.filter(item =>
      l2Estimates.find(e => e.itemId === item.id)?.trace === "unmatched"
    );

    if (l2MissItems.length > 0) {
      const rateSourceL3: RateSource = "manual";
      const knrInstructionL3 = buildRateSourceInstruction(rateSourceL3, baseRateForCalc);
      const hasExcavation = l2MissItems.some(item => EXCAVATION_RE.test(item.name));
      const excavationHint = hasExcavation
        ? "\nSPRZĘT (equipment_price): Dla pozycji z wykopem/pracami ziemnymi podaj koszt wynajmu sprzętu (PLN/jm). Koparka mini 1-2t=350-600 PLN/h, midi=500-900 PLN/h. equipment_norm=maszynogodzin/jm."
        : "";
      const ctxLine = investmentContextDB.trim()
        ? `\n- Kontekst inwestycji: ${investmentContextDB.trim().slice(0, 300)}`
        : "";
      const laborNormExample = (100 / baseRateForCalc).toFixed(3);
      const systemPromptL3 = `${PRICING_STATIC_SYSTEM_PROMPT}

<context>
- Region: ${regionName} (wspolczynnik regionalny: ${rateResult.regionModifier} — NIE stosuj do obliczeń, system przelicza przy wyświetlaniu)
- PROJECT_RATE: ${baseRateForCalc} PLN/rbh (stawka bazowa robocizny — uzywaj TYLKO tej wartosci do obliczania labor_price)
- Rok: 2026, ceny PLN netto (bez VAT)
- ${knrInstructionL3}${excavationHint}${ctxLine}
</context>

<task>
Wycen pozycje ktore NIE ZNALEZIONO w bazie KNR ani katalogu.
Dla KAZDEJ pozycji podaj ceny JEDNOSTKOWE (za 1 jednostke miary).
ZERO FORBIDDEN: zadna pozycja nie moze miec obu pol = 0.
NORMA OBOWIĄZKOWA: zawsze oblicz labor_norm_rbh = labor_price / PROJECT_RATE.
  Wzor: labor_norm_rbh = labor_price / ${baseRateForCalc} PLN/rbh.
  Przyklad: labor_price=100 PLN → labor_norm_rbh=${laborNormExample} rbh.
  Minimum absolutne: 0.05 rbh. NIGDY nie zwracaj 0 ani null dla labor_norm_rbh.
</task>`;

      const l3Schema = z.object({
        items: z.array(z.object({
          index: z.number().int().min(1),
          material_price: z.number().min(0),
          labor_price: z.number().min(0),
          labor_norm_rbh: z.number().min(0.05).optional(),
          equipment_price: z.number().min(0).optional().default(0),
          equipment_norm: z.number().min(0).optional().default(0),
          knr_code: z.string().nullable().optional(),
          confidence: z.enum(["high", "medium", "low"]),
          note: z.string().max(80),
        })),
      });

      const l3Map = new Map<string, { material_price: number; labor_price: number; labor_norm_rbh?: number; equipment_price?: number; equipment_norm?: number; knr_code?: string | null; confidence: "high" | "medium" | "low"; note: string }>();

      const chunks: typeof l2MissItems[] = [];
      for (let s = 0; s < l2MissItems.length; s += L3_CHUNK_SIZE) {
        chunks.push(l2MissItems.slice(s, s + L3_CHUNK_SIZE));
      }

      // M5: try Google Context Cache to reduce token costs for large KNR context
      const kbCtxForCache = buildLocalKnrContext(baseRateForCalc);
      const cacheName = await getPricingCacheName(PRICING_STATIC_SYSTEM_PROMPT, kbCtxForCache, baseRateForCalc);

      await Promise.all(chunks.map(async (chunk) => {
        try {
          const objectTypeSlug = (project.object_types as { slug?: string } | null)?.slug ?? null;
          const projectSectorL3 = detectSector(objectTypeSlug);
          const knrMultiplierL3 = 1.4; // display-time only — used for assembly RBH hints
          const itemList = buildEnrichedItemListWithAssembly(
            chunk.map((item) => ({ name: item.name, unit: item.unit, quantity: item.quantity })),
            projectSectorL3,
            knrMultiplierL3,
          );
          const batchPrompt = `Region: ${regionName} | Stawka bazowa: ${baseRateForCalc} PLN/rbh\n\n${itemList}`;

          let batchResult: z.infer<typeof l3Schema>;
          if (cacheName) {
            try {
              const { object } = await generateObject({
                model: google(CACHE_MODEL_ID as Parameters<typeof google>[0]),
                providerOptions: { google: { cachedContent: cacheName } },
                prompt: batchPrompt,
                schema: l3Schema,
                temperature: 0.1,
                maxOutputTokens: Math.min(300 + chunk.length * 70, 4096),
              });
              batchResult = object;
            } catch {
              const { object } = await generateObject({
                model: google("gemini-2.0-flash"),
                system: systemPromptL3,
                prompt: batchPrompt,
                schema: l3Schema,
                temperature: 0.1,
                maxOutputTokens: Math.min(300 + chunk.length * 70, 4096),
              });
              batchResult = object;
            }
          } else {
            const { object } = await generateObject({
              model: google("gemini-2.0-flash"),
              system: systemPromptL3,
              prompt: batchPrompt,
              schema: l3Schema,
              temperature: 0.1,
              maxOutputTokens: Math.min(300 + chunk.length * 70, 4096),
            });
            batchResult = object;
          }

          for (const aiItem of batchResult.items) {
            const entry = chunk[aiItem.index - 1];
            if (entry) l3Map.set(entry.id, aiItem);
          }
        } catch (l3Err) {
          logger.error("[L3-AI] Chunk estimation failed", { chunkSize: chunk.length, items: chunk.map(i => i.name) }, l3Err);
          // chunk failed — items stay as 0 (manual review)
        }
      }));

      // ── Intra-project price consistency: propagate L3 results to same-named items ────────
      // If "Gniazdo 230V IP44" appears 3 times and AI priced only instance 1,
      // instances 2 and 3 get the same price (avoids inconsistency within one project run).
      const l3NameCache: typeof l3Map = new Map();
      for (const [id, result] of l3Map.entries()) {
        const missItem = l2MissItems.find((m) => m.id === id);
        if (missItem) {
          const nk = normaliseName(missItem.name);
          if (!l3NameCache.has(nk)) l3NameCache.set(nk, result);
        }
      }
      for (const miss of l2MissItems) {
        if (l3Map.has(miss.id)) continue; // direct AI result exists
        const cached = l3NameCache.get(normaliseName(miss.name));
        if (cached) l3Map.set(miss.id, { ...cached, note: cached.note + " [cache]" });
      }

      for (let i = 0; i < l2Estimates.length; i++) {
        const est = l2Estimates[i];
        if (est.trace !== "unmatched") continue;
        const l3 = l3Map.get(est.itemId);
        if (!l3 || (l3.material_price === 0 && l3.labor_price === 0)) continue;
        // ── L3 post-processing: cable + surface complexity mods ─────────────────
        // CRITICAL FIX: AI receives item.name as input, so it already priced with
        // surface knowledge when the name contains a surface keyword (e.g. "ytong").
        // Applying getSurfaceModifier() again on such names is a DOUBLE-COUNT.
        // Rule: if item.name encodes surface → autoSurfaceML3 = 1.0 (AI handled it).
        //        If item.name is neutral   → apply getSurfaceModifier() from name/context.
        // surfaceExtraMod (project coeff_surface flag) is also skipped when name encodes
        // surface, because the difficulty is already specific and known.
        // B4 fix: added zbrojon|monolit to match isZelbet() coverage (zbrojony beton, monolityczny);
        // żelbe prefix covers all Polish inflections (żelbecie, żelbetowy, etc.) without trailing \b.
        const SURFACE_IN_NAME_RE = /\b(?:gazobet|siporex|ytong|bloczk|żelbe|zelbe|zbrojon|monolit|gipsokart|\bgk\b|beton|cegle?|cegł|tynk)/i;
        const nameEncodesSurface = SURFACE_IN_NAME_RE.test(est.name);
        const cML3 = getCableComplexityModifier(est.name);
        const autoSurfaceML3 = nameEncodesSurface
          ? 1.0
          : getSurfaceModifier(est.name, l3CtxMap.get(est.itemId) ?? "");
        const projSurfaceML3 = nameEncodesSurface ? 1.0 : surfaceExtraMod;
        const sML3 = autoSurfaceML3 * projSurfaceML3;
        const wL3 = buildModifierWarnings(cML3, sML3);
        // Height/ceiling modifiers for L3: AI prices base-height by default
        const l3ItemCtx = l3CtxMap.get(est.itemId) ?? "";
        const ceilingML3 = getCeilingModifier(est.name, l3ItemCtx);
        const heightML3  = getHeightModifier(est.name, l3ItemCtx);
        const localModL3 = clampLocalModifiers(cML3, sML3, ceilingML3, heightML3);
        // L3 AI sanity check vs L0 Canonical baseline. If AI norm deviates by
        // >3× or <0.33× from a known canonical pattern, override with canonical
        // norm + recompute price. Catches AI hallucinations like 0.025 rbh/mb
        // for YDYp 3×1.5 (canonical = 0.13).
        let l3LaborNorm = l3.labor_norm_rbh ?? null;
        let l3LaborPriceRaw = Math.round(l3.labor_price * 100) / 100;
        let l3SanityNote = "";
        if (l3LaborNorm != null && l3LaborNorm > 0) {
          const sanity = validateAgainstCanonicalL0(est.name, est.guardedUnit ?? est.unit, l3LaborNorm);
          if (!sanity.ok) {
            const corrected = sanity.canonical.laborNorm;
            l3LaborNorm = corrected;
            l3LaborPriceRaw = Math.round(corrected * baseRateForCalc * 100) / 100;
            l3SanityNote = ` ⚠️ L3 norm ${(sanity.deviation).toFixed(2)}× off canonical → korekta na ${corrected.toFixed(4)} rbh (${sanity.canonical.knrCode})`;
            logger.error(`[L0 Sanity] L3 norm rejected for "${est.name}"`, {
              aiNorm: l3.labor_norm_rbh,
              canonical: corrected,
              deviation: sanity.deviation,
              knrCode: sanity.canonical.knrCode,
            });
          }
        }
        const adjLab = Math.round(l3LaborPriceRaw * localModL3 * globalLaborMod * 100) / 100;
        // L3 trace: show surface source explicitly
        const surfaceTagL3 = nameEncodesSurface
          ? `×1.0(name-enc)`
          : autoSurfaceML3 !== 1.0
            ? `×${autoSurfaceML3.toFixed(2)}(auto)${projSurfaceML3 > 1.0 ? `×${projSurfaceML3.toFixed(2)}(proj)` : ""}`
            : `×1.0(neutral)`;
        const capTagL3 = localModL3 >= MAX_COMBINED_MODIFIER ? ` ⚠️cap×${MAX_COMBINED_MODIFIER}` : "";
        const globalModTagL3 = "";
        l2Estimates[i] = {
          ...est,
          suggestedMaterial: mode === "labor" ? est.currentMaterial
            : clampPrice(est.name, est.guardedUnit ?? est.unit, Math.round(l3.material_price * 100) / 100, "material"),
          suggestedLabor: mode === "material" ? est.currentLabor : adjLab,
          equipmentPrice: l3.equipment_price ?? 0,
          equipmentNorm: l3.equipment_norm ?? 0,
          confidence: l3.confidence,
          laborNorm: l3LaborNorm,
          note: `L3 AI: ${l3.note} | ×${cML3.toFixed(2)}(kabel) ${surfaceTagL3}(podł)${wL3}${l3SanityNote}`,
          knrCode: (() => {
            const raw = l3.knr_code ?? null;
            if (raw && isSyntheticKnr(raw)) {
              logger.error(`[Hard-Link v2.2] BLOCKED synthetic KNR "${raw}" for "${est.name}"`, {});
              return null;
            }
            return raw;
          })(),
          knrSource: (l3.knr_code && !isSyntheticKnr(l3.knr_code) && isOfficialKnr(l3.knr_code)) ? "official" : (l3.knr_code && !isSyntheticKnr(l3.knr_code)) ? "es-synthetic" : null,
          trace: `L3 AI Batch (${l3.confidence}) | ×${localModL3.toFixed(2)}(local:kabel${surfaceTagL3}${capTagL3})${globalModTagL3} → adjLab=${adjLab.toFixed(2)}PLN`,
        };
      }
    }
    // ─── Task 3: Zero-material fallback — ALL tiers (L0 + L1 + L2) ─────────────
    // BUG FIX: Previously only l2Estimates were checked. Items that already had
    // knr_code stored in DB (from a prior run) go through L0 → l0Estimates, so
    // Task 3 never caught them. Now we collect zero-material items from every tier.
    if (mode !== "labor") {
      // Skip items that already have material OR are confirmed pure-labour services
      const isPureLaborOrSkip = (e: AiPriceEstimate) =>
        e.suggestedMaterial > 0 || isPureLaborByKeyword(e.name);

      // Also force-include MATERIAL_MANDATORY items that still have 0 material,
      // even if suggestedMaterial was accidentally set to a tiny non-zero value by KNR.
      const isMandatoryWithLowMat = (e: AiPriceEstimate) =>
        isMaterialMandatory(e.name) && e.suggestedMaterial < 0.50;

      const zeroMatL0 = l0Estimates.filter((e) => !isPureLaborOrSkip(e) || isMandatoryWithLowMat(e));
      const zeroMatL1 = l1Estimates.filter((e) => !isPureLaborOrSkip(e) || isMandatoryWithLowMat(e));
      const zeroMatL2 = l2Estimates.filter(
        (e) =>
          (!isPureLaborOrSkip(e) || isMandatoryWithLowMat(e)) &&
          // In material-only mode suggestedLabor=0 (labor not yet applied to DB)
          (mode === "material" || e.suggestedLabor > 0),
      );
      const zeroMatAll = [...zeroMatL0, ...zeroMatL1, ...zeroMatL2];

      logger.info(`[Task3-MatFallback] mode=${mode} zeroMat: L0=${zeroMatL0.length} L1=${zeroMatL1.length} L2=${zeroMatL2.length} total=${zeroMatAll.length}`);

      if (zeroMatAll.length > 0) {
        try {
          const { data: adminSettingsRow } = await supabase
            .from("admin_settings")
            .select("material_inflation_multiplier")
            .limit(1)
            .single();
          const inflationMult =
            Number(adminSettingsRow?.material_inflation_multiplier) || 1.0;

          // ── v10.5: Benchmark-first strategy ─────────────────────────────────
          // Check material_benchmarks.ts BEFORE calling AI.
          // Items with a benchmark match get real wholesale prices instantly.
          // Only items WITHOUT a benchmark go to Gemini (saves API calls + more accurate).
          const benchmarkResolved: AiPriceEstimate[] = [];
          const needsAiFallback: AiPriceEstimate[] = [];

          for (const est of zeroMatAll) {
            const unit = est.guardedUnit ?? est.unit;
            const bench = findMaterialBenchmark(est.name, unit);
            if (bench) {
              const benchPrice = Math.round(bench.avg * inflationMult * 100) / 100;
              benchmarkResolved.push(est);
              // Apply directly to the correct tier's estimate array
              const updatedFields = { suggestedMaterial: benchPrice, matSource: "knr" as const };
              const suffix = ` | 📊 Benchmark: ${bench.avg.toFixed(2)} PLN/${bench.unit} (${bench.category})`;
              const l0Idx = l0Estimates.findIndex((e) => e.itemId === est.itemId);
              if (l0Idx >= 0) { l0Estimates[l0Idx] = { ...l0Estimates[l0Idx], ...updatedFields, note: l0Estimates[l0Idx].note + suffix }; continue; }
              const l1Idx = l1Estimates.findIndex((e) => e.itemId === est.itemId);
              if (l1Idx >= 0) { l1Estimates[l1Idx] = { ...l1Estimates[l1Idx], ...updatedFields, note: l1Estimates[l1Idx].note + suffix }; continue; }
              const l2Idx = l2Estimates.findIndex((e) => e.itemId === est.itemId);
              if (l2Idx >= 0) { l2Estimates[l2Idx] = { ...l2Estimates[l2Idx], ...updatedFields, note: l2Estimates[l2Idx].note + suffix }; }
            } else {
              needsAiFallback.push(est);
            }
          }

          logger.info(`[Task3-MatFallback] benchmark=${benchmarkResolved.length} ai-needed=${needsAiFallback.length}`);

          // Schema: keep note short (≤20 chars) to avoid hitting maxOutputTokens
          const matFallbackSchema = z.object({
            items: z.array(
              z.object({
                index: z.number().int().min(1),
                material_price: z.number().min(0),
                note: z.string().max(20),
              }),
            ),
          });

          // Process in chunks of 15 to prevent finishReason=length on large projects
          const TASK3_CHUNK = 15;
          const applyMatItem = (target: AiPriceEstimate, price: number, noteStr: string) => {
            const rawMat = Math.round(price * 100) / 100;
            // v10.5: Benchmark clamp — if we have a benchmark, use it to validate AI price
            const { price: benchClamped } = clampToBenchmark(target.name, target.guardedUnit ?? target.unit, rawMat);
            const clampedMat = clampPrice(target.name, target.guardedUnit ?? target.unit, benchClamped, "material");
            if (clampedMat <= 0) return;
            const updatedFields = { suggestedMaterial: clampedMat, matSource: "ai-market" as const };
            const suffix = ` | ~rynk.: ${noteStr} (×${inflationMult.toFixed(2)})`;
            const l0Idx = l0Estimates.findIndex((e) => e.itemId === target.itemId);
            if (l0Idx >= 0) { l0Estimates[l0Idx] = { ...l0Estimates[l0Idx], ...updatedFields, note: l0Estimates[l0Idx].note + suffix }; return; }
            const l1Idx = l1Estimates.findIndex((e) => e.itemId === target.itemId);
            if (l1Idx >= 0) { l1Estimates[l1Idx] = { ...l1Estimates[l1Idx], ...updatedFields, note: l1Estimates[l1Idx].note + suffix }; return; }
            const l2Idx = l2Estimates.findIndex((e) => e.itemId === target.itemId);
            if (l2Idx >= 0) { l2Estimates[l2Idx] = { ...l2Estimates[l2Idx], ...updatedFields, note: l2Estimates[l2Idx].note + suffix }; }
          };

          // v10.5: Build price reference context for AI prompt (top categories)
          const priceRefContext = buildBenchmarkPromptContext();

          for (let ci = 0; ci < needsAiFallback.length; ci += TASK3_CHUNK) {
            const chunk = needsAiFallback.slice(ci, ci + TASK3_CHUNK);
            const chunkList = chunk
              .map((e, idx) => `${idx + 1}. "${e.name}" | jm: ${e.guardedUnit ?? e.unit}`)
              .join("\n");

            logger.info(`[Task3-MatFallback] chunk ${Math.floor(ci / TASK3_CHUNK) + 1}/${Math.ceil(needsAiFallback.length / TASK3_CHUNK)} (${chunk.length} items)`);

            try {
              const { object: chunkResult } = await generateObject({
                model: google("gemini-2.0-flash"),
                system: `Podaj ceny MATERIAŁÓW netto hurtowe 2026 PLN/jm dla elektroinstalacji. ×${inflationMult.toFixed(2)}. note: max 3 słowa. Zero FORBIDDEN.\n\n${priceRefContext}`,
                prompt: chunkList,
                schema: matFallbackSchema,
                temperature: 0.1,
                maxOutputTokens: Math.min(180 + chunk.length * 55, 1536),
              });

              logger.info(`[Task3-MatFallback] chunk returned ${chunkResult.items.length} items`);

              for (const matItem of chunkResult.items) {
                if (matItem.material_price <= 0) continue;
                const target = chunk[matItem.index - 1]; // index is relative to chunk
                if (!target) continue;
                applyMatItem(target, matItem.material_price, matItem.note);
              }
            } catch (chunkErr) {
              logger.error(`[Task3-MatFallback] chunk ${Math.floor(ci / TASK3_CHUNK) + 1} FAILED`, {}, chunkErr);
            }
          }
        } catch (matFallbackErr) {
          logger.error("[Task3-MatFallback] AI material fallback failed", { count: zeroMatAll.length }, matFallbackErr);
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────


    // ── Safety pass: enforce keyword rules + apply project-level material safety factors ────
    const enforceKeywordRules = (e: AiPriceEstimate): AiPriceEstimate => {
      // Rule 1: pure-labour items must always have material = 0
      if (isPureLaborByKeyword(e.name) && e.suggestedMaterial > 0) {
        return { ...e, suggestedMaterial: 0, matSource: null };
      }
      // Rule 2 (labor pass): demontaż = 65% of montaż labor norm (KNR 4-03 methodology)
      const demontazLabor = applyDemontazRule(e.suggestedLabor, e.name);
      if (demontazLabor !== e.suggestedLabor) {
        const existingNote = e.note ?? "";
        const suffix = existingNote.includes("KNR 4-03") ? "" : " | KNR 4-03 ×0.65";
        return { ...e, suggestedLabor: demontazLabor, note: existingNote + suffix };
      }
      if (mode === "labor") return e; // material unchanged in labor-only mode
      // v3.1: Bulk discount for large cable orders (>100 mb)
      if (e.suggestedMaterial > 0 && isMaterialMandatory(e.name)) {
        const itemUnit = (e.guardedUnit ?? e.unit ?? "").toLowerCase().trim();
        const isLinear = itemUnit === "mb" || itemUnit === "m";
        if (isLinear && isCableItem(e.name) && (e.quantity ?? 0) > 100) {
          const mat = Math.round(e.suggestedMaterial * 0.95 * 100) / 100;
          return { ...e, suggestedMaterial: mat, note: e.note + " | -5% bulk" };
        }
      }
      return e;
    };

    // v10.1: Inject investment context into estimates so securityAuditLayer
    // can detect hard-surface keywords (zelbet/beton) even when they appear
    // ONLY in the AI Context box, not in the item name itself.
    const rawEstimates = [...l0Estimates, ...l1Estimates, ...l2Estimates, ...ambiguousEstimates]
      .map(e => investmentContextDB ? { ...e, hardContext: investmentContextDB.slice(0, 300) } : e);
    const estimates = rawEstimates
      .map(enforceKeywordRules)
      .map(e => applySanityCheck(e, baseRateForCalc))
      // EXPERT GUARD: final pass — enforces connection PLN floor + hard surface floor
      .map(e => enforceExpertGuards(e, baseRateForCalc, globalLaborMod))
      // REALITY CHECK v1.2: Hardness Guard + Gravity Guard + Safety Integrity.
      // Raises prices for hard materials, overhead work; adds safetyNote for RCD/MCB check.
      .map(e => {
        const rc = applyRealityCheck(e);
        return {
          ...e,
          suggestedLabor:  rc.suggestedLabor,
          calculationLog:  rc.calculationLog || e.calculationLog,
          note:            rc.note || e.note,
          safetyNote:      rc.safetyNote,
        };
      })
      // NUCLEAR VETO: hardcoded PLN floors — zero runtime dependencies.
      .map(securityAuditLayer);

    // ── Assembly Template Override ───────────────────────────────────────────────────────────────
    // For ZESTAW/BIALY_MONTAZ/TRASY/ROZDZIELNICA trigger items: replace AI-estimated prices with template-
    // derived prices. This ensures dialog preview ≡ table display ≡ summary totals.
    // Iron Rule: store BASE prices (knrMult = 1.0). Display layers apply knrMult at render time.
    //
    // Zestaw Engine v2 (2026-05-04): skip this override entirely when the project has
    // auto_detect_zestawy=false. Without the project flag the user does NOT expect template
    // prices to silently replace AI estimates — the AI result (already benchmarked against
    // KNR norms + L0 canonical) stands as the authoritative line price.
    const autoDetectZestawy = Boolean(
      (project as { auto_detect_zestawy?: boolean }).auto_detect_zestawy
    );
    if (!autoDetectZestawy) {
      return { success: true, estimates };
    }
    const assemblySector = detectSector((project.object_types as { slug?: string } | null)?.slug);
    const assemblyEstimates = estimates.map((e) => {
      if (e.isAmbiguous || e.trace === "unmatched") return e;
      // v2.6.2 L0 guard: items resolved by L0 Canonical (lib/services/canonical-knr-l0.ts)
      // or STEP 0 direct KNR lookup are STANDALONE authoritative entries from the user's
      // kosztorys (e.g. "Bruzdowanie w cegle" billed separately from cable laying — the
      // user already has separate YDYp/UTP cable lines and puszka lines). Bundling them
      // via assembly expansion (TRASY_RESIDENTIAL = bruzd 0.85 + kabel 0.13 = 0.98 rbh/mb)
      // would (a) double-count materials/labor against the user's other line items and
      // (b) overwrite the canonical KNR 2026 norm with a bundled total. Skip expansion.
      const traceStr = (e.trace ?? "");
      if (traceStr.startsWith("L0 Direct KNR") || traceStr.startsWith("L0 Canonical")) {
        return e;
      }
      const qty = e.quantity || 1;
      const expansion = expandToAssembly(e.name, qty, assemblySector, baseRateForCalc, 1.0);
      if (!expansion.triggered) return e;
      const labPerUnit = Math.round(expansion.totalLaborPLN / qty * 100) / 100;
      const matPerUnit = Math.round(expansion.totalMaterialPLN / qty * 100) / 100;
      return { ...e, suggestedLabor: labPerUnit, suggestedMaterial: matPerUnit };
    });
    return { success: true, estimates: assemblyEstimates };
  } catch (error) {
    logger.error("estimatePricesWithAI error:", {}, error);
    return { success: false, error: "Wystapil blad podczas wyceny AI" };
  }
}

// ─────────────────────────────────────────────────────────────────
// repriceSingleItem
// Re-estimates one ambiguous item with user-provided overrides.
// ─────────────────────────────────────────────────────────────────

export interface RepriceSingleOptions {
  itemId: string;
  projectId: string;
  overrideUnit?: string;       // user-corrected unit (e.g. "szt" instead of "mb")
  extraContext?: string;       // extra detail for AI (e.g. "kabel zewnętrzny układany w ziemi")
  presetPercent?: number;      // e.g. 2 → material = 2% of project material sum
  /**
   * v4.0 (Phase 3): when true, suggestedMaterial is echoed from the current row's
   * material_price instead of running L2/L3 AI. Used by the labor-only preview
   * modal so that "Koryguj" never hallucinates a new material price.
   * L1 catalog match still returns the catalog's material (user-owned data).
   */
  laborOnly?: boolean;
}

export async function repriceSingleItem(
  opts: RepriceSingleOptions
): Promise<{ success: boolean; estimate?: AiPriceEstimate; error?: string }> {
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.aiPricing);
    if ("error" in guard) return { success: false, error: guard.error };
    const { user, supabase } = guard;

    const canEdit = await canUserEditProject(supabase, opts.projectId, user.id);
    if (!canEdit) return { success: false, error: "Nie masz uprawnień do tego projektu" };

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions (name, price_modifier)")
      .eq("id", opts.projectId)
      .single();
    if (!project) return { success: false, error: "Projekt nie znaleziony" };

    const { data: item } = await supabase
      .from("project_items")
      .select("id, name, unit, quantity, material_price, labor_price, final_material_price, final_labor_price")
      .eq("id", opts.itemId)
      .eq("project_id", opts.projectId)
      .single();
    if (!item) return { success: false, error: "Nie znaleziono pozycji" };

    const effectiveUnit = opts.overrideUnit ?? item.unit ?? "szt";

    // ── Preset mode (e.g. 2% of project materials) ───────────────────────────
    if (opts.presetPercent != null && opts.presetPercent > 0) {
      const { data: allItems } = await supabase
        .from("project_items")
        .select("final_material_price, material_price, quantity")
        .eq("project_id", opts.projectId);

      const matSum = ((allItems ?? []) as { final_material_price: number | null; material_price: number | null; quantity: number }[]).reduce((acc: number, i) => {
        return acc + ((i.final_material_price ?? i.material_price ?? 0)) * i.quantity;
      }, 0);
      const presetVal = Math.round((matSum * opts.presetPercent) / 100 * 100) / 100;

      return {
        success: true,
        estimate: {
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          guardedUnit: opts.overrideUnit !== item.unit ? opts.overrideUnit : undefined,
          quantity: item.quantity,
          currentMaterial: item.final_material_price ?? item.material_price ?? 0,
          currentLabor: item.final_labor_price ?? item.labor_price ?? 0,
          suggestedMaterial: presetVal,
          suggestedLabor: 0,
          confidence: "medium" as const,
          note: `Preset ${opts.presetPercent}% sumy materiałów (${Math.round(matSum)} PLN)`,
          knrCode: null,
          knrSource: "es-synthetic" as const,
          laborNorm: null,
          isAmbiguous: false,
        },
      };
    }

    // ── FIX b4: Try L1 personal catalog FIRST (no AI cost) ───────────────────
    const { data: userCatalogForRepriceRaw } = await supabase
      .from("catalog_items")
      .select("name, unit, base_material_price, base_labor_price, knr_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(500);
    type CatalogRow = { name: string; unit: string; base_material_price: number; base_labor_price: number; knr_code: string | null };
    const userCatalogForReprice = (userCatalogForRepriceRaw ?? []) as CatalogRow[];

    if (userCatalogForReprice.length > 0 && !opts.extraContext && !opts.overrideUnit) {
      const catalogForMatch = userCatalogForReprice.map((c: CatalogRow) => ({
        id: c.name,
        name: c.name,
        unit: c.unit,
        base_material_price: c.base_material_price,
        base_labor_price: c.base_labor_price,
        knr_code: c.knr_code ?? null,
      }));
      const priceModifierForL1 = (project.regions as { price_modifier: number } | null)?.price_modifier ?? 1.0;
      const regionNameForL1 = (project.regions as { name: string } | null)?.name ?? "Polska";
      const l1Match = findBestCatalogMatchWithHint(item.name, catalogForMatch).match;
      if (l1Match) {
        // Iron Rule: material sovereign. Labor stored as BASE — calcRowPrices applies regionModifier at display
        const rawMat = Math.round((l1Match.base_material_price ?? 0) * 100) / 100;
        const rawLab = Math.round((l1Match.base_labor_price ?? 0) * 100) / 100;
        return {
          success: true,
          estimate: {
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            currentMaterial: item.final_material_price ?? item.material_price ?? 0,
            currentLabor: item.final_labor_price ?? item.labor_price ?? 0,
            suggestedMaterial: rawMat,
            suggestedLabor: rawLab,
            confidence: "high" as const,
            note: `P1: Twój katalog → ${l1Match.name}${priceModifierForL1 !== 1.0 ? ` (×${priceModifierForL1} ${regionNameForL1})` : ""}`,
            knrCode: l1Match.knr_code ?? null,
            knrSource: "catalog-l1" as const,
            laborNorm: null,
            isAmbiguous: false,
            trace: `repriceSingleItem L1 Hit: ${l1Match.name}`,
          },
        };
      }
    }

    // ── AI repricing ────────────────────────────────────────────────────────
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("investment_context, hourly_rate")
      .eq("id", user.id)
      .single();
    const projectLaborRateRepr = (project.default_hourly_rate as number | null) ?? 0;
    // Fallback: if project rate = 0, use global profile rate
    const profileHourlyRateRepr = (userProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;
    const effectiveLaborRateRepr = projectLaborRateRepr > 0 ? projectLaborRateRepr : profileHourlyRateRepr;
    const regionNameForRate = (project.regions as { name: string; price_modifier: number } | null)?.name || null;
    const rateResult = await getEffectiveRate(regionNameForRate, effectiveLaborRateRepr);
    if (rateResult.usedDefaultRate) {
      return { success: false, error: "Nie ustawiono stawki robocizny. Ustaw stawkę w ustawieniach (PLN/rbh)." };
    }
    const baseRateForCalc = rateResult.regionModifier > 0
      ? Math.round((rateResult.laborRate / rateResult.regionModifier) * 100) / 100
      : rateResult.laborRate;
    const rateSource: RateSource = "manual";

    // ── L2.5 Name-Based KNR Lookup (pre-AI) ─────────────────────────────
    // v2.5: Before calling Gemini for single-item repricing, try fuzzy name match
    // against local KNR JSON files. Skip when user provided extraContext
    // (signaling they want AI to consider that context) or overrideUnit.
    if (!opts.extraContext && !opts.overrideUnit) {
      const l25Repr = lookupKnrByName(item.name);
      if (l25Repr) {
        const cableModR = getCableComplexityModifier(item.name);
        const surfaceModR = getSurfaceModifier(item.name, "");
        const ceilingModR = getCeilingModifier(item.name, "");
        const heightModR = getHeightModifier(item.name, "");
        const localModR = clampLocalModifiers(cableModR, surfaceModR, ceilingModR, heightModR);
        const scaledNormR = scaleLaborNorm(l25Repr.laborNorm, l25Repr.unit, effectiveUnit);
        const isConnR = CONNECTION_RE.test(normalizePlName(item.name));
        const isHeavyR = isConnR && HEAVY_APPLIANCE_RE.test(normalizePlName(item.name) + " " + item.name);
        const normFloorR = isHeavyR ? Math.max(scaledNormR, HEAVY_CONNECTION_MIN_NORM)
          : isConnR ? Math.max(scaledNormR, CONNECTION_MIN_NORM)
          : scaledNormR;
        // v2.4: M-Factor REMOVED — see L0 above for rationale.
        const wymianaActiveR = WYMIANA_RE.test(item.name) || DEMONTAZ_MONTAZ_RE.test(item.name);
        const wymianaFactorR = wymianaActiveR ? WYMIANA_FACTOR : 1.0;
        const sugLabRBase = Math.round(normFloorR * localModR * baseRateForCalc * 100) / 100;
        const sugLabR = Math.round(sugLabRBase * wymianaFactorR * 100) / 100;
        const rawL25ReprEst: AiPriceEstimate = {
          itemId: item.id, name: item.name, unit: item.unit, quantity: item.quantity,
          currentMaterial: item.final_material_price ?? item.material_price ?? 0,
          currentLabor: item.final_labor_price ?? item.labor_price ?? 0,
          suggestedMaterial: 0, // material handled separately via benchmarks
          suggestedLabor: sugLabR,
          confidence: "medium" as const,
          note: `L2.5 Name-match: ${item.name} → ${l25Repr.code} (${normFloorR.toFixed(4)} rbh/${effectiveUnit} × ${localModR.toFixed(2)} × ${baseRateForCalc} PLN/h)`,
          knrCode: l25Repr.code,
          knrSource: isOfficialKnr(l25Repr.code) ? "official" : "es-synthetic",
          laborNorm: normFloorR,
          isAmbiguous: false,
          trace: `L2.5 reprice pre-AI match: ${l25Repr.code}`,
        };
        const processedReprL25 = applyPostProcessPipeline(rawL25ReprEst, baseRateForCalc, 1.0);
        // v4.0 (Phase 3): laborOnly guard — preserve current material, never echo AI estimate
        if (opts.laborOnly) {
          processedReprL25.suggestedMaterial = item.final_material_price ?? item.material_price ?? 0;
        }
        return { success: true, estimate: processedReprL25 };
      }
    }

    const regionName = (project.regions as { name: string; price_modifier: number } | null)?.name || "Polska";
    const priceModifier = (project.regions as { name: string; price_modifier: number } | null)?.price_modifier || 1.0;
    const knrInstruction = buildRateSourceInstruction(rateSource, baseRateForCalc);

    const itemLine = `1. "${item.name}" | jm: ${effectiveUnit} | ilosc: ${item.quantity} (NIE MNOZ!)${opts.extraContext ? ` | dodatkowy kontekst: ${opts.extraContext}` : ""}`;

    // v3.0: build project-level context for AI consistency
    const { data: projectItemsForCtx } = await supabase
      .from("project_items")
      .select("material_price, final_material_price, labor_price, final_labor_price, quantity")
      .eq("project_id", opts.projectId)
      .limit(200);
    type CtxItem = { material_price: number | null; final_material_price: number | null; labor_price: number | null; final_labor_price: number | null; quantity: number };
    const ctxItems = (projectItemsForCtx ?? []) as CtxItem[];
    const ctxTotalNet = ctxItems.reduce((s: number, i: CtxItem) => {
      return s + (i.final_material_price ?? i.material_price ?? 0) * i.quantity
                + (i.final_labor_price  ?? i.labor_price  ?? 0) * i.quantity;
    }, 0);
    const ctxComplexity = (project.complexity_factor as number | null) ?? 1.0;
    const ctxComplexLabel = ctxComplexity >= 1.25 ? "Smart/KNX/BMS" : ctxComplexity >= 1.15 ? "Przemys\u0142owy" : "Standard";
    const ctxProjectName = (project.name as string | null) ?? "";

    const { object: estResult } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: `${PRICING_STATIC_SYSTEM_PROMPT}
<context>
- Stawka robocizny: ${baseRateForCalc} PLN/rbh (BAZOWA — bez wsp. regionalnego)
- WAŻNE: Podaj cenę przy tej stawce BAZOWEJ. NIE stosuj współczynnika regionalnego — system robi to automatycznie.
- źródło stawki: ${rateSource === "manual" ? "Własna Stawka" : "ES-Engine 2026"}
- Rok: 2026, ceny PLN netto
- ${knrInstruction}
</context>
<project_context>
- Projekt: "${ctxProjectName}" | Typ: ${ctxComplexLabel} (complexity ${ctxComplexity})
- Szacunkowa wartosc projektu: ~${Math.round(ctxTotalNet)} PLN netto
- Skala: ${ctxTotalNet > 100000 ? "duza inwestycja" : ctxTotalNet > 20000 ? "sredni projekt" : "maly projekt"}
- WAZNE: cena tej pozycji MUSI byc spojna z wycena calego projektu tej skali.
</project_context>`,
      prompt: `Wycen JEDN\u0104 pozycj\u0119 z podan\u0105 POPRAWION\u0104 jednostk\u0105/kontekstem:\n\n${itemLine}\n\nPodaj cen\u0119 jednostkow\u0105 (za 1 ${effectiveUnit}).`,
      schema: z.object({
        estimates: z.array(z.object({
          index: z.number(),
          material_price: z.number(),
          labor_price: z.number(),
          labor_norm: z.number().nullable().optional(),
          knr_code: z.string().nullable().optional(),
          knr_source: z.enum(["official", "es-synthetic"]).nullable().optional(),
          confidence: z.enum(["high", "medium", "low"]),
          note: z.string(),
        })),
      }),
      temperature: 0.1,
      maxOutputTokens: 2000,
    });

    const e = estResult.estimates[0];
    if (!e) return { success: false, error: "AI nie zwróciło wyceny" };

    const adjLabor = Math.round((e.labor_price || 0) * 100) / 100;
    // Keyword safety: pure-labour items must have material=0; all AI prices pass through clampPrice
    const rawMatRepr = Math.round((e.material_price || 0) * 100) / 100;
    const clampedMatRepr = isPureLaborByKeyword(item.name)
      ? 0
      : clampPrice(item.name, effectiveUnit, rawMatRepr, "material");

    const rawKnrRepr = (() => {
      const raw = e.knr_code ?? null;
      if (raw && isSyntheticKnr(raw)) {
        logger.error(`[Hard-Link v2.2] BLOCKED synthetic KNR "${raw}" for repriceSingleItem "${item.name}"`, {});
        return null;
      }
      return raw;
    })();
    const knrSourceRepr = (() => {
      const raw = e.knr_code ?? null;
      if (!raw || isSyntheticKnr(raw)) return null;
      return (e.knr_source ?? "es-synthetic") as "official" | "es-synthetic";
    })();

    // ── P4 FIX: Apply full post-processing pipeline (was missing before v10.5) ──
    // repriceSingleItem previously only applied demontaż + clampPrice, bypassing:
    // applySanityCheck, enforceExpertGuards, realityCheck, securityAuditLayer.
    const rawEstRepr: AiPriceEstimate = {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      guardedUnit: opts.overrideUnit && opts.overrideUnit !== item.unit ? opts.overrideUnit : undefined,
      quantity: item.quantity,
      currentMaterial: item.final_material_price ?? item.material_price ?? 0,
      currentLabor: item.final_labor_price ?? item.labor_price ?? 0,
      suggestedMaterial: clampedMatRepr,
      suggestedLabor: adjLabor,
      confidence: e.confidence,
      note: `Uścisłone${opts.extraContext ? ` (${opts.extraContext})` : ""}${opts.overrideUnit && opts.overrideUnit !== item.unit ? ` | jm. zmieniono: ${item.unit}→${opts.overrideUnit}` : ""}: ${e.note}`,
      knrCode: rawKnrRepr,
      knrSource: knrSourceRepr,
      laborNorm: e.labor_norm ?? null,
      isAmbiguous: false,
      trace: `repriceSingleItem AI (${e.confidence})`,
    };
    const processedRepr = applyPostProcessPipeline(rawEstRepr, baseRateForCalc, 1.0);
    // v4.0 (Phase 3): laborOnly guard — preserve current material, never overwrite with AI estimate
    if (opts.laborOnly) {
      processedRepr.suggestedMaterial = item.final_material_price ?? item.material_price ?? 0;
    }

    return {
      success: true,
      estimate: processedRepr,
    };
  } catch (error) {
    logger.error("repriceSingleItem error:", {}, error);
    return { success: false, error: "B\u0142\u0105d repricing AI" };
  }
}

// ─────────────────────────────────────────────────────────────────
// applyAiPrices
// Writes AI-estimated prices directly to project_items.
// ─────────────────────────────────────────────────────────────────

export async function applyAiPrices(
  projectId: string,
  prices: {
    itemId: string;
    material_price: number;
    labor_price: number;
    equipment_price?: number;
    note?: string;               // AiPriceEstimate.note → saved as confidence_note
    unit?: string | null;
    knr_code?: string | null;
    knr_source?: string | null;
    labor_norm?: number | null;
    labor_hours_total?: number | null; // pre-calculated effective hours (with all modifiers)
    suggested_norm?: number | null;
    confidence_level?: "verified" | "analog" | "estimated" | "uncertain" | "unmatched" | null;
    expert_override?: boolean;    // SAL flag: price was raised to expert floor
    is_low_confidence?: boolean;  // SAL flag: heavy noun without action verb → manual check needed
    calculation_log?: string;     // SAL explainability trace (max 500 chars)
  }[],
  options?: {
    /**
     * v4.0 (Phase 2): When "labor", NEVER touch material_price / final_material_price /
     * equipment_price. Only labor fields are updated. This enforces the Iron Rule:
     * "Wyceń robociznę" must never silently overwrite material prices with AI echoes.
     * Default "all" preserves legacy behaviour.
     */
    mode?: "labor" | "all";
  }
): Promise<{
  success: boolean;
  updatedCount: number;
  /** v4.0 (Phase 3): rows where norm_protected / manual / expert_override was set —
   *  labor_norm was NOT overwritten. UI shows a toast so users know these were skipped. */
  protectedCount?: number;
  error?: string;
}> {
  try {
    const guard = await checkAuthOnly();
    if ("error" in guard) return { success: false, updatedCount: 0, error: guard.error };
    const { user, supabase } = guard;

    const canEdit = await canUserEditProject(supabase, projectId, user.id);
    if (!canEdit) return { success: false, updatedCount: 0, error: "Nie masz uprawnień" };

    const { data: project } = await supabase
      .from("projects")
      .select("id, status, user_id")
      .eq("id", projectId)
      .single();

    if (!project) return { success: false, updatedCount: 0, error: "Projekt nie znaleziony" };
    if (project.status === "final") return { success: false, updatedCount: 0, error: "Projekt zablokowany" };

    const adminClient = createAdminClient();
    const now = new Date().toISOString();
    // v4.0 (Phase 2): labor-only mode — never touch material fields
    const laborOnlyMode = options?.mode === "labor";

    // Protected Data Logic v2.2 — pre-fetch current item state in one batch
    const itemIds = prices.map((p) => p.itemId);
    const { data: currentItems } = await adminClient
      .from("project_items")
      .select("id, labor_norm, norm_protected, knr_code, material_price, final_labor_price, quantity, confidence_level, expert_override")
      .in("id", itemIds);

    type CurrentItem = { id: string; labor_norm: number | null; norm_protected: boolean; knr_code: string | null; material_price: number | null; final_labor_price: number | null; quantity: number; confidence_level: string | null; expert_override: boolean | null };
    const currentMap = new Map<string, CurrentItem>(
      (currentItems ?? []).map((item) => [item.id as string, item as CurrentItem])
    );

    // FIX a4: parallel Promise.all instead of sequential N+1 loop
    // v4.0 (Phase 3): track which rows were protected so we can surface a toast.
    const updateResults = await Promise.all(
      prices.map(async (p): Promise<{ ok: boolean; wasProtected: boolean }> => {
        const current = currentMap.get(p.itemId);

        // Protected Data Logic:
        // 1. Manual override — skip engine entirely
        if (current?.confidence_level === "manual") return { ok: true, wasProtected: true };

        // 2. Protected Data Logic v2.5 — expert_override is an IRON LOCK.
        // (See repriceSingleItem above for the full rationale.) Engine-derived
        // norms (verified/analog/estimated/uncertain/unmatched) are eligible
        // for re-pricing so that "Wyceń wszystko" actually fixes AI-mistakes.
        // CRITICAL v2.5: expert_override=true is ALWAYS protected, even if
        // final_labor_price was 0 — the user has explicitly confirmed this row.
        const isNormProtected = current != null && (
          current.norm_protected === true ||
          current.confidence_level === "manual" ||
          current.expert_override === true
        );

        const updatePayload: Record<string, unknown> = { updated_at: now };

        if (isNormProtected) {
          // Protected mode: only fill material_price and knr_code if currently empty.
          // v4.0 (Phase 2): in labor-only mode, NEVER fill material even if empty.
          if (!laborOnlyMode && (!current.material_price || current.material_price === 0)) {
            updatePayload.material_price = p.material_price;
            updatePayload.final_material_price = p.material_price;
          }
          if (!current.knr_code && p.knr_code) {
            updatePayload.knr_code = p.knr_code;
            if (p.knr_source !== undefined) {
              const src = p.knr_source;
              updatePayload.knr_source =
                src === "official" ? "system_knr" :
                src === "catalog-l1" ? "user_knr" :
                src === "es-synthetic" ? "es_synthetic" : src;
            }
          }
          // Always save shadow suggestion for UI comparison
          if (p.suggested_norm !== undefined) updatePayload.suggested_norm = p.suggested_norm;
          if (p.note !== undefined && p.note.length > 0) updatePayload.confidence_note = `[Norma chroniona] ${p.note}`.substring(0, 400);
          // Also recalculate labor_hours_total even in protected mode (qty × existing norm)
          if (current.labor_norm != null && current.labor_norm > 0) {
            updatePayload.labor_hours_total = Math.round(current.labor_norm * (current.quantity ?? 1) * 100) / 100;
          }
        } else {
          // Full update — normal path
          // v4.0 (Phase 2): in labor-only mode, NEVER write material_price, final_material_price,
          // or equipment_price. The AI pipeline only returns labor estimates in this mode;
          // echoing back the current material value would silently "confirm" stale data.
          if (!laborOnlyMode) {
            updatePayload.material_price = p.material_price;
            updatePayload.final_material_price = p.material_price;
            if (p.equipment_price !== undefined && p.equipment_price > 0) updatePayload.equipment_price = p.equipment_price;
          }
          updatePayload.labor_price = p.labor_price;
          updatePayload.final_labor_price = p.labor_price;
          updatePayload.confidence_level = p.confidence_level ?? "estimated";
          if (p.unit != null) updatePayload.unit = p.unit;
          if (p.note !== undefined && p.note.length > 0) updatePayload.confidence_note = p.note.substring(0, 400);
          if (p.knr_code !== undefined) updatePayload.knr_code = p.knr_code;
          if (p.knr_source !== undefined) {
            const src = p.knr_source;
            updatePayload.knr_source =
              src === "official" ? "system_knr" :
              src === "catalog-l1" ? "user_knr" :
              src === "es-synthetic" ? "es_synthetic" :
              src;
          }
          if (p.labor_norm !== undefined) {
            updatePayload.labor_norm = p.labor_norm;
          }
          // labor_hours_total: prefer pre-calculated value (with all modifiers) over bare norm×qty
          if (p.labor_hours_total != null && p.labor_hours_total > 0) {
            updatePayload.labor_hours_total = Math.round(p.labor_hours_total * 100) / 100;
          } else if (p.labor_norm != null && p.labor_norm > 0) {
            // Fallback: bare norm × qty (less accurate but always available)
            updatePayload.labor_hours_total = Math.round(p.labor_norm * (current?.quantity ?? 1) * 100) / 100;
          }
          if (p.suggested_norm !== undefined) updatePayload.suggested_norm = p.suggested_norm;
          // Expert Shield persistence — always save so UI can show override badge
          if (p.expert_override !== undefined) updatePayload.expert_override = p.expert_override ?? false;
          if (p.is_low_confidence !== undefined) updatePayload.is_low_confidence = p.is_low_confidence ?? false;
          if (p.calculation_log) updatePayload.calculation_log = p.calculation_log.substring(0, 500);
        }

        const { error } = await adminClient
          .from("project_items")
          .update(updatePayload)
          .eq("id", p.itemId)
          .eq("project_id", projectId);

        if (error) {
          logger.error("applyAiPrices UPDATE error:", { itemId: p.itemId, projectId }, error);
          return { ok: false, wasProtected: isNormProtected };
        }
        return { ok: true, wasProtected: isNormProtected };
      })
    );

    const count = updateResults.filter((r) => r.ok).length;
    const protectedCount = updateResults.filter((r) => r.ok && r.wasProtected).length;
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedCount: count, protectedCount };
  } catch (error) {
    logger.error("applyAiPrices error:", {}, error);
    return { success: false, updatedCount: 0, error: "Blad zapisu cen" };
  }
}

// ─────────────────────────────────────────────────────────────────
// triggerL3Estimation
// Expert On-Demand AI pricing for a single unmatched row.
// Called from PriceCell "Wyceń" button — never runs automatically.
// Returns { price_labor, price_material, justification, match_trace }
// and saves the result directly to project_items.
// ─────────────────────────────────────────────────────────────────

export interface L3EstimationResult {
  success: boolean;
  price_labor: number;
  price_material: number;
  justification: string;
  match_trace: string;
  knr_code: string | null;
  labor_norm: number | null;
  error?: string;
}

export async function triggerL3Estimation(
  projectId: string,
  itemId: string,
  positionName: string,
  unit: string,
  voivodeship?: string,
): Promise<L3EstimationResult> {
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.aiPricing);
    if ("error" in guard) return { success: false, price_labor: 0, price_material: 0, justification: "", match_trace: "", knr_code: null, labor_norm: null, error: guard.error };
    const { user, supabase } = guard;

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions (name, price_modifier)")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) return { success: false, price_labor: 0, price_material: 0, justification: "", match_trace: "", knr_code: null, labor_norm: null, error: "Brak uprawnień do projektu" };
    if (project.status === "final") return { success: false, price_labor: 0, price_material: 0, justification: "", match_trace: "", knr_code: null, labor_norm: null, error: "Projekt jest zablokowany" };

    const projectLaborRateL3 = (project.default_hourly_rate as number | null) ?? 0;
    const regionName = (project.regions as { name: string; price_modifier: number } | null)?.name || voivodeship || "Polska";
    const priceModifier = (project.regions as { name: string; price_modifier: number } | null)?.price_modifier || 1.0;
    const rateResult = await getEffectiveRate(regionName, projectLaborRateL3);
    if (rateResult.usedDefaultRate) {
      return { success: false, price_labor: 0, price_material: 0, justification: "", match_trace: "", knr_code: null, labor_norm: null, error: "Nie ustawiono stawki robocizny. Ustaw stawkę w ustawieniach projektu (PLN/rbh)." };
    }
    const userHourlyRate = rateResult.laborRate;
    const baseRateForCalc = rateResult.regionModifier > 0
      ? Math.round((rateResult.laborRate / rateResult.regionModifier) * 100) / 100
      : rateResult.laborRate;
    const rateSource: RateSource = "manual";
    const knrInstruction = buildRateSourceInstruction(rateSource, baseRateForCalc);

    // ── L2.5 Name-Based KNR Lookup (pre-AI) ─────────────────────────────
    // v2.5: Before calling Gemini for single-item L3 pricing, try fuzzy name match
    // against local KNR JSON files. This returns a canonical 2026 norm instantly
    // and avoids AI hallucination for common items (gniazdo, MCB, kabel, oprawa).
    // Only skip if user explicitly wants full AI context (not applicable here —
    // triggerL3 is always a simple position name without extra context).
    const l25Trigger = lookupKnrByName(positionName);
    if (l25Trigger) {
      // Build full modifier cascade (consistent with L2 HIT and L2.5 in estimate batch)
      const ctxStr = voivodeship ? `region:${voivodeship}` : "";
      const cableModT = getCableComplexityModifier(positionName);
      const surfaceModT = getSurfaceModifier(positionName, ctxStr);
      const ceilingModT = getCeilingModifier(positionName, ctxStr);
      const heightModT = getHeightModifier(positionName, ctxStr);
      const localModT = clampLocalModifiers(cableModT, surfaceModT, ceilingModT, heightModT);
      const scaledNormT = scaleLaborNorm(l25Trigger.laborNorm, l25Trigger.unit, unit);
      const isConnT = CONNECTION_RE.test(normalizePlName(positionName));
      const isHeavyT = isConnT && HEAVY_APPLIANCE_RE.test(normalizePlName(positionName) + " " + positionName);
      const normFloorT = isHeavyT ? Math.max(scaledNormT, HEAVY_CONNECTION_MIN_NORM)
        : isConnT ? Math.max(scaledNormT, CONNECTION_MIN_NORM)
        : scaledNormT;
      // v2.4: M-Factor REMOVED — see L0 above for rationale.
      const wymianaActiveT = WYMIANA_RE.test(positionName) || DEMONTAZ_MONTAZ_RE.test(positionName);
      const wymianaFactorT = wymianaActiveT ? WYMIANA_FACTOR : 1.0;
      const sugLabTBase = Math.round(normFloorT * localModT * baseRateForCalc * 100) / 100;
      const sugLabT = Math.round(sugLabTBase * wymianaFactorT * 100) / 100;
      const knrCodeT = l25Trigger.code;
      // Run through sanity + guards for consistency with full pipeline
      const rawL25Est: AiPriceEstimate = {
        itemId, name: positionName, unit, quantity: 1,
        currentMaterial: 0, currentLabor: 0,
        suggestedMaterial: 0, // material handled by separate benchmark path
        suggestedLabor: sugLabT,
        confidence: "medium" as const,
        note: `L2.5 Name-match: ${positionName} → ${knrCodeT} (${normFloorT.toFixed(4)} rbh/${unit} × ${localModT.toFixed(2)} × ${baseRateForCalc} PLN/h)`,
        knrCode: knrCodeT,
        knrSource: isOfficialKnr(knrCodeT) ? "official" : "es-synthetic",
        laborNorm: normFloorT,
        isAmbiguous: false,
        trace: `L2.5 triggerL3 pre-AI match: ${knrCodeT}`,
      };
      const processedT = applyPostProcessPipeline(rawL25Est, baseRateForCalc, 1.0);
      return {
        success: true,
        price_labor: processedT.suggestedLabor,
        price_material: 0,
        justification: processedT.note ?? `L2.5: ${knrCodeT}`,
        match_trace: processedT.trace ?? `L2.5 Name Lookup → ${knrCodeT}`,
        knr_code: processedT.knrCode ?? knrCodeT,
        labor_norm: processedT.laborNorm ?? normFloorT,
      };
    }

    // v10.5: Inject real material price references into L3 prompt
    const l3PriceRef = buildBenchmarkPromptContext();

    const expertSystemPrompt = `${PRICING_STATIC_SYSTEM_PROMPT}

<context>
- Stawka robocizny: ${baseRateForCalc} PLN/rbh (BAZOWA — bez współczynnika regionalnego)
- WAŻNE: Podaj cenę przy tej stawce BAZOWEJ. NIE stosuj współczynnika regionalnego — system robi to automatycznie.
- źródło stawki: ${rateSource === "manual" ? "Własna Stawka" : "ES-Engine 2026"}
- Rok: 2026, ceny PLN netto (bez VAT)
- Typ obliczeń: ES-KNR ON-DEMAND (pozycja nieznaleziona w katalogu)
- ${knrInstruction}
</context>

${l3PriceRef}

<task>
Wycen JEDNĄ pozycję której NIE ZNALEZIONO w katalogu osobistym ani bazie ES-Dictionary.
MUSISZ podać zarówno cenę materiału jak i robocizny (żadna nie może być 0 jeśli pozycja ma sens techniczny).
Użyj norm KNR ES-KNR 2026. Ceny materiałów MUSZĄ odpowiadać cennikowi hurtowemu 2026 (patrz price_reference_2026).
Uzasadnij skąd pochodzi cena (KNR, norma, doświadczenie rynkowe 2026).
</task>`;

    const { object: result } = await generateObject({
      model: google("gemini-2.0-flash"),
      system: expertSystemPrompt,
      prompt: `Wycen pozycję: "${positionName}" | jednostka: ${unit} | region: ${regionName} | stawka bazowa: ${baseRateForCalc} PLN/rbh\n\nPodaj cenę JEDNOSTKOWĄ (za 1 ${unit}). Uzasadnij krótko skąd pochodzi wycena.`,
      schema: z.object({
        material_price: z.number().min(0),
        labor_price: z.number().min(0),
        labor_norm: z.number().min(0).nullable().optional(),
        knr_code: z.string().nullable().optional(),
        justification: z.string(),
        confidence: z.enum(["high", "medium", "low"]),
      }),
      temperature: 0.1,
      maxOutputTokens: 512,
    });

    // Iron Rule: material never gets regionModifier. Labor: AI was given userHourlyRate (already regional) — no double-apply
    // v10.5: Benchmark clamp on L3 material price — validate AI guess against real wholesale data
    const rawMatUnclamped = Math.round((result.material_price || 0) * 100) / 100;
    const { price: rawMat } = clampToBenchmark(positionName, unit, rawMatUnclamped);
    const rawLab = Math.round((result.labor_price || 0) * 100) / 100;
    const rawKnrCode = result.knr_code ?? null;
    if (rawKnrCode && isSyntheticKnr(rawKnrCode)) {
      logger.error(`[Hard-Link v2.2] BLOCKED synthetic KNR "${rawKnrCode}" for triggerL3 "${positionName}"`, {});
    }
    const knrCode = rawKnrCode && !isSyntheticKnr(rawKnrCode) ? rawKnrCode : null;
    const laborNorm = result.labor_norm ?? null;

    // ── P3 FIX: Apply full post-processing pipeline (was missing before v10.5) ──
    // triggerL3 previously saved AI result directly to DB, bypassing:
    // enforceKeywordRules, applySanityCheck, enforceExpertGuards, realityCheck, SAL.
    // This caused "Demontaż rozdzielnicy" to get full price instead of ×0.65,
    // and "Pomiar izolacji" to get non-zero material.
    const rawEstimate: AiPriceEstimate = {
      itemId,
      name: positionName,
      unit,
      quantity: 1, // triggerL3 is per-unit pricing
      currentMaterial: 0,
      currentLabor: 0,
      suggestedMaterial: isPureLaborByKeyword(positionName)
        ? 0
        : clampPrice(positionName, unit, rawMat, "material"),
      suggestedLabor: rawLab,
      confidence: result.confidence,
      note: `L3 ES-Engine: ${result.justification}`,
      knrCode,
      knrSource: knrCode ? (isOfficialKnr(knrCode) ? "official" : "es-synthetic") : null,
      laborNorm,
      isAmbiguous: false,
      trace: `L3 triggerL3 (${result.confidence})`,
    };
    const processed = applyPostProcessPipeline(rawEstimate, baseRateForCalc, 1.0);
    const mat = processed.suggestedMaterial;
    const lab = processed.suggestedLabor;
    const finalLaborNorm = processed.laborNorm ?? laborNorm;
    const match_trace = `L3: ES-Engine (${result.confidence})${processed.expert_override ? " [Expert Override]" : ""}`;

    const confidenceLevel: "verified" | "analog" | "estimated" = result.confidence === "high"
      ? "verified"
      : result.confidence === "medium"
      ? "analog"
      : "estimated";

    const adminClient = createAdminClient();

    // v2.5 IRON LOCK: skip update entirely if user-confirmed expert_override=true
    // OR confidence_level=manual OR norm_protected=true. AI must NEVER overwrite
    // user-locked rows.
    const { data: itemRow } = await adminClient
      .from("project_items")
      .select("quantity, expert_override, confidence_level, norm_protected, labor_price, labor_norm")
      .eq("id", itemId)
      .single();
    if (itemRow && (
      (itemRow.expert_override as boolean | null) === true ||
      (itemRow.confidence_level as string | null) === "manual" ||
      (itemRow.norm_protected as boolean | null) === true
    )) {
      return {
        success: true,
        price_labor: (itemRow.labor_price as number | null) ?? lab,
        price_material: mat,
        justification: "Pozycja chroniona (expert_override / manual / norm_protected) — AI nie nadpisuje",
        match_trace: `L3 SKIPPED: Iron Lock`,
        knr_code: knrCode,
        labor_norm: (itemRow.labor_norm as number | null) ?? finalLaborNorm,
      };
    }
    const itemQty: number = (itemRow?.quantity as number | null) ?? 1;
    const laborHoursTotal = finalLaborNorm != null && finalLaborNorm > 0
      ? Math.round(finalLaborNorm * itemQty * 100) / 100
      : null;

    await adminClient
      .from("project_items")
      .update({
        material_price: mat,
        labor_price: lab,
        final_material_price: mat,
        final_labor_price: lab,
        knr_code: knrCode,
        knr_source: knrCode ? (isOfficialKnr(knrCode) ? "system_knr" : "es_synthetic") : "ai_estimation",
        labor_norm: finalLaborNorm,
        labor_hours_total: laborHoursTotal,
        suggested_norm: finalLaborNorm,
        confidence_level: confidenceLevel,
        confidence_note: (processed.note ?? `L3 ES-Engine: ${result.justification}`).slice(0, 400),
        expert_override: processed.expert_override ?? false,
        is_low_confidence: processed.isLowConfidence ?? false,
        calculation_log: (processed.calculationLog ?? "").slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("project_id", projectId);

    // Hard-Link v2.2: Audit log — fire-and-forget, never block main flow
    void Promise.resolve(
      adminClient.from("pricing_audit_log").insert({
        user_id: user.id,
        project_id: projectId,
        item_id: itemId,
        item_name: positionName,
        match_level: "L3",
        knr_code: knrCode,
        was_synthetic: rawKnrCode != null && isSyntheticKnr(rawKnrCode),
        confidence: result.confidence,
        note: `triggerL3: ${result.justification}${processed.expert_override ? " [Expert Override]" : ""}`.slice(0, 200),
      })
    ).catch(() => {});

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      price_labor: lab,
      price_material: mat,
      justification: result.justification,
      match_trace,
      knr_code: knrCode,
      labor_norm: finalLaborNorm,
    };
  } catch (error) {
    logger.error("triggerL3Estimation error:", {}, error);
    return { success: false, price_labor: 0, price_material: 0, justification: "", match_trace: "", knr_code: null, labor_norm: null, error: "Błąd wyceny ES-Engine" };
  }
}
