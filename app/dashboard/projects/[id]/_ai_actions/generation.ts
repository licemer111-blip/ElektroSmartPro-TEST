"use server";

import { logger } from "@/lib/logger";
// ═══════════════════════════════════════════════════════════════════
// _ai_actions/generation.ts — AI Generation Server Actions
// generateProjectItemsWithAI, generatePanelConfigWithAI
// System prompts and Zod schemas for panel configuration
// ═══════════════════════════════════════════════════════════════════

import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
import { buildDynamicSystemPrompt, injectKbContext } from "@/lib/ai-master-brain";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import {
  findBestCatalogMatch,
  parseElectricalConstraints,
  fixSelectivity,
  fixLoadBalance,
  fixPhaseBalance,
  computeAccessories,
  mapRawModule,
  reorderRcdBeforeMcbs,
  computeEnclosureModules,
} from "@/lib/services/ai";
import { checkGuard, type GeneratedItem, type AIGenerateResult } from "./utils";
import { lookupKnrByName } from "@/lib/knr-local-context";
import { estimatePricesWithAI, applyAiPrices } from "./pricing";
import { normalizeKnrCode } from "@/lib/services/pricing-config";


// ── Panel config interfaces ───────────────────────────────────────

interface AiPanelModule {
  moduleId: string;
  rating?: number;
  qty?: number;
  label?: string;
  phase?: string;
  isZugBlock?: boolean;
  terminalCount?: number;
}

interface AiPanelSectionResult {
  name: string;
  feed: string;
  type: string;
  enclosureModules: number;
  modules: AiPanelModule[];
  accessories?: Array<{ moduleId: string; qty?: number }>;
}

interface AiPanelReasoning {
  total_load_kw: number;
  phase_count: number;
  phase_balance_strategy: string;
  rcd_grouping_logic: string;
  selectivity_checks: string[];
  self_correction_checks: string[];
}

export interface AiPanelResult {
  success: boolean;
  panelName?: string;
  reasoning?: AiPanelReasoning;
  enclosureModules?: number;
  modules?: AiPanelModule[];
  accessories?: Array<{ moduleId: string; qty?: number }>;
  sections?: AiPanelSectionResult[];
  error?: string;
}

// ── Panel modules reference (inline — not imported from lib) ──────

