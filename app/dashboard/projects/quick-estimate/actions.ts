"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage, getAiFunctionUsage } from "@/lib/ai-usage";
import { generateEstimateItems, type EstimateItem, type ObjectTypeKey, type QualityStandard, type ZakresPrac, type ConditionalFields } from "@/lib/quick-estimate-config";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { buildDynamicSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import { estimatePricesWithAI, applyAiPrices } from "@/app/dashboard/projects/[id]/_ai_actions/pricing";

// --- RAG KB loader ---
async function fetchQuickEstimateKbContext(): Promise<string | null> {
  try {
    const fileNames = await Promise.race([
      listKbFileNames(),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);
    if (!fileNames || fileNames.length === 0) return null;
    const ctx = await Promise.race([
      fetchKbContext(fileNames, "knr_knowledge_base"),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
    ]);
    return ctx && ctx.length > 30 ? ctx : null;
  } catch {
    return null;
  }
}

/**
 * Generate estimate items using Gemini 2.0 Flash AI + RAG.
 * Falls back to local calculation if AI fails.
 */
export async function generateQuickEstimateWithAI(params: {
  objectType: ObjectTypeKey;
  areaM2: number;
  roomCount: number;
  standard: QualityStandard;
  zakres?: ZakresPrac[];
  conditionalFields?: ConditionalFields;
}): Promise<{ success: boolean; items?: EstimateItem[]; remaining?: number; error?: string; fallback?: boolean }> {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null }));
    if (!user) return { success: false, error: "Musisz byc zalogowany" };

    const aiCheck = await checkAndIncrementAiUsage(user.id, "quickEstimate");
    if (!aiCheck.allowed) {
      return { success: false, error: aiCheck.error || "Limit AI wyczerpany", remaining: 0 };
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const items = generateEstimateItems(params);
      return { success: true, items, remaining: aiCheck.remaining, fallback: true };
    }

    const objectLabels: Record<ObjectTypeKey, string> = {
      mieszkanie: "Mieszkanie w bloku / kamienicy",
      dom: "Dom jednorodzinny / wolnostojacy",
      biuro: "Biuro / Lokal uslugowy",
      przemysl: "Hala przemyslowa / magazyn",
      sklep: "Sklep / Lokal handlowy / galeria",
      parking: "Parking podziemny / garaz wielostanowiskowy",
      hotel: "Hotel / Pensjonat / apartamenty na wynajem",
      szkola: "Szkola / Przedszkole / Uczelnia / Placowka oswiatowa",
    };

    const standardLabels: Record<QualityStandard, string> = {
      ekonomiczny: "Ekonomiczny (najtansze sprawdzone materialy)",
      standard: "Standard (markowe materialy, +30% mat / +15% rob)",
      premium: "Premium (topowe materialy, smart home, +80% mat / +35% rob)",
    };

    const zakresPracLabels: Record<ZakresPrac, string> = {
      electrical:    "Elektryka (instalacja silnoprądowa)",
      teletechnical: "Teletechnika (LAN, WiFi, TV/SAT, CCTV)",
      alarm:         "Alarm / Kontrola dostępu (SSWiN, RFID, kamery)",
      smarthome:     "Smart Home / BMS (KNX, DALI, automatyka)",
      ppoz:          "P-POŻ / SSP (czujki dymu, centrala, kable HDGs)",
    };
    const activeZakres = params.zakres && params.zakres.length > 0 ? params.zakres : (["electrical"] as ZakresPrac[]);
    const zakresList = activeZakres.map(z => zakresPracLabels[z]).join(", ");

    const cfLines: string[] = [];
    const cf = params.conditionalFields ?? {};

    // mieszkanie / dom
    if (cf.floors && cf.floors > 1) cfLines.push(`- Liczba kondygnacji: ${cf.floors}`);
    if (cf.finishStandard) {
      const fl = { basic: "Podstawowy (Eco)", standard: "Standard", luxury: "Premium / Luksusowy" };
      cfLines.push(`- Standard wykończenia: ${fl[cf.finishStandard]}`);
    }
    if (cf.installationType) {
      cfLines.push(`- Typ instalacji: ${cf.installationType === "flush" ? "Podtynkowa (w tynku)" : "Natynkowa (na powierzchni)"}`);
    }

    // biuro / sklep
    if (cf.floorboxCount) cfLines.push(`- Liczba floorboxów podłogowych: ${cf.floorboxCount} szt`);
    if (cf.lanCategory) {
      const lc = { cat5e: "Kat. 5e (100 Mb/s)", cat6: "Kat. 6 (1 Gb/s)", cat6a: "Kat. 6A (10 Gb/s)" };
      cfLines.push(`- Kategoria kabla LAN: ${lc[cf.lanCategory]}`);
    }
    if (cf.accessControl) cfLines.push(`- Kontrola dostępu (RACS): TAK — czytniki RFID, elektrozaczepy, kontrolery`);

    // przemysl / hala
    if (cf.ceilingHeight) {
      const heightLabels = {
        low:    "< 3m — mnożnik KNR robocizny ×1.00 (standardowy)",
        medium: "3–6m — mnożnik KNR robocizny ×1.25 (praca na wysokości)",
        high:   "> 6m — mnożnik KNR robocizny ×1.50 (praca na wysokości powyżej 6m)",
      };
      cfLines.push(`- Wysokość hali/sufitu: ${heightLabels[cf.ceilingHeight]}`);
    }
    if (cf.connectedPowerKw) cfLines.push(`- Moc przyłączeniowa: ${cf.connectedPowerKw} kW`);
    if (cf.cableTrayType) {
      const ct = { ladder: "Drabinka kablowa (ciężkie kable)", mesh: "Koryto siatkowe (lekkie/IT)", perforated: "Koryto perforowane (uniwersalne)" };
      cfLines.push(`- Typ trasy kablowej: ${ct[cf.cableTrayType]}`);
    }

    // parking
    if (cf.evChargers) cfLines.push(`- Liczba ładowarek EV: ${cf.evChargers} szt`);
    if (cf.coDetection) cfLines.push(`- Detekcja CO/LPG: TAK — czujniki gazu, centrala detekcji`);
    if (cf.emergencyLighting) cfLines.push(`- Oświetlenie awaryjne IP65: TAK — oprawy ewakuacyjne`);

    // hotel / szkola
    if (cf.sspComplexity) {
      cfLines.push(`- SSP (sygnalizacja pożaru): ${cf.sspComplexity === "addressable" ? "Adresowalny (zaawansowany) — centrala adresowalna, czujki adresowalne, ROP adresowalny, kabel HDGs" : "Konwencjonalny (podstawowy) — centrala konwencjonalna, czujki strefowe, kabel YnTKSY"}`);
    }
    if (cf.roomManagement) cfLines.push(`- System zarządzania pokojami/salami: TAK (RCU/KNX/BMS) — sterowniki pokojowe, magistrala KNX, programowanie`);
    if (cf.paSystem) cfLines.push(`- Radiowęzeł / Nagłośnienie PA: TAK — wzmacniacze, głośniki sufitowe, centrale PA, kabel głośnikowy`);

    // KNR height multiplier value for prompt
    const knrHeightMult = cf.ceilingHeight === "high" ? 1.50 : cf.ceilingHeight === "medium" ? 1.25 : 1.00;

    // Expert systems rbh multiplier (SSP addressable / RCU / PA require specialist technicians)
    const hasExpertSystems = cf.sspComplexity === "addressable" || cf.roomManagement || cf.paSystem || cf.accessControl;
    const expertRbhMult = hasExpertSystems ? 1.35 : 1.00;

    // Build expert systems instructions block
    const expertSystemsLines: string[] = [];
    if (cf.sspComplexity === "addressable") {
      expertSystemsLines.push(
        "SSP ADRESOWALNY: Uzyj pozycji z normy KNR AL-01 lub ES-KNR-SSP-ADDR. Wymagane pozycje: centrala adresowalna (1 szt), czujki dymu adresowalne (1 na 60m2), czujki ciepla adresowalne (kuchnie/kotlownie), ROP adresowalny (przy wyjsciach), sygnalizatory optyczno-akustyczne, kabel HDGs 2x1.0mm2 (p.poz.), zasilacz buforowy 24V. base_labor_price dla SSP = standardowa × 1.35 (specjalista)."
      );
    }
    if (cf.sspComplexity === "basic") {
      expertSystemsLines.push(
        "SSP KONWENCJONALNY: Uzyj pozycji KNR 5-08 lub ES-KNR-SSP-CONV. Wymagane: centrala konwencjonalna strefowa, czujki dymu (1 na 80m2), ROP przy wyjsciach, sygnalizatory, kabel YnTKSY 2x0.8mm2."
      );
    }
    if (cf.roomManagement) {
      expertSystemsLines.push(
        "RCU/KNX: Uzyj (ES-KNR-MANUAL) dla sterownikow pokojowych — brak standardowej normy KNR. Wymagane pozycje: sterownik pokojowy KNX (1 na pokoj/sale), magistrala KNX TP (mb), zasilacz KNX 640mA, programowanie KNX (rbh × 1.50 — programista KNX). Jesli brak kodu KNR — uzyj (ES-KNR-MANUAL)."
      );
    }
    if (cf.paSystem) {
      expertSystemsLines.push(
        "PA SYSTEM: Uzyj (ES-KNR-MANUAL) dla naglosnienia — brak standardowej normy KNR. Wymagane: wzmacniacz PA (W zaleznie od powierzchni), glosniki sufitowe 6W (1 na 20m2), centrale PA, kabel glosnikowy 2x1.5mm2 (mb), mikrofon strefowy. base_labor_price × 1.35 (technik AV). Jesli brak kodu KNR — uzyj (ES-KNR-MANUAL)."
      );
    }

    const expertBlock = expertSystemsLines.length > 0
      ? `\n\nSYSTEMY SPECJALISTYCZNE — SZCZEGOLOWE INSTRUKCJE:\n${expertSystemsLines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
      : "";

    const userPrompt = `Wygeneruj profesjonalny kosztorys instalacji elektrycznej (ElektroSmart Engine v2.1):
