import { logger } from "@/lib/logger";
import React from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEffectiveIsPro } from "@/lib/auth/entitlements";
import { flattenProjectItems } from "@/lib/utils/flatten-project-items";
import type { ProjectItem } from "@/lib/types/database";
import {
  fMoney,
  sanitize,
  getVatMultiplier,
  calcPdfTotals,
  type PriceDisplay,
} from "@/lib/pdf-pricing";
import { type PdfNarzutyDisplay, type PdfRow } from "@/lib/pdf-renderer";
import { calcNarzuty } from "@/lib/pricing-calculations";
import { getKnrMultiplier } from "@/lib/global-benchmarks";
import { classifyIntent } from "@/lib/services/semantic-classifier";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { PremiumPdfDocument, type PdfEngineData, type ThemeName, type PdfStructureOptions } from "@/lib/pdf-engine";
import {
  expandToAssembly, detectSector,
  type ProjectSector, type SmartExpansionResult, type AssemblyOverrides,
} from "@/lib/ai/smart-mapping-engine";
import { detectSmartContext } from "@/lib/ai/smart-context-mapper";

// ─── Logo fetch ──────────────────────────────────────────────────────────────

async function fetchImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") ?? "image/png";
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    logger.error("Error fetching logo:", {}, e);
    return null;
  }
}


// ─── Semantic Section Sorter (Smart PDF Grouping v2.0) ──────────────────────

type PdfSectionId =
  | "I_PRZYGOT"    // Demolition, cutting, drilling
  | "II_TRASY"     // Cable laying, conduits, trays
  | "III_OSPRZET"  // Devices, sockets, lighting
  | "IV_ROZDZ"     // Distribution boards, heavy conn.
  | "V_SPEC"       // PV, Industrial, Fire Safety, Commercial
  | "VI_POMIARY";  // Testing, measurements, commissioning

const POMIAR_PDF_RE = /pomiar|odbior|sprawdzen|protokol|atest|komisj|uziom|rezystancj|szczelno|izolacj.*test/i;

const INTENT_TO_PDF_SECTION: Record<string, PdfSectionId> = {
  DEMOLITION:         "I_PRZYGOT",
  HARD_CONSTRUCTION:  "I_PRZYGOT",
  DRILLING_HARD:      "I_PRZYGOT",
  CABLE_LAYING:       "II_TRASY",
  GENERAL:            "III_OSPRZET",
  STANDARD_ACTION:    "III_OSPRZET",
  DISTRIBUTION_BOARD: "IV_ROZDZ",
  HEAVY_CONNECTION:   "IV_ROZDZ",
  PV_INSTALLATION:    "V_SPEC",
  INDUSTRIAL_INSTALL: "V_SPEC",
  FIRE_SAFETY_LINE:   "V_SPEC",
  COMMERCIAL_INSTALL: "V_SPEC",
};

interface PdfSectionDef {
  id:    PdfSectionId;
  roman: string;
  label: string;
}

const PDF_SECTIONS: PdfSectionDef[] = [
  { id: "I_PRZYGOT",   roman: "I",   label: "PRACE PRZYGOTOWAWCZE I DEMONTAŻ"        },
  { id: "II_TRASY",    roman: "II",  label: "TRASY KABLOWE I OKABLOWANIE"              },
  { id: "III_OSPRZET", roman: "III", label: "OSPRZĘT ELEKTRYCZNY I OPRAWY"             },
  { id: "IV_ROZDZ",    roman: "IV",  label: "ROZDZIELNICE I ZASILANIE"                 },
  { id: "V_SPEC",      roman: "V",   label: "SYSTEMY SPECJALNE (PV/PPOŻ/PRZEMYSŁ)"    },
  { id: "VI_POMIARY",  roman: "VI",  label: "POMIARY, ODBIORY I URUCHOMIENIE"          },
];