const PANEL_MODULES_REFERENCE = `
DOSTEPNE MODULY DIN (uzywaj DOKLADNIE tych moduleId):

ZABEZPIECZENIA NADPRADOWE:
- mcb-b-1p: Wylacznik nadpradowy B 1P (1 mod.), ratingOptions: [6,10,13,16,20,25,32,40,50,63]
- mcb-c-1p: Wylacznik nadpradowy C 1P (1 mod.), ratingOptions: [6,10,13,16,20,25,32,40,50,63]
- mcb-b-3p: Wylacznik nadpradowy B 3P (3 mod.), ratingOptions: [6,10,13,16,20,25,32,40,50,63]
- mcb-c-3p: Wylacznik nadpradowy C 3P (3 mod.), ratingOptions: [6,10,13,16,20,25,32,40,50,63]
- mcb-d-3p: Wylacznik nadpradowy D 3P (3 mod.), ratingOptions: [6,10,16,20,25,32,40,50,63]
- mccb: Wylacznik kompaktowy MCCB (6 mod.), ratingOptions: [63,80,100,125,160,200,250,315,400,500,630]
- mccb-100a: MCCB 100A 3P (6 mod.) | mccb-160a: MCCB 160A 3P (6 mod.) | mccb-250a: MCCB 250A 3P (9 mod.) | mccb-400a: MCCB 400A 3P (9 mod.) | mccb-630a: MCCB 630A 3P (12 mod.)
- acb-800a: Wylacznik ACB 800A 3P (12 mod.) | acb-1600a: Wylacznik ACB 1600A 3P (18 mod.)
- mcb-d-1p: Wylacznik nadpradowy D 1P (1 mod.), ratingOptions: [6,10,16,20,25,32,40,50,63]
- mcb-d-3p: Wylacznik nadpradowy D 3P (3 mod.), ratingOptions: [6,10,16,20,25,32,40,50,63]
- rcbo-c-100ma: RCBO C 100mA 1P (2 mod.), ratingOptions: [16,20,25,32] (ochrona ppoz.)
- rcbo-c-type-f: RCBO C 30mA typ F 1P (2 mod.), ratingOptions: [6,10,16,20,25,32] (do obwodow VFD)
- fuse-3p: Rozlacznik bezpiecznikowy 3P (3 mod.), ratingOptions: [16,25,32,40,50,63]

OCHRONA ROZNICOWA:
- rcd-30-ac: Wylacznik roznicowy 30mA AC 2P (2 mod.), ratingOptions: [16,25,40,63,80]
- rcd-30-a: Wylacznik roznicowy 30mA typ A 2P (2 mod.), ratingOptions: [16,25,40,63,80]
- rcd-30-4p: Wylacznik roznicowy 30mA 4P (4 mod.), ratingOptions: [25,40,63,80]
- rcd-300: Wylacznik roznicowy 300mA ppoz 2P (2 mod.), ratingOptions: [25,40,63,80,100]
- rcd-300-4p: Wylacznik roznicowy 300mA 4P ppoz (4 mod.), ratingOptions: [25,40,63,80,100]

RCBO (kombinowane):
- rcbo-b30: RCBO B 30mA (2 mod.), ratingOptions: [6,10,13,16,20,25,32]
- rcbo-c30: RCBO C 30mA (2 mod.), ratingOptions: [6,10,13,16,20,25,32]

ROZLACZNIKI:
- main-switch-3p: Rozlacznik glowny 3P (3 mod.), ratingOptions: [25,40,63,80,100,125,160]
- main-switch-1p: Rozlacznik izolacyjny 1P (1 mod.), ratingOptions: [25,40,63,80,100]
- changeover-switch: Przelacznik siec/agregat (4 mod.), ratingOptions: [40,63,80,100]
- szr-3p: SZR motoryczny 3P (8 mod.), ratingOptions: [40,63,80,100,125,160]
- szr-4p: SZR motoryczny 4P (10 mod.), ratingOptions: [40,63,80,100,125,160,250]

OCHRONA PRZEPIECIOWA:
- spd-t1t2: Ogranicznik T1+T2 (4 mod.)
- spd-t2: Ogranicznik T2 (3 mod.)
- spd-t2-3p: Ogranicznik T2 3P+N (4 mod.)

STYCZNIKI/PRZEKAZNIKI:
- contactor-2p: Stycznik 2P (2 mod.), ratingOptions: [20,25,40,63]
- contactor-4p: Stycznik 4P (3 mod.), ratingOptions: [25,40,63]
- step-relay: Przekaznik bistabilny (1 mod.)
- staircase-timer: Automat schodowy (1 mod.)

STEROWANIE:
- timer-digital: Programator cyfrowy (2 mod.)
- timer-astro: Programator astronomiczny (2 mod.)
- dimmer-module: Sciemniacz (2 mod.)
- bell-transformer: Transformator dzwonkowy (2 mod.)
- priority-relay: Przekaznik priorytetowy (2 mod.)

MONITORING:
- energy-meter-1p: Licznik energii 1-faz (1 mod.)
- energy-meter-3p: Licznik energii 3-faz (4 mod.)
- phase-monitor: Przekaznik nadzoru faz (2 mod.)
- voltage-relay: Przekaznik napieciowy (2 mod.)
- signal-lamp: Lampka sygnalizacyjna (1 mod.)

AUTOMATYKA:
- knx-power-supply: Zasilacz KNX 30V DC (4 mod.)
- knx-usb-interface: Interfejs KNX/USB (2 mod.)
- plc-basic: Sterownik PLC 8 I/O (6 mod.)

LISTWY ZLACZOWE (ZUG):
- zug-block: Listwa zlaczna / zlaczki DIN (szerokosc: ceil(terminalCount/3) mod.)
  Pola wymagane: "isZugBlock": true, "terminalCount": N (liczba zaciskow)
  Przyklad: {"moduleId":"zug-block","isZugBlock":true,"terminalCount":12}
  Stosuj dla obiektow mieszkalnych >80m2 i wszystkich przemyslowych.
  OBLICZ: terminalCount = liczba_obwodow_wychodzacych x 2 (min 10, max 40).
  Przyklad: 7 obwodow -> terminalCount=14; 12 obwodow -> terminalCount=24

OBUDOWY DOSTEPNE (enclosureModules):
12, 24, 36, 48, 54, 72, 96, 120, 144, 192, 216, 288
`;

// ── Panel system prompt (full engineering rules) ──────────────────