- Typ obiektu: ${objectLabels[params.objectType]}
- Powierzchnia: ${params.areaM2} m2
- Liczba pomieszczen: ${params.roomCount}
- Standard wykonania: ${standardLabels[params.standard]}
- Zakres prac: ${zakresList}${cfLines.length > 0 ? "\n" + cfLines.join("\n") : ""}${expertBlock}

ZASADY GENEROWANIA (KRYTYCZNE):
1. KNR KODY OBOWIAZKOWE: Podaj kod KNR w polu knr_code — NIE w nazwie pozycji!
   Format pola knr_code: "KNR 5-04 0101-02" lub "KNR 5-08 0401-01" itp.
   JESLI nie znasz kodu dla danej pozycji (PA, RCU, BMS, KNX, naglosnienie) — podaj null w knr_code.
   Nazwy pozycji MUSZA byc CZYSTE — bez zadnych kodow, nawiasow ani dopisksow technicznych.
   Przyklady prawidlowe: name="Gniazdo wtyczkowe 230V", knr_code="KNR 5-04 0201-01".
2. ZAKRES KOMPLETNY: Wygeneruj pozycje dla WSZYSTKICH wybranych zakresow prac (${zakresList}).
3. ILOSCI REALISTYCZNE: Oblicz ilosci na podstawie powierzchni ${params.areaM2}m2 i liczby pomieszczen ${params.roomCount}.
   Kontekst wysokosci/specjalistow: height_mult=${knrHeightMult} expert_mult=${expertRbhMult} (stosowany przez silnik KNR automatycznie).