function classifyItemSection(itemName: string): PdfSectionId {
  if (POMIAR_PDF_RE.test(itemName)) return "VI_POMIARY";
  const { intent } = classifyIntent(itemName);
  return (INTENT_TO_PDF_SECTION[intent] ?? "III_OSPRZET") as PdfSectionId;
}

// ─── Price helpers ────────────────────────────────────────────────

function getPrice(item: Record<string, unknown>, type: "mat" | "lab"): number {
  if (type === "mat")
    return Number(item.final_material_price || item.material_price || item.price_material || item.material || item.materialPrice || 0);
  return Number(item.final_labor_price || item.labor_price || item.price_labor || item.labor || item.laborPrice || item.robocizna || 0);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      projectId,
      priceModifier = 0,
      notes = "",
      template = "klasyczny",
      vatMode = 23,
      priceDisplay = "netto",
      blindMode = false,      // v3.0: Kosztorys ślepy — hide all prices
      showColors = true,
      pdfStructure: rawPdfStructure,
    } = await req.json();

    const pdfStructure: PdfStructureOptions = {
      showCoverPage:      rawPdfStructure?.showCoverPage      ?? false,
      showCompanyHeader:  rawPdfStructure?.showCompanyHeader  ?? true,
      showProjectMeta:    rawPdfStructure?.showProjectMeta    ?? true,
      showSectionGroups:  rawPdfStructure?.showSectionGroups  ?? true,
      showSummaryBlock:   rawPdfStructure?.showSummaryBlock   ?? true,
      showLegend:         rawPdfStructure?.showLegend         ?? true,
    };

    const pricingParams = {
      vatMode: Number(vatMode),
      priceDisplay: priceDisplay as PriceDisplay,
    };
    const vatMultiplier = getVatMultiplier(priceDisplay as PriceDisplay, Number(vatMode));

    // ─── Fetch data ────────────────────────────────────────────────────────────

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions(*), object_types(*), paid_export_unlocked_at")
      .eq("id", projectId)
      .single();

    const { data: items } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (!project || !items) {
      logger.error("Project or items not found", {});
      return new NextResponse("Error", { status: 404 });
    }

    // Flatten so every child item appears immediately after its parent
    const flatItems = flattenProjectItems(items as unknown as ProjectItem[]) as typeof items;

    // [A5] PRO check: verify the REQUESTING user, not the project owner.
    // This prevents team members without PRO from exporting via direct API calls.
    const { data: { user: requestingUser } } = await supabase.auth.getUser();
    if (!requestingUser) {
      return new NextResponse(
        JSON.stringify({ error: "Musisz być zalogowany" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: requestingProfile } = await supabase
      .from("profiles")
      .select("is_pro, trial_started_at, trial_ends_at")
      .eq("id", requestingUser.id)
      .single();

    // v2.1: effective PRO = paid subscription OR active 7-day trial
    const isPro = getEffectiveIsPro(requestingProfile as {
      is_pro?: boolean | null;
      trial_started_at?: string | null;
      trial_ends_at?: string | null;
    } | null);
    const isDemoProject = Boolean((project as Record<string, unknown>).is_demo_project);

    // v2.0 Pay-per-Export: one-time unlock (29 zł) lets FREE user export ONE
    // clean PDF for THIS project. Only the project owner can consume it —
    // otherwise team members could drain an unlock bought by someone else.
    const paidExportUnlockedAt = (project as Record<string, unknown>).paid_export_unlocked_at as string | null | undefined;
    const isOwner = project.user_id === requestingUser.id;
    const hasPaidUnlock = Boolean(paidExportUnlockedAt) && isOwner;

    // v2.0: FREE tier CAN export PDF, but receives a diagonal "DEMO" watermark
    // overlay + footer CTA on every page. Demo projects bypass the watermark
    // (they're already marked as demo samples). A paid one-shot unlock also
    // bypasses the watermark and is consumed by the very next export.
    const showDemoWatermark = !isPro && !isDemoProject && !hasPaidUnlock;

    // Rate limiting: FREE tier gets stricter caps to prevent automated scraping
    // of the watermarked demo output. PRO keeps the generous limit.
    const pdfLimit = isPro ? 20 : 5;
    const pdfRl = checkRateLimit({ key: `pdf:${requestingUser.id}`, limit: pdfLimit, windowMs: 60_000 });
    if (!pdfRl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zbyt wiele żądań PDF. Spróbuj ponownie za chwilę." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((pdfRl.retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    // Fetch owner's profile for branding data (logo, company name, etc.)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, nip, regon, address, street, city, postal_code, phone, email, logo_url")
      .eq("id", project.user_id)
      .single();

    // ─── Math engine ──────────────────────────────────────────────────────────

    const regionModifier = (project.regions as { price_modifier?: number } | null)?.price_modifier ?? 1.0;
    const adjustmentOnly = 1 + Number(priceModifier) / 100;
    // [A1] showRg and showKnrInPdf read directly from project settings (no pricingMode gate)
    const showRg = Boolean(project.show_labor_hours_in_pdf);
    // v2.0: maskPrices is only for explicit "kosztorys ślepy" (blindMode).
    // Free tier gets the watermark overlay instead of masked numbers — they need
    // to see the exact prices to evaluate ROI and commit to PRO.
    const maskPrices = Boolean(blindMode);
    const showKnrInPdf = Boolean((project as Record<string, unknown>).show_knr);
    // If materials are provided by the client — hide Material column entirely from PDF
    const matOwnedByClient = Boolean((project as Record<string, unknown>).materials_owned_by_customer);

    // v10.5 FIX: Apply v3.0 pricing multipliers — must match project-summary.tsx
    const matMarkupMult   = 1 + (Number((project as Record<string, unknown>).mat_markup_pct) || 0) / 100;
    const labMarkupMult   = 1 + (Number((project as Record<string, unknown>).lab_markup_pct) || 0) / 100;
    const complexityFactor = 1.0;
    const contingencyPct  = Number((project as Record<string, unknown>).contingency_pct) || 0;
    // KNR 2026 multiplier — must match display-time calcRowPrices() in EstimateRow
    const knrMultiplier = await getKnrMultiplier();

    // Smart Assembly: sector + labor rate for AI-triggered zestaw expansion
    const projectSector: ProjectSector = detectSector(
      (project.object_types as { slug?: string } | null)?.slug
    );
    const projectLaborRate = Number((project as Record<string, unknown>).default_hourly_rate ?? 100);

    const calcItems = flatItems.map(item => {
      const isManualItem = (item as Record<string, unknown>).confidence_level === "manual";
      const isInvestorMat = Boolean((item as Record<string, unknown>).is_investor_material);
      // Iron Rule: regionModifier ONLY on labor — material is sovereign
      // Material: base × matMarkupMult × adjustmentOnly (no regionModifier)
      // Labor: base × labMarkupMult × complexityFactor × adjustmentOnly × regionModifier (manual skips region)
      const effectiveRegion = isManualItem ? 1.0 : regionModifier;
      return {
        ...item,
        // matOwnedByClient or isInvestorMat: zero out material prices
        finalMat: (matOwnedByClient || isInvestorMat) ? 0 : getPrice(item, "mat") * matMarkupMult * adjustmentOnly * vatMultiplier,
        finalLab: getPrice(item, "lab") * labMarkupMult * knrMultiplier * adjustmentOnly * effectiveRegion * vatMultiplier,
        laborNorm: Number((item as Record<string, unknown>).labor_norm ?? 0),
        isInvestorMat,
      };
    });

    // Detect all children by EITHER field (belt-and-suspenders for legacy data)
    const parentIds = new Set(
      calcItems
        .filter(i => i.parent_assembly_id || (i as Record<string,unknown>).is_assembly_child === true)
        .map(i => i.parent_assembly_id as string)
        .filter(Boolean)
    );

    // Pre-compute AI assembly expansions for items that trigger Smart Engine
    // (items with no real DB children but matching Sacred Words in their name)
    const aiExpansionMap = new Map<string, SmartExpansionResult>();
    for (const item of calcItems) {
      const rawI = item as Record<string, unknown>;
      if (rawI.parent_assembly_id || rawI.is_assembly_child === true) continue;
      if (parentIds.has(item.id as string)) continue; // already has real DB children
      if (rawI.confidence_level === "manual") continue;
      const scm = detectSmartContext(item.name as string);
      if (scm.category === "NONE") continue;
      const expansion = expandToAssembly(
        item.name as string,
        item.quantity as number,
        projectSector,
        projectLaborRate,
        knrMultiplier,
        (rawI.assembly_overrides as AssemblyOverrides) ?? undefined,
      );
      if (expansion.triggered) aiExpansionMap.set(item.id as string, expansion);
    }

    let totalMatSum = 0;
    let totalLabSum = 0;

    // Build rows — loop instead of map so we can insert virtual children for AI zestawy
    const rowsRaw: PdfRow[] = [];
    for (const item of calcItems) {
      const isParent = parentIds.has(item.id as string);
      const rawItem = item as Record<string, unknown>;
      const isChild = !!(item.parent_assembly_id) || rawItem.is_assembly_child === true;
      const aiExpansion = aiExpansionMap.get(item.id as string);
      const isAiParent = !!aiExpansion;
      const isManualItem = rawItem.confidence_level === "manual";
      const effRegion = isManualItem ? 1.0 : regionModifier;
      const unitCombined = item.finalMat + item.finalLab;
      let totalVal = unitCombined * item.quantity;
      let matDisplay = maskPrices ? "*** zl" : fMoney(item.finalMat);
      let labDisplay = maskPrices ? "*** zl" : fMoney(item.finalLab);
      const combinedDisplay = maskPrices ? "*** zl" : fMoney(unitCombined);
      let indexDisplay = "";
      let rowType = "single";

      if (isAiParent) {
        // AI-triggered zestaw: use expansion prices (honours assembly_overrides)
        const expMatTotal = aiExpansion.totalMaterialPLN * matMarkupMult * adjustmentOnly * vatMultiplier;
        const expLabTotal = aiExpansion.totalLaborPLN  * labMarkupMult * adjustmentOnly * effRegion * vatMultiplier;
        totalVal = expMatTotal + expLabTotal;
        matDisplay = "---";
        labDisplay = "---";
        indexDisplay = "";
        rowType = "set_parent";
        totalMatSum += expMatTotal;
        totalLabSum += expLabTotal;
      } else if (isParent) {
        const children = calcItems.filter(c => c.parent_assembly_id === item.id);
        totalVal = children.reduce((acc, c) => acc + (c.finalMat + c.finalLab) * c.quantity, 0);
        matDisplay = "---";
        labDisplay = "---";
        indexDisplay = ""; // will be assigned after semantic grouping
        rowType = "set_parent";
      } else if (isChild) {
        indexDisplay = "";
        totalMatSum += item.finalMat * item.quantity;
        totalLabSum += item.finalLab * item.quantity;
        const isMaterial = item.finalMat > 0 && item.finalLab === 0;
        const isLabor = item.finalLab > 0 && item.finalMat === 0;
        const isMixed = item.finalMat > 0 && item.finalLab > 0;
        if (totalVal === 0) {
          rowType = "warning";
        } else if (isMaterial) { rowType = "child_mat"; }
        else if (isLabor) { rowType = "child_lab"; }
        else if (isMixed) { rowType = item.finalMat > item.finalLab ? "child_mat" : "child_lab"; }
        else { rowType = "child_mat"; }
      } else {
        indexDisplay = ""; // will be assigned after semantic grouping
        totalMatSum += item.finalMat * item.quantity;
        totalLabSum += item.finalLab * item.quantity;
        if (totalVal === 0) rowType = "warning";
      }

      const rawKnrCode = (item as Record<string, unknown>).knr_code as string | null | undefined;
      const knrCode = rawKnrCode ? sanitize(rawKnrCode, true) : "";
      let name = sanitize(item.name as string, true);
      if (rowType === "set_parent") name = `>> ${name}`;
      else if (isChild) {
        if (rowType === "warning") name = `  \u21b3 ${name} (BRAK CENY!)`;
        else if (rowType === "child_mat") name = `  \u21b3 ${name}`;
        else if (rowType === "child_lab") name = `  \u21b3 ${name}`;
        else name = `  \u21b3 ${name}`;
      } else if (rowType === "warning") name = `${name} (BRAK CENY!)`;

      const laborNormDisplay = showRg
        ? (item.laborNorm > 0 ? `${(item.laborNorm * item.quantity).toFixed(3)} rbh` : "—")
        : "";

      rowsRaw.push({
        index: indexDisplay, name, knrCode, unit: item.unit as string, qty: item.quantity as number,
        rg: laborNormDisplay, mat: matDisplay, lab: labDisplay, combined: combinedDisplay,
        total: maskPrices ? (isPro && blindMode ? "---" : "*** zl") : fMoney(totalVal), rawTotal: blindMode ? 0 : totalVal, rowType, isParent: isParent || isAiParent, isChild,
        isInvestorMat: item.isInvestorMat, _itemId: item.id as string,
      });

      // AI parent: append virtual child rows derived from expandToAssembly
      if (isAiParent) {
        for (const vChild of aiExpansion.items) {
          const vMat = vChild.materialTotal * matMarkupMult * adjustmentOnly * vatMultiplier;
          const vLab = vChild.rbhTotal * projectLaborRate * labMarkupMult * adjustmentOnly * effRegion * vatMultiplier;
          const vTotal = vMat + vLab;
          const vRowType = vChild.isLabor ? "child_lab" : (vChild.materialTotal > 0 && vChild.rbhTotal > 0 ? "child_mat" : vChild.materialTotal > 0 ? "child_mat" : "child_lab");
          const vRg = showRg && vChild.rbhTotal > 0 ? `${vChild.rbhTotal.toFixed(3)} rbh` : "";
          rowsRaw.push({
            index: "",
            name: `  \u21b3 ${sanitize(vChild.label, true)}`,
            knrCode: vChild.knrCode ? sanitize(vChild.knrCode, true) : "",
            unit: vChild.unit,
            qty: vChild.quantity,
            rg: vRg,
            mat: maskPrices ? "*** zl" : (vChild.materialTotal > 0 ? fMoney(vMat) : "---"),
            lab: maskPrices ? "*** zl" : (vChild.rbhTotal > 0 ? fMoney(vLab) : "---"),
            combined: maskPrices ? "*** zl" : fMoney(vTotal),
            total: maskPrices ? "*** zl" : fMoney(vTotal),
            rawTotal: blindMode ? 0 : vTotal,
            rowType: vRowType, isParent: false, isChild: true, _itemId: item.id as string,
          });
        }
      }
    }

    // ─── Smart PDF Grouping v2.0: Semantic Section Sorter ────────────────────

    // Step 1: assign section to each top-level item by SemanticClassifier
    const semanticSectionMap = new Map<string, PdfSectionId>();
    for (const item of calcItems) {
      if (!item.parent_assembly_id) {
        semanticSectionMap.set(item.id as string, classifyItemSection(item.name as string));
      }
    }
    // Children inherit their parent's section
    for (const item of calcItems) {
      if (item.parent_assembly_id) {
        const ps = semanticSectionMap.get(item.parent_assembly_id as string) ?? "III_OSPRZET";
        semanticSectionMap.set(item.id as string, ps);
      }
    }

    // Step 2: per-section mat/lab totals (for subtotals + Executive Summary)
    const sectionTotalsMap = new Map<PdfSectionId, { mat: number; lab: number }>(
      PDF_SECTIONS.map(s => [s.id, { mat: 0, lab: 0 }])
    );
    for (const item of calcItems) {
      if (parentIds.has(item.id)) continue; // skip parents — children are counted individually
      const sec = semanticSectionMap.get(item.id as string) ?? "III_OSPRZET";
      const st = sectionTotalsMap.get(sec)!;
      st.mat += item.finalMat * item.quantity;
      st.lab += item.finalLab * item.quantity;
    }

    // Step 3: build final rows — grouped by semantic section OR flat (based on showSectionGroups)
    const rows: PdfRow[] = [];
    if (pdfStructure.showSectionGroups) {
      for (const secDef of PDF_SECTIONS) {
        const secRawRows = rowsRaw
          .filter(row => row._itemId && semanticSectionMap.get(row._itemId) === secDef.id);

        if (secRawRows.length === 0) continue;

        const secT   = sectionTotalsMap.get(secDef.id)!;
        const secTot = secT.mat + secT.lab;
        const secItemCount = secRawRows.filter(row => !row.isChild).length;

        rows.push({
          index: "",
          name: `${secDef.roman}. ${secDef.label}  (${secItemCount} poz.)`,
          knrCode: "", unit: "", qty: 0,
          rg: "", mat: "", lab: "", combined: "",
          total: maskPrices ? "" : fMoney(secTot),
          rawTotal: secTot,
          rowType: "section_header", isParent: false, isChild: false,
        });

        for (const row of secRawRows) rows.push(row);

        rows.push({
          index: "",
          name: sanitize(`Suma sekcji: Material ${fMoney(secT.mat)} PLN | Robocizna ${fMoney(secT.lab)} PLN`, true),
          knrCode: "", unit: "", qty: 0,
          rg: "",
          mat: maskPrices ? "" : fMoney(secT.mat),
          lab: maskPrices ? "" : fMoney(secT.lab),
          combined: "",
          total: maskPrices ? "" : fMoney(secTot),
          rawTotal: secTot,
          rowType: "section_subtotal", isParent: false, isChild: false,
        });
      }
    } else {
      // Flat mode — preserve original sort_order, no section headers
      rows.push(...rowsRaw);
    }

    // ── Re-number all LP sequentially in final PDF display order ──────────────
    let lpCounter = 1;
    for (const row of rows) {
      if (row.rowType === 'section_header' || row.rowType === 'section_subtotal') continue;
      if (row.isChild) continue;
      row.index = String(lpCounter++);
    }

    // ─── Narzuty (Kp, Z, Kz) ─────────────────────────────────────────────────
    // Computed on NET values; for brutto mode de-inflate first, then re-inflate

    const kpPercent = Number((project as Record<string, unknown>).kp_percent ?? 0);
    const zPercent  = Number((project as Record<string, unknown>).z_percent  ?? 0);
    const kzPercent = Number((project as Record<string, unknown>).kz_percent ?? 0);
    const hasNarzuty = kpPercent > 0 || zPercent > 0 || kzPercent > 0;

    let pdfNarzuty: PdfNarzutyDisplay | undefined;
    let narzutyForTotals = 0;

    if (hasNarzuty) {
      // totalMatSum / totalLabSum may include vatMultiplier → de-inflate to get NET
      const netMat = vatMultiplier !== 1 ? totalMatSum / vatMultiplier : totalMatSum;
      const netLab = vatMultiplier !== 1 ? totalLabSum / vatMultiplier : totalLabSum;
      const { kpAmount, zAmount, kzAmount, totalNarzuty } = calcNarzuty(
        netLab, netMat, { kpPercent, zPercent, kzPercent },
      );
      // Re-inflate to display currency (vatMultiplier=1 in netto mode → no change)
      const dm = vatMultiplier;
      pdfNarzuty = {
        kpAmount:     Math.round(kpAmount     * dm * 100) / 100,
        kpPercent,
        zAmount:      Math.round(zAmount      * dm * 100) / 100,
        zPercent,
        kzAmount:     Math.round(kzAmount     * dm * 100) / 100,
        kzPercent,
        totalNarzuty: Math.round(totalNarzuty * dm * 100) / 100,
      };
      narzutyForTotals = pdfNarzuty.totalNarzuty;
    }

    // ─── Totals ───────────────────────────────────────────────────────────────

    // v10.5 FIX: Add contingency (rezerwa budżetowa) BEFORE VAT — matches project-summary.tsx
    const subtotalWithNarzuty = totalMatSum + totalLabSum + narzutyForTotals;
    const contingencyAmount = contingencyPct > 0 ? Math.round(subtotalWithNarzuty * contingencyPct / 100 * 100) / 100 : 0;
    const narzutyPlusContingency = narzutyForTotals + contingencyAmount;

    const { totalNet, vatRate, vatAmount, totalGross } = calcPdfTotals(totalMatSum, totalLabSum, pricingParams, narzutyPlusContingency);
    const totalLaborHours = calcItems.reduce((sum, item) => {
      if (item.parent_assembly_id) return sum;
      return sum + (item.laborNorm * item.quantity);
    }, 0);

    // ─── Build PDF ────────────────────────────────────────────────────────────

    const logoBase64 = profile?.logo_url ? await fetchImage(profile.logo_url) : null;

    // ─── Assemble PdfEngineData & render ──────────────────────────────────────

    const engineData: PdfEngineData = {
      theme: (template as ThemeName) || 'klasyczny',
      profile: profile ?? null,
      project: {
        id: project.id as string,
        name: project.name as string,
        client_name: (project as Record<string, unknown>).client_name as string | null,
        client_address: (project as Record<string, unknown>).client_address as string | null,
        client_nip: (project as Record<string, unknown>).client_nip as string | null,
        vat_rate: (project as Record<string, unknown>).vat_rate as number | null,
        regions: (project.regions as { name?: string; price_modifier?: number } | null),
        object_types: (project.object_types as { name?: string } | null),
      },
      rows,
      logoBase64,
      maskPrices,
      blindMode: Boolean(blindMode),
      showRg,
      showKnr: showKnrInPdf,
      pdfStructure,
      matOwnedByClient,
      totalMatSum,
      totalLabSum,
      totalLaborHours,
      totalNet,
      vatRate,
      vatAmount,
      totalGross,
      pdfNarzuty: pdfNarzuty as PdfNarzutyDisplay | undefined,
      priceDisplay: priceDisplay as string,
      notes: notes as string,
      showDemoWatermark,
      showColors: Boolean(showColors),
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(PremiumPdfDocument, { data: engineData }) as React.ReactElement<DocumentProps>
    );

    // v2.0 Pay-per-Export: consume the one-shot unlock AFTER successful render.
    // Atomic: only clear the flag if it still points to the same timestamp we
    // observed at request start — prevents double-consumption under parallel
    // requests and preserves the unlock if renderToBuffer throws (handled by
    // catch block below).
    if (hasPaidUnlock && paidExportUnlockedAt) {
      const { error: consumeErr } = await supabaseAdmin
        .from("projects")
        .update({ paid_export_unlocked_at: null })
        .eq("id", projectId)
        .eq("user_id", requestingUser.id)
        .eq("paid_export_unlocked_at", paidExportUnlockedAt);
      if (consumeErr) {
        // Non-fatal — PDF has already been generated cleanly. Just log for audit.
        logger.error("[PDF] Failed to consume pay-per-export unlock (PDF already generated):", { projectId }, consumeErr);
      } else {
        logger.info("[PDF] Consumed pay-per-export unlock", { projectId, userId: requestingUser.id });
      }
    }

    const safeName = (project.name as string).replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filePrefix = showDemoWatermark
      ? 'DEMO_Kosztorys'
      : (blindMode && isPro ? 'Kosztorys_Slepy' : 'Kosztorys');
    const filename = `${filePrefix}_${safeName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    logger.error("PDF Generation Error:", {}, e);
    return new NextResponse("Error", { status: 500 });
  }
}