const PANEL_SYSTEM_PROMPT = `<role>
Jestes inzynierem elektrykiem z uprawnieniami SEP (E+D) i 20-letnim doswiadczeniem projektowym.
Specjalizacja: rozdzielnice nn do 1kV wg PN-HD 60364, PN-EN 61439-1/2, PN-EN 62305 (SPD).
WAZNE: Twoj wynik przechodzi automatyczny walidator ElektroSmart. Aby go przejsc BEZ bledow,
MUSISZ uzyc ponizszych wzarow — te same formuly co walidator.
</role>

<validator_formulas>
WALIDATOR SPRAWDZA DOKLADNIE TE OBLICZENIA. Wykonaj przed zapisaniem JSON:

=== BILANS MOCY ===
n = count(MCB_1P) + count(MCB_3P)   [NIE liczyc: rozlacznika, RCD, SPD, ZUG!]

Kj TABLE (PN-HD 60364 §311 — IDENTYCZNA z walidatorem):
  n=1-2:  Kj=1.0
  n=3-4:  Kj=0.8
  n=5-9:  Kj=0.6
  n=10-20: Kj=0.5
  n=21-40: Kj=0.4
  n>40:   Kj=0.35
  (1-faz mieszk.<=40A: n<=2:0.8 | n<=4:0.5 | n<=9:0.3 | n<=20:0.25 | n>20:0.2)

effectiveLoad = (sum1P / phaseCount + sum3P) * Kj
WARUNEK: effectiveLoad <= mainRating  [naruszenie = "Przeciazenie!" w UI]

Przyklad 3F 40A, n=12: sum1P=180A (10xB16+2xB10), sum3P=32A (2xC16/3P)
  Kj=0.5; effectiveLoad=(180/3+32)*0.5=(60+32)*0.5=46A > 40A — ZA DUZO
  Popraw: usun 1xB16A → sum1P=164A; (164/3+32)*0.5=(54.7+32)*0.5=43.3A — dalej za duzo
  Usun jeszcze 1xB16A → sum1P=148A; (148/3+32)*0.5=50.3*0.5=39.1A <= 40A ✓

=== ASYMETRIA FAZ (tylko 3F) ===
L1_sum = suma ratingow MCB_1P z "phase":"L1"
L2_sum = suma ratingow MCB_1P z "phase":"L2"
L3_sum = suma ratingow MCB_1P z "phase":"L3"
asymPct = (max(L1,L2,L3) - min(L1,L2,L3)) / max(L1,L2,L3) * 100
WARUNEK: asymPct <= 30%  [naruszenie = ostrzezenie "Asymetria faz X%!" w UI]

=== SIZING RCD ===
nextRating(x): pierwsza wartosc >= x z [16,25,40,63,80,100]
rcd30_rating  = nextRating(max(ceil(sum_grup * 0.35), max_MCB_w_grupie))
rcd300_rating = max(25, min(100, nextRating(max(mainRating, ceil(sum_ALL_MCB * 0.35)))))
SELEKTYWNOSC:  rcd300_rating > rcd30_rating >= max(MCB downstream)
</validator_formulas>

<assembly_algorithm>
WYKONAJ KROKI W KOLEJNOSCI — wpisz wyniki do reasoning:

KROK 1 — PARAMETRY:
  phaseCount: z opisu (3F/TN-S/400V → 3; pozostale → 1)
  mainRating: z opisu lub default (3F→40A, 1F→25A)
  switchId: 3F<=160A→"main-switch-3p"; >160A lub przemysl→"mccb"

KROK 2 — LISTA OBWODOW (wg tabeli <circuit_selection>):
  Kazdy MCB: {moduleId, rating, label, circuitNumber, cableType, phase(3F tylko)}
  Cel: kompletna lista dla wszystkich pomieszc/obszarow

KROK 3 — SPRAWDZ BILANS:
  Oblicz n, Kj, effectiveLoad. Jesli effectiveLoad > mainRating:
    → Usun MCBs o najwyzszych ratingach (najpierw)
    → Lub zmien B16A→B10A gdzie mozna (oswietlenie)
    → Powtarzaj az effectiveLoad <= mainRating

KROK 4 — PRZYPISZ FAZY (TYLKO 3F, algorytm greedy obowiazkowy):
  a) Posortuj MCB_1P by rating MALEJACO: [C32,C20,B16,B16,...,B10]
  b) Ustaw L1=L2=L3=0
  c) Dla kazdego MCB z listy: przypisz "phase" = faza z min(L1,L2,L3); dodaj rating do tej fazy
  d) Oblicz asymPct. Jesli >30%: zamien fazy 2 MCBow o podobnych ratingach
  Przyklad: [C32,B16,B16,B16,B10,B10] → L1=32+10=42, L2=16+10=26, L3=16+16=32... przetasuj →
    C32→L1, B16→L2, B16→L3, B16→L1? NIE (L1=32>L2=16) → B16→L2=32, B10→L3=26→, B10→L1(32)? nie, L3=26<L1=32 → B10→L3=36
    Wynik: L1=32,L2=32,L3=36 → asym=11% ✓

KROK 5 — GRUPOWANIE RCD 30mA:
  Max 5 MCB_1P na grupe. Mokre (lazienka/kuchnia/WC/kotlownia): osobna dedykowana grupa.
  Oblicz rcd30_rating per gruppe. Uzyj WYLACZNIE rcd-30-a (nie rcd-30-ac!).

KROK 6 — KOMPLETNA SEKWENCJA MODULOW:
  main-switch → SPD → rcd-300/rcd-300-4p → [rcd-30-a + MCBs] × N_grup → [ZUG opcjonalnie]

KROK 7 — WERYFIKACJA KONCOWA (wpisz DO POLA reasoning):
  n=? | Kj=? | effectiveLoad=?A | mainRating=?A | load_ok=?
  L1=?A | L2=?A | L3=?A | asymPct=?% | asym_ok=?
  rcd300=?A >= rcd30max=?A >= maxMCB=?A | sel_ok=?
  dinTotal=? | enclosure=? | spd=?
  Jesli load_ok=false lub asym_ok=false: POPRAW zanim zwrocisz JSON!
</assembly_algorithm>

<available_modules>
${PANEL_MODULES_REFERENCE}
</available_modules>

<circuit_selection>
MCB DOBOR — nie uzywaj B16A dla wszystkich!
  Oswietlenie         → mcb-b-1p  B10A  "YDY 3x1.5"  1P
  Gniazda ogolne      → mcb-b-1p  B16A  "YDY 3x2.5"  1P
  Gniazda kuchnia     → mcb-c-1p  C16A  "YDY 3x2.5"  1P
  Pralka/Zmywarka/AGD → mcb-c-1p  C16A  "YDY 3x2.5"  1P
  Bojler/Ogrzewanie   → mcb-c-1p  C16A  "YDY 3x2.5"  1P
  Klimatyzacja 1F     → mcb-c-1p  C16A  "YDY 3x2.5"  1P
  Kuchenka ind. 1F    → mcb-c-1p  C32A  "YDY 3x6"    1P (rcd30 musi byc >=40A!)
  Kuchenka 3F         → mcb-c-3p  C16A  "YDY 5x4"    3P
  Pompa ciepla 3F     → mcb-c-3p  C20A  "YDY 5x6"    3P
  Ladowarka EV 3F     → mcb-c-3p  C32A  "YDY 5x10"   3P
  Klimatyzacja 3F     → mcb-c-3p  C16A  "YDY 5x4"    3P
  Wentylacja/silnik   → mcb-d-3p  D16A  "YDY 5x4"    3P
  Rolety/brama        → mcb-b-1p  B10A  "YDY 3x1.5"  1P
  Osw. zewnetrzne     → mcb-b-1p  B10A  "YDY 3x1.5"  1P
  Gniazda zewnetrzne  → mcb-b-1p  B16A  "YDY 3x2.5"  1P
</circuit_selection>

<constraints>
- WYLACZNIE moduleId z katalogu (available_modules). Nieistniejacy ID = krytyczny blad.
- WYLACZNIE wartosci rating z ratingOptions danego modulu.
- Obudowa: wybierz z [12,24,36,48,54,72,96,120,144,192,216,288]; suma_DIN * 1.3 <= enclosureModules.
- Max 18 modulow na rzad (TH35 18-mod).
- SPD ZAWSZE: spd-t2 (1F) lub spd-t2-3p (3F) — bezposrednio po rozlaczniku.
- RCD typ A ZAWSZE: rcd-30-a lub rcd-30-4p. NIGDY rcd-30-ac.
- Ghost RCD ZAKAZ: kazdy rcd-30 MUSI miec >=1 MCB po nim.
- ZUG (dom>100m2, biuro, przemysl): isZugBlock:true, terminalCount = n_obwodow*2
</constraints>

<label_rules>
Kazdy MCB/RCBO: pole "label" obowiazkowe (max 15 znakow).
Przyklady: "Osw.Salon", "Gn.Kuchnia", "Pralka", "Plyta.ind", "Pompa", "Lad.EV", "Klima"
</label_rules>

<circuit_rules>
MCB pola: "circuitNumber" (string od "1"), "cableType" (z circuit_selection), "phase" (3F 1P only)
</circuit_rules>`;

