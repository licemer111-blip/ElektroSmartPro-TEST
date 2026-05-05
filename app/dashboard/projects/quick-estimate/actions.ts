"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage, getAiFunctionUsage } from "@/lib/ai-usage";
import { generateEstimateItems, type EstimateItem, type ObjectTypeKey, type QualityStandard, type ZakresPrac, type ConditionalFields } from "@/lib/quick-estimate-config";
import { computeComplexityFromContext } from "@/lib/pricing-complexity";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { buildDynamicSystemPrompt, injectKbContext, GEMINI_RAG_MODEL } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import { estimatePricesWithAI, applyAiPrices } from "@/app/dashboard/projects/[id]/_ai_actions/pricing";
import { getEffectiveMaxProjects } from "@/lib/config/tier-limits";

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
    const { user } = await tryAuth();
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
1. KNR KODY — UZYWAJ TYLKO SERII KNR 5-08 (2026):
   ⛔ ZAKAZ: seria KNR 5-04 (stara, 2015) — NIE istnieje w naszej bazie norm.
   ⛔ ZAKAZ: wymyslanie sufiksow typu "-01/-02/-03" jesli nie jestes PEWIEN kodu.
   ✅ JESLI nie jestes pewien dokladnego kodu — podaj null w knr_code (silnik znajdzie norme po nazwie pozycji automatycznie).
   ✅ UZYWAJ PROSTEJ FORMY: "KNR 5-08 0401" (bez sufiksu) zamiast "KNR 5-04 0501-01".

   KANONICZNE KODY KNR 5-08 (2026) — UZYWAJ TYCH:
   — Gniazda / wylaczniki / oprawy:
     • KNR 5-08 0401 → Gniazdo pojedyncze 230V/16A Schuko p/t
     • KNR 5-08 0402 → Gniazdo podwojne 230V/16A (2xSchuko) p/t
     • KNR 5-08 0403 → Gniazdo potrojne 230V/16A (3xSchuko) p/t
     • KNR 5-08 0405 → Gniazdo 230V IP44/IP54 (lazienka, zewn.)
     • KNR 5-08 0501 → Oprawa sufitowa (plafon/panel LED)
     • KNR 5-08 0502 → Oprawa downlight LED (wpuszczana w sufit)
     • KNR 5-08 0701 → Oprawa zewnetrzna fasadowa LED IP65
   — Wylaczniki oswietlenia (uzyj KNR 5-08 0501 z opisem "lacznik"):
     • lacznik jednobiegunowy p/t — norma w bazie
   — Kable / rury / bruzda:
     • KNR 5-08 0201 → YDYp 3x1,5 mm2 p/t w bruzdzie (0.13 rbh/m)
     • KNR 5-08 0202 → YDYp 3x2,5 mm2 p/t w bruzdzie (0.16 rbh/m)
     • KNR 5-08 0101 → Bruzdowanie sciany cegla/silikat (0.85 rbh/m)
     • KNR 5-08 0301 → Puszka p/t PCV fi60/68
     • KNR 5-08 0303 → Puszka hermetyczna IP55 n/t
   — Rozdzielnica / aparatura modulowa:
     • KNR 5-08 0201 → MCB 1P na szynie TH35 (0.15 rbh/szt)
     • KNR 5-08 0202 → MCB 2P na szynie TH35 (0.20 rbh/szt)
     • KNR 5-08 0205 → Wylacznik glowny / rozlacznik izolacyjny (0.35 rbh/szt)
     • KNR 5-08 0211 → RCD 2P na szynie TH35 (0.25 rbh/szt)
     • KNR 5-08 0212 → RCD 4P na szynie TH35 (0.30 rbh/szt)
     • KNR 5-08 0221 → RCBO 1P+N (0.20 rbh/szt)
     • KNR 5-08 0231 → SPD T1/T2 ogranicznik przepiec (0.40 rbh/szt)
     • KNR 5-08 0301 → Zlaczka szynowa ZUG (0.10 rbh/szt)
   — Teletechnika / LAN / CCTV / SSWiN:
     • KNR 5-09 0101 → UTP Cat5e (0.08 rbh/m) | KNR 5-09 0106 → gniazdo RJ45 podwojne
     • KNR 5-09 0201 → kamera IP dome | KNR 5-09 0202 → kamera IP bullet
     • KNR 5-09 0301 → centrala SSWiN | KNR 5-09 0303 → czujka PIR
   — Pomiary (KNR 4-03 lub KNR 5-08 91xx):
     • KNR 5-08 9101 → pomiar rezystancji izolacji | 9102 → ciaglosc PE
     • KNR 5-08 9103 → impedancja petli zwarcia | 9104 → pomiar RCD
     • KNR 5-08 9105 → rezystancja uziemienia | 9305 → instalacja odgromowa

   Przyklady prawidlowe:
   • name="Gniazdo 230V p/t pojedyncze",  knr_code="KNR 5-08 0401"
   • name="Gniazdo 230V p/t podwojne",    knr_code="KNR 5-08 0402"
   • name="Gniazdo 230V IP44 bryzgoszczelne", knr_code="KNR 5-08 0405"
   • name="Przewod YDYp 3x2,5mm2",        knr_code="KNR 5-08 0202"
   • name="Bruzda w cegle",               knr_code="KNR 5-08 0101"
   • name="Wylacznik roznicowopradowy RCD 40A/30mA 2P", knr_code="KNR 5-08 0211"
   • name="Rozdzielnica p/t 24-modulowa", knr_code=null  (silnik znajdzie po nazwie)
   Nazwy pozycji MUSZA byc CZYSTE — bez zadnych kodow, nawiasow ani dopisksow technicznych.