4. TYLKO POZYCJE I ILOSCI: NIE generuj cen — zostan wyliczone przez silnik KNR 2026 z baza ${params.areaM2 > 0 ? "regionalna" : "krajowa"}.`;

    const kbContext = await fetchQuickEstimateKbContext();
    const basePrompt = await buildDynamicSystemPrompt("quick-estimate");
    const systemPrompt = injectKbContext(basePrompt, kbContext);

    const { object } = await generateObject({
      model: google(GEMINI_RAG_MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        items: z.array(z.object({
          name: z.string().describe("Nazwa pozycji — CZYSTA, bez kodow KNR ani nawiasow"),
          unit: z.string().describe("Jednostka: szt, mb, kpl, m2"),
          quantity: z.number().describe("Ilosc"),
          knr_code: z.string().nullable().describe("Kod KNR np. 'KNR 5-04 0201-01'. null jesli brak."),
        })),
      }),
      temperature: 0.1,
      maxOutputTokens: 4000,
    });

    // Prices intentionally zeroed — KNR pipeline runs inside createQuickEstimateProject
    const items: EstimateItem[] = (object.items || []).map(item => ({
      name: item.name,
      unit: item.unit,
      quantity: Math.max(1, Math.round(item.quantity)),
      base_material_price: 0,
      base_labor_price: 0,
      knr_code: item.knr_code ?? null,
    }));

    if (items.length === 0) {
      const fallbackItems = generateEstimateItems(params).map(i => ({ ...i, base_material_price: 0, base_labor_price: 0 }));
      return { success: true, items: fallbackItems, remaining: aiCheck.remaining, fallback: true };
    }

    return { success: true, items, remaining: aiCheck.remaining };
  } catch (err) {
    logger.error("Quick estimate AI error, using fallback:", {}, err);
    const fallbackItems = generateEstimateItems(params).map(i => ({ ...i, base_material_price: 0, base_labor_price: 0 }));
    return { success: true, items: fallbackItems, fallback: true };
  }
}

/**
 * Create a project from the Quick Estimate Wizard results.
 */
export async function createQuickEstimateProject(params: {
  name: string;
  regionId: string;
  objectTypeId: string;
  vatRate: number;
  items: EstimateItem[];
}): Promise<{ success?: boolean; error?: string; projectId?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { error: "Musisz byc zalogowany" };
  }

  if (!params.name.trim()) {
    return { error: "Nazwa projektu jest wymagana" };
  }

  if (params.items.length === 0) {
    return { error: "Brak pozycji do dodania" };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, hourly_rate, is_pro, max_projects")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email || "",
    });
  }

  // Free-tier limit check
  if (existingProfile && !existingProfile.is_pro) {
    const maxAllowed = (existingProfile as { max_projects?: number }).max_projects ?? 3;
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (count !== null && count >= maxAllowed) {
      return {
        error: `Plan darmowy pozwala na ${maxAllowed} aktywne projekt${maxAllowed === 1 ? '' : 'y'}. Przejdź na PRO, aby tworzyć nielimitowane projekty.`,
      };
    }
  }

  const defaultHourlyRate = (existingProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

  const { data: region } = await supabase
    .from("regions")
    .select("price_modifier")
    .eq("id", params.regionId)
    .single();

  // Keep priceModifier for reference (Iron Rule: only used on labor, and only to store BASE here)
  void (region?.price_modifier); // regionModifier applied by calcRowPrices at display time

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: params.name.trim(),
      region_id: params.regionId,
      object_type_id: params.objectTypeId,
      vat_rate: params.vatRate,
      status: "draft",
      default_hourly_rate: defaultHourlyRate,
    })
    .select()
    .single();

  if (projectError || !project) {
    logger.error("Error creating quick estimate project", { name: params.name }, projectError);
    return { error: "Blad podczas tworzenia projektu" };
  }

  // Save items with blank prices — KNR pipeline prices them immediately below
  const projectItems = params.items.map((item, index) => ({
    project_id: project.id,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    final_material_price: 0,
    final_labor_price: 0,
    material_price: 0,
    labor_price: 0,
    is_custom: true,
    knr_code: item.knr_code || null,
    knr_source: null as string | null,
    confidence_level: "uncertain" as string,
    sort_order: index + 1,
  }));

  const { error: itemsError } = await supabase
    .from("project_items")
    .insert(projectItems);

  if (itemsError) {
    logger.error("Error inserting quick estimate items", { projectId: project.id, itemCount: params.items.length }, itemsError);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${project.id}`);
    return { success: true, projectId: project.id };
  }

  // ── Run full KNR Pricing Pipeline (L0 → L1 → L2 → L3) ───────────────────────
  // Iron Rule: PricingConfig (profile + project overrides), BASE prices, regionModifier
  // applied by calcRowPrices at display time. estimatePricesWithAI handles all of this.
  try {
    const pricingResult = await estimatePricesWithAI(project.id, "all");
    if (pricingResult.success && pricingResult.estimates && pricingResult.estimates.length > 0) {
      await applyAiPrices(
        project.id,
        pricingResult.estimates.map(est => ({
          itemId: est.itemId,
          material_price: est.suggestedMaterial,
          labor_price: est.suggestedLabor,
          unit: est.guardedUnit ?? est.unit,
          note: est.note,
          knr_code: est.knrCode,
          knr_source: est.knrSource,
          labor_norm: est.laborNorm,
          labor_hours_total: est.laborHoursTotal ?? null,
          confidence_level: (
            est.confidence === "high" ? "verified" :
            est.confidence === "medium" ? "analog" :
            "estimated"
          ) as "verified" | "analog" | "estimated",
          expert_override:   est.expert_override,
          is_low_confidence: est.isLowConfidence,
          calculation_log:   est.calculationLog,
        }))
      );
    }
  } catch (pricingErr) {
    // Q2 fix: surface pricing failures instead of creating a silent 0 PLN project.
    // The project and items are already in the DB — return the projectId so the UI
    // can navigate there with a warning rather than leaving the user with no context.
    logger.error("Quick estimate KNR pricing failed", { projectId: project.id }, pricingErr);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${project.id}`);
    return {
      success: false,
      projectId: project.id,
      error: "Silnik wyceny nie odpowiedział. Projekt został utworzony — uruchom 'Wycena AI' ręcznie lub spróbuj ponownie.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${project.id}`);

  return { success: true, projectId: project.id };
}

/**
 * Get current AI usage for quick estimate (read-only, no increment).
 */
export async function getQuickEstimateUsage(): Promise<{ used: number; limit: number; remaining: number } | null> {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null }));
    if (!user) return null;
    return await getAiFunctionUsage(user.id, "quickEstimate");
  } catch {
    return null;
  }
}