// ── Zod schemas ───────────────────────────────────────────────────

const PanelModuleSchema = z.object({
  moduleId: z.string(),
  rating: z.number().optional(),
  qty: z.number().default(1),
  label: z.string().optional(),
  phase: z.string().optional(),
  isZugBlock: z.boolean().optional(),
  terminalCount: z.number().optional(),
});

const PanelReasoningSchema = z.object({
  total_load_kw: z.number().default(0),
  phase_count: z.number().default(1),
  n_circuits: z.number().default(0),
  kj_value: z.number().default(0.5),
  effective_load_a: z.number().default(0),
  load_ok: z.boolean().default(true),
  phase_l1_a: z.number().optional(),
  phase_l2_a: z.number().optional(),
  phase_l3_a: z.number().optional(),
  asymmetry_pct: z.number().optional(),
  asymmetry_ok: z.boolean().optional(),
  selectivity_ok: z.boolean().default(true),
  spd_present: z.boolean().default(true),
  self_correction: z.string().default(""),
  rcd_grouping_logic: z.string().default(""),
}).optional();

const PanelSectionSchema = z.object({
  name: z.string().default("Sekcja"),
  feed: z.string().default("main"),
  type: z.string().default("distribution"),
  enclosureModules: z.number().default(36),
  modules: z.array(PanelModuleSchema).default([]),
});