2. SANITY NORM DLA OSPRZETU (samokontrola):
   • Gniazdo podwojne > pojedyncze (norma p-dwojnego ZAWSZE wyzsza niz pojedynczego).
   • Gniazdo IP44 > gniazdo zwykle p/t (o ~30%).
   • RCD/MCB: norma montazu APARATU na szynie 0.15-0.40 rbh/szt (NIE 5 rbh!).
   • Rozdzielnica 24-modulowa p/t: pelny montaz aparatury ~3.0 rbh/szt (nie 2.5, nie 1320 PLN).

3. ZAKRES KOMPLETNY: Wygeneruj pozycje dla WSZYSTKICH wybranych zakresow prac (${zakresList}).

4. ILOSCI REALISTYCZNE: Oblicz ilosci na podstawie powierzchni ${params.areaM2}m2 i liczby pomieszczen ${params.roomCount}.
   Kontekst wysokosci/specjalistow: height_mult=${knrHeightMult} expert_mult=${expertRbhMult} (stosowany przez silnik KNR automatycznie).

5. TYLKO POZYCJE I ILOSCI: NIE generuj cen — zostan wyliczone przez silnik KNR 2026 z baza ${params.areaM2 > 0 ? "regionalna" : "krajowa"}.`;

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
  /** v4.1 (Phase 7): wizard's conditional fields. Used to derive
   *  project.complexity_factor (single labor multiplier) and persisted as-is
   *  to project.quick_estimate_context for transparent UI breakdown. */
  conditionalFields?: ConditionalFields;
}): Promise<{ success?: boolean; error?: string; projectId?: string }> {
  const { user, supabase } = await tryAuth();

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

  // v2.0: free tier — limit tylko jeśli admin jawnie ustawił niski limit (<100).
  {
    const maxAllowed = getEffectiveMaxProjects(existingProfile as { is_pro?: boolean; max_projects?: number } | null);
    if (existingProfile && !existingProfile.is_pro && maxAllowed < 100) {
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

  const defaultHourlyRate = (existingProfile as { hourly_rate?: number | null } | null)?.hourly_rate ?? 0;

  const { data: region } = await supabase
    .from("regions")
    .select("price_modifier")
    .eq("id", params.regionId)
    .single();

  // Keep priceModifier for reference (Iron Rule: only used on labor, and only to store BASE here)
  void (region?.price_modifier); // regionModifier applied by calcRowPrices at display time

  // v4.1 (Phase 7): derive complexity_factor from wizard's conditional fields.
  // Single labor multiplier that ProjectSummary + EstimateRow apply at display time.
  // Raw fields persisted to quick_estimate_context for transparent UI breakdown.
  const complexity = computeComplexityFromContext(params.conditionalFields);

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
      complexity_factor: complexity.factor,
      quick_estimate_context: params.conditionalFields ?? null,
    })
    .select()
    .single();

  if (projectError || !project) {
    logger.error("Error creating quick estimate project", { name: params.name }, projectError);
    return { error: "Blad podczas tworzenia projektu" };
  }

  // Save items with blank prices — KNR pipeline prices them immediately below.
  //
  // Zestaw Engine v2 (2026-05-04): mark every wizard-generated row with
  // is_quick_estimate=true so Smart Mapping Engine never silently wraps it
  // as a virtual Zestaw (which caused 1200 mb "Układanie kabla YKY" to
  // double-count with an extra 1200 mb of bruzdowanie). Quick Estimate
  // already produces explicit, deterministic lines; auto-bundling is a
  // net regression for this pathway regardless of project.auto_detect_zestawy.
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
    is_quick_estimate: true,
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
    const { user } = await tryAuth();
    if (!user) return null;
    return await getAiFunctionUsage(user.id, "quickEstimate");
  } catch {
    return null;
  }
}