const PanelConfigResponseSchema = z.object({
  panelName: z.string().default("Rozdzielnica ES-Engine"),
  enclosureModules: z.number().optional(),
  reasoning: PanelReasoningSchema,
  modules: z.array(PanelModuleSchema).optional(),
  sections: z.array(PanelSectionSchema).optional(),
});

// keep TypeScript happy — PanelConfigResponseSchema used only for type inference
void PanelConfigResponseSchema;

// ─────────────────────────────────────────────────────────────────
// generateProjectItemsWithAI
// ─────────────────────────────────────────────────────────────────

export async function generateProjectItemsWithAI(
  projectId: string,
  description: string,
  investmentContext?: string
): Promise<AIGenerateResult> {
  try {
    const guard = await checkGuard(AI_FUNCTION_NAMES.generateItems);
    if ("error" in guard) return { success: false, error: guard.error };
    const { user, supabase } = guard;

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions (price_modifier)")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) return { success: false, error: "Nie masz uprawnien do edycji tego projektu" };
    if (project.status === "final") return { success: false, error: "Projekt jest zablokowany. Odblokuj go, aby generowac pozycje za pomoca AI." };

    const { data: profilePrefs } = await supabase
      .from("profiles")
      .select("show_global_catalog")
      .eq("id", user.id)
      .single();
    const showGlobalCatalog = profilePrefs?.show_global_catalog ?? true;

    const { data: userCatalog } = await supabase
      .from("catalog_items")
      .select("id, name, category, subcategory, unit, base_material_price, base_labor_price, panel_category, catalog_confidence, knr_code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("catalog_confidence", { ascending: true })
      .limit(500);

    let globalCatalog: { id: string; name: string; category: string | null; subcategory: string | null; unit: string; base_material_price: number | null; base_labor_price: number | null; panel_category: string | null; catalog_confidence: string | null; knr_code: string | null }[] = [];
    if (showGlobalCatalog) {
      const { data } = await supabase
        .from("catalog_items")
        .select("id, name, category, subcategory, unit, base_material_price, base_labor_price, panel_category, catalog_confidence, knr_code")
        .is("user_id", null)
        .eq("is_active", true)
        .order("catalog_confidence", { ascending: true })
        .limit(500);
      globalCatalog = data || [];
    }

    const allCatalogItems = [...(userCatalog || []), ...globalCatalog];
    const verifiedItems = allCatalogItems.filter((i) => i.catalog_confidence === "verified");
    const otherItems = allCatalogItems.filter((i) => i.catalog_confidence !== "verified");
    const contextItems = [...verifiedItems, ...otherItems];

    const catalogContext = contextItems
      .map((item) => {
        const knr = item.knr_code ? ` [${item.knr_code}]` : "";
        const conf = item.catalog_confidence === "verified" ? " checkVERIFIED" : "";
        return `- ${item.name} (${item.unit})${knr}${conf} | material: ${item.base_material_price ?? 0} PLN | robocizna: ${item.base_labor_price ?? 0} PLN`;
      })
      .join("\n");

    let kbContext: string | null = null;
    try {
      const fileNames = await Promise.race([
        listKbFileNames(),
        new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 8000)),
      ]);
      if (fileNames && fileNames.length > 0) {
        const ctx = await Promise.race([
          fetchKbContext(fileNames, "knr_knowledge_base"),
          new Promise<string>((resolve) => setTimeout(() => resolve(""), 8000)),
        ]);
        kbContext = ctx && ctx.length > 30 ? ctx : null;
      }
    } catch { /* optional RAG */ }

    const basePrompt = await buildDynamicSystemPrompt("generator");
    const masterSystemPrompt = injectKbContext(basePrompt, kbContext);

    const contextBlock = investmentContext?.trim()
      ? `<investment_context>\nKONTEKST INWESTYCJI (uwzgledniaj przy doborze materialow i ilosci):\n${investmentContext.trim()}\n</investment_context>\n\n`
      : "";

    const dynamicContext = `${contextBlock}<user_catalog>
Dopasuj nazwy DOKLADNIE do katalogu jesli pasuje:
${catalogContext || "(brak katalogu — generuj standardowe nazwy elektryczne)"}
</user_catalog>
INSTRUKCJA: Generuj TYLKO pozycje, jednostki i ilosci — BEZ cen. Ceny wylicza silnik KNR 2026 automatycznie. Podaj kod KNR jesli znasz (pole knr_code).`;

    const itemSchema = z.object({
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        category: z.string().nullable(),
        section: z.string().nullable(),
        notes: z.string().nullable(),
        knr_code: z.string().nullable().describe("Kod KNR np. 'KNR 5-04 0101-01'. null jesli brak."),
      })),
    });

    const generateWithRetry = async (attempt: number) => {
      return generateObject({
        model: google("gemini-2.0-flash"),
        system: `${masterSystemPrompt}\n\n${dynamicContext}`,
        prompt: description,
        schema: itemSchema,
        temperature: attempt === 0 ? 0.1 : 0.3,
        maxOutputTokens: 16000,
      });
    };

    let aiResultRaw;
    try {
      aiResultRaw = await generateWithRetry(0);
    } catch {
      aiResultRaw = await generateWithRetry(1);
    }
    const aiResult = aiResultRaw.object;

    const generatedItems = (aiResult.items || []) as GeneratedItem[];
    if (generatedItems.length === 0) return { success: false, error: "AI nie wygenerowalo pozycji" };

    const { data: maxSortData } = await supabase
      .from("project_items")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let sortOrder = (maxSortData?.sort_order || 0) + 1;

    // Prices intentionally zeroed — KNR pipeline (L0→L3) prices them after insert
    const itemsToInsert = [];
    for (const item of generatedItems) {
      const catalogMatch = findBestCatalogMatch(item.name, allCatalogItems);

      // Pre-fill KNR code: AI-provided → catalog → local JSON — feeds L0 in estimatePricesWithAI
      const aiKnrCode = item.knr_code ?? null;
      const catalogKnrCode = (catalogMatch as { knr_code?: string | null } | null)?.knr_code ?? null;
      const localKnrMatch = !aiKnrCode && !catalogKnrCode ? lookupKnrByName(item.name) : null;
      const rawKnrCode = aiKnrCode || catalogKnrCode || localKnrMatch?.code || null;
      const effectiveKnrCode = rawKnrCode ? normalizeKnrCode(rawKnrCode) : null;

      itemsToInsert.push({
        project_id: projectId,
        catalog_item_id: catalogMatch?.id || null,
        name: catalogMatch?.name || item.name,
        unit: catalogMatch?.unit || item.unit || "szt.",
        quantity: item.quantity || 1,
        material_price: 0,
        labor_price: 0,
        final_material_price: 0,
        final_labor_price: 0,
        is_custom: !catalogMatch,
        section: item.section || null,
        sort_order: sortOrder++,
        notes: item.notes || null,
        knr_code: effectiveKnrCode,
        knr_source: null as string | null,        // Will be set by KNR pipeline
        confidence_level: "uncertain" as string,  // Will be updated by applyAiPrices
        confidence_note: null as string | null,   // Will be set by KNR pipeline
      });
    }

    const { error: insertError } = await supabase.from("project_items").insert(itemsToInsert);
    if (insertError) {
      logger.error("Error inserting AI-generated items:", {}, insertError);
      return { success: false, error: "Blad podczas dodawania pozycji" };
    }

    // ── Run full KNR Pricing Pipeline (L0 → L1 → L2 → L3) ────────────────────────
    // Applies: PricingConfig (height ×1.25, difficulty ×1.22, surface) + user r-g
    // + regional modifier + confidence_note for 'Dlaczego taka cena?' tooltips
    try {
      const pricingResult = await estimatePricesWithAI(projectId, "all");
      if (pricingResult.success && pricingResult.estimates && pricingResult.estimates.length > 0) {
        await applyAiPrices(
          projectId,
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
      logger.error("[generateProjectItemsWithAI] KNR pricing failed", { projectId }, pricingErr);
      // Non-fatal: items created, user can run ES Wycena manually
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, items: generatedItems, addedCount: itemsToInsert.length };
  } catch (error) {
    logger.error("[generateProjectItemsWithAI] error:", {}, error);
    return { success: false, error: "Nieoczekiwany blad" };
  }
}

// ─────────────────────────────────────────────────────────────────
// generatePanelConfigWithAI
// ─────────────────────────────────────────────────────────────────

export async function generatePanelConfigWithAI(
  description: string
): Promise<AiPanelResult> {
  try {
    const guard = await checkGuard("generatePanelConfig");
    if ("error" in guard) return { success: false, error: guard.error };

    const constraints = parseElectricalConstraints(description);
    const { phaseCount, mainRating, rcd300, rcd30max } = constraints;

    const mainSwitchId = phaseCount === 3 ? "main-switch-3p" : "main-switch-1p";
    const rcd300Id = phaseCount === 3 ? "rcd-300-4p" : "rcd-300";
    const wireMain = mainRating <= 25 ? "wire-10" : "wire-16";

    // Valid main switch ratings from catalog ratingOptions
    const MAIN_SWITCH_RATINGS_3P = [25, 40, 63, 80, 100, 125, 160];
    const MAIN_SWITCH_RATINGS_1P = [25, 40, 63, 80, 100];
    const mainSwitchRating = phaseCount === 3
      ? (MAIN_SWITCH_RATINGS_3P.find(r => r >= mainRating) ?? 25)
      : (MAIN_SWITCH_RATINGS_1P.find(r => r >= mainRating) ?? 25);

    // Compute max 1P circuits using Kj=0.5 (diagnostic table: 10-20 circuits, 3-phase)
    //   3-phase: (sum1P/3)×0.5 ≤ mainRating → sum1P ≤ mainRating×6
    //   1-phase: sum1P×0.25 ≤ mainRating → sum1P ≤ mainRating×4
    const maxCircuits1P = phaseCount === 3
      ? Math.max(4, Math.floor((mainRating * phaseCount) / (16 * 0.5)))
      : Math.max(3, Math.floor(mainRating / (16 * 0.25)));

    const buildPrompt = (desc: string) => `Zaprojektuj rozdzielnice elektryczna dla: ${desc}

HARD CONSTRAINTS (nie mozesz ich zmienic):
- Uklad zasilania: ${phaseCount}-fazowy
- Prad przylacza: ${mainRating}A
- Wylacznik glowny: {"moduleId":"${mainSwitchId}","rating":${mainSwitchRating}} [${mainSwitchRating}A = najblizszy wyzszy z ratingOptions]
- SPD: OBOWIAZKOWY — {"moduleId":"${phaseCount === 3 ? 'spd-t2-3p' : 'spd-t2'}"}
- RCD 300mA (ppoz.): {"moduleId":"${rcd300Id}","rating":${rcd300}} — min rating = max(${rcd300}A, ceil(suma_MCB x 0.35)), max 100A
- RCD 30mA grupy: max 5 MCB na grupe; suma_grupy x 0.35 <= rating (min ${rcd30max}A)
  Dla 3-faz: uzywaj rcd-30-a (2P) lub rcd-30-4p (4P); NIGDY rcd-30-ac
- MCB 1-biegunowe: oswietlenie ZAWSZE B10A, gniazda B16A; AGD C16A; kuchenka C32A; pompa C20A
- Przewod zasilajacy: "${wireMain}"
- MAX OBWODOW 1-fazowych: ${maxCircuits1P} (przy B16A). Z B10A mozna +30% wiecej.
  FORMULA: (suma_1P / ${phaseCount}) x 0.5 <= ${mainRating}A [Kj=0.5 dla 10-20 obw. wg PN-HD 60364 §311]
- Obwody 3-fazowe: suma_3P x 0.5 <= ${mainRating}A
- ZUG: terminalCount = liczba_obwodow x 2 (min 10)

SELEKTYWNOSC: main-switch ${mainRating}A -> rcd-300 >= rcd-30 >= max(MCB downstream)
RCD 300mA PRZYKLAD: 10xB16A=160A; 160x0.35=56A -> rcd-300 min 63A; 14xB16A=224A -> min 80A

Zwroc WYLACZNIE poprawny JSON (bez markdown) w formacie:
{
  "panelName": "...",
  "enclosureModules": 36,
  "reasoning": {
    "phase_count": ${phaseCount},
    "n_circuits": 0,
    "kj_value": 0.5,
    "effective_load_a": 0,
    "load_ok": true,
    "phase_l1_a": 0, "phase_l2_a": 0, "phase_l3_a": 0,
    "asymmetry_pct": 0, "asymmetry_ok": true,
    "selectivity_ok": true, "spd_present": true,
    "self_correction": "opis korekcji lub OK",
    "rcd_grouping_logic": ""
  },
  "modules": [...aparatura DIN na szynach...],
  "accessories": [
    {"moduleId":"${wireMain}","qty":1},
    {"moduleId":"wire-1-5","qty":1},
    {"moduleId":"wire-2-5","qty":1},
    {"moduleId":"busbar-2p","qty":1},
    {"moduleId":"pe-bar","qty":1},
    {"moduleId":"n-bar","qty":1},
    {"moduleId":"ferrule-small","qty":1},
    {"moduleId":"cable-tie-200","qty":1},
    {"moduleId":"marking-strip","qty":1},
    {"moduleId":"labor-assembly","qty":1},
    {"moduleId":"labor-cable-routing","qty":1},
    {"moduleId":"labor-testing","qty":1},
    {"moduleId":"labor-marking","qty":1}
  ]
}`;

    const attemptGenerate = async (desc: string, temp: number) => {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: PANEL_SYSTEM_PROMPT,
        prompt: buildPrompt(desc),
        temperature: temp,
        maxOutputTokens: 10000,
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Brak JSON w odpowiedzi ES-Engine");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return JSON.parse(jsonMatch[0]) as Record<string, any>;
    };

    let parsed = await attemptGenerate(description, 0.1);

    const hasModules = Array.isArray(parsed.modules) && parsed.modules.length > 0;
    const hasSections = Array.isArray(parsed.sections) && parsed.sections.some(
      (s: Record<string, unknown>) => Array.isArray(s.modules) && (s.modules as unknown[]).length > 0
    );

    if (!hasModules && !hasSections) {
      parsed = await attemptGenerate(description, 0.4);
    }

    const mapReasoning = (r: Record<string, unknown>): AiPanelReasoning => ({
      total_load_kw: typeof r.total_load_kw === "number" ? r.total_load_kw : 0,
      phase_count: typeof r.phase_count === "number" ? r.phase_count : 1,
      phase_balance_strategy: typeof r.phase_balance_strategy === "string" ? r.phase_balance_strategy : "",
      rcd_grouping_logic: typeof r.rcd_grouping_logic === "string" ? r.rcd_grouping_logic : "",
      selectivity_checks: Array.isArray(r.selectivity_checks) ? r.selectivity_checks as string[] : [],
      self_correction_checks: Array.isArray(r.self_correction_checks) ? r.self_correction_checks as string[] : [],
    });

    const rawSections = Array.isArray(parsed.sections) ? parsed.sections as Record<string, unknown>[] : [];
    const sectionsWithModules = rawSections.filter(
      (s) => Array.isArray(s.modules) && (s.modules as unknown[]).length > 0
    );

    if (sectionsWithModules.length > 0) {
      const processedSections = sectionsWithModules.map((s) => {
        const rawMods = (s.modules as Record<string, unknown>[]).map(mapRawModule);
        const processedMods = fixSelectivity(
          fixPhaseBalance(
            fixLoadBalance(reorderRcdBeforeMcbs(rawMods), mainRating, phaseCount),
            phaseCount
          ),
          mainRating
        );
        const aiEnclosure = typeof s.enclosureModules === "number" ? s.enclosureModules : 36;
        return {
          name: typeof s.name === "string" ? s.name : "Sekcja",
          feed: typeof s.feed === "string" ? s.feed : "main",
          type: typeof s.type === "string" ? s.type : "distribution",
          enclosureModules: Math.max(aiEnclosure, computeEnclosureModules(processedMods)),
          modules: processedMods,
        };
      });
      const allMods = processedSections.flatMap((s) => s.modules);
      const totalEncMods = processedSections.reduce((s, sec) => s + sec.enclosureModules, 0);
      return {
        success: true,
        panelName: typeof parsed.panelName === "string" ? parsed.panelName : "Rozdzielnica ES-Engine",
        reasoning: parsed.reasoning ? mapReasoning(parsed.reasoning as Record<string, unknown>) : undefined,
        accessories: computeAccessories(allMods, totalEncMods, phaseCount, mainRating),
        sections: processedSections,
      };
    }

    const rawModules = Array.isArray(parsed.modules) ? parsed.modules as Record<string, unknown>[] : [];
    if (rawModules.length === 0) {
      return { success: false, error: "ES-Engine nie zwróciło listy modułów. Spróbuj bardziej szczegółowego opisu." };
    }

    const singleEncMods = typeof parsed.enclosureModules === "number" ? parsed.enclosureModules : 36;
    const rawMappedModules = rawModules.map(mapRawModule);
    const processedModules = fixSelectivity(
      fixPhaseBalance(
        fixLoadBalance(reorderRcdBeforeMcbs(rawMappedModules), mainRating, phaseCount),
        phaseCount
      ),
      mainRating
    );
    const autoEnclosure = Math.max(singleEncMods, computeEnclosureModules(processedModules));
    return {
      success: true,
      panelName: typeof parsed.panelName === "string" ? parsed.panelName : "Rozdzielnica ES-Engine",
      reasoning: parsed.reasoning ? mapReasoning(parsed.reasoning as Record<string, unknown>) : undefined,
      enclosureModules: autoEnclosure,
      modules: processedModules,
      accessories: computeAccessories(processedModules, singleEncMods, phaseCount, mainRating),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("generatePanelConfigWithAI error:", {}, msg);
    return { success: false, error: `Błąd ES-Engine: ${msg.slice(0, 200)}` };
  }
}
