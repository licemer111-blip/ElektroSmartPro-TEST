import { logger } from "@/lib/logger";
import React from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  fMoney,
  sanitize,
  getVatMultiplier,
  calcPdfTotals,
  type PriceDisplay,
} from "@/lib/pdf-pricing";
import { type PdfNarzutyDisplay, type PdfRow } from "@/lib/pdf-renderer";
import { calcNarzuty } from "@/lib/pricing-calculations";
import { classifyIntent } from "@/lib/services/semantic-classifier";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { PremiumPdfDocument, type PdfEngineData, type ThemeName } from "@/lib/pdf-engine";

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
  { id: "I_PRZYGOT",   roman: "I",   label: "PRACE PRZYGOTOWAWCZE I DEMONTAZ"         },
  { id: "II_TRASY",    roman: "II",  label: "TRASY KABLOWE I OKABLOWANIE"              },
  { id: "III_OSPRZET", roman: "III", label: "OSPRZET ELEKTRYCZNY I OPRAWY"             },
  { id: "IV_ROZDZ",    roman: "IV",  label: "ROZDZIELNICE I ZASILANIE"                 },
  { id: "V_SPEC",      roman: "V",   label: "SYSTEMY SPECJALNE (PV/PPOZ/PRZEMYSL)"     },
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
      showKnrCoeffsInPdf = false,
      blindMode = false,      // v3.0: Kosztorys ślepy — hide all prices
    } = await req.json();

    const pricingParams = {
      vatMode: Number(vatMode),
      priceDisplay: priceDisplay as PriceDisplay,
    };
    const vatMultiplier = getVatMultiplier(priceDisplay as PriceDisplay, Number(vatMode));

    // ─── Fetch data ────────────────────────────────────────────────────────────

    const { data: project } = await supabase
      .from("projects")
      .select("*, regions(*), object_types(*)")
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
      .select("is_pro")
      .eq("id", requestingUser.id)
      .single();

    const isPro = requestingProfile?.is_pro || false;
    const isDemoProject = Boolean((project as Record<string, unknown>).is_demo_project);

    // Rate limiting: 20 PDF exports per minute per user
    const pdfRl = checkRateLimit({ key: `pdf:${requestingUser.id}`, limit: 20, windowMs: 60_000 });
    if (!pdfRl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zbyt wiele żądań PDF. Spróbuj ponownie za chwilę." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((pdfRl.retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    // Demo projects bypass the PRO paywall so free users can see the full PDF value.
    if (!isPro && !isDemoProject) {
      return new NextResponse(
        JSON.stringify({ error: "Eksport PDF wymaga planu PRO. Zupgraduj, aby odblokować eksport." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
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
    // EffectiveUnitPrice: adjustmentMult × regionModifier for AI-priced items, adjustmentMult only for manual
    const modifier = adjustmentOnly * regionModifier;
    // [A1] showRg and showKnrInPdf read directly from project settings (no pricingMode gate)
    const showRg = Boolean(project.show_labor_hours_in_pdf);
    const maskPrices = (!isPro && !isDemoProject) || Boolean(blindMode); // blind mode also masks prices
    const showKnrInPdf = Boolean((project as Record<string, unknown>).show_knr);
    // If materials are provided by the client — hide Material column entirely from PDF
    const matOwnedByClient = Boolean((project as Record<string, unknown>).materials_owned_by_customer);

    const calcItems = items.map(item => {
      const isManualItem = (item as Record<string, unknown>).confidence_level === "manual";
      const isInvestorMat = Boolean((item as Record<string, unknown>).is_investor_material);
      // Iron Rule: regionModifier ONLY on labor — material is sovereign
      // Material: always adjustmentOnly (no regionModifier regardless of manual/AI)
      // Labor: manual → adjustmentOnly; AI → adjustmentOnly × regionModifier
      const labModifier = isManualItem ? adjustmentOnly : modifier;
      return {
        ...item,
        // matOwnedByClient or isInvestorMat: zero out material prices
        finalMat: (matOwnedByClient || isInvestorMat) ? 0 : getPrice(item, "mat") * adjustmentOnly * vatMultiplier,
        finalLab: getPrice(item, "lab") * labModifier * vatMultiplier,
        laborNorm: Number((item as Record<string, unknown>).labor_norm ?? 0),
        isInvestorMat,
      };
    });

    const parentIds = new Set(calcItems.filter(i => i.parent_assembly_id).map(i => i.parent_assembly_id));

    let globalIndex = 1;
    let totalMatSum = 0;
    let totalLabSum = 0;

    const rowsRaw: PdfRow[] = calcItems.map((item) => {
      const isParent = parentIds.has(item.id);
      const isChild = !!item.parent_assembly_id;
      const unitCombined = item.finalMat + item.finalLab;
      let totalVal = unitCombined * item.quantity;
      let matDisplay = maskPrices ? "*** zl" : fMoney(item.finalMat);
      let labDisplay = maskPrices ? "*** zl" : fMoney(item.finalLab);
      const combinedDisplay = maskPrices ? "*** zl" : fMoney(unitCombined);
      let indexDisplay = "";
      let rowType = "single";

      if (isParent) {
        const children = calcItems.filter(c => c.parent_assembly_id === item.id);
        totalVal = children.reduce((acc, c) => acc + (c.finalMat + c.finalLab) * c.quantity, 0);
        matDisplay = "---";
        labDisplay = "---";
        indexDisplay = String(globalIndex++);
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
        indexDisplay = String(globalIndex++);
        totalMatSum += item.finalMat * item.quantity;
        totalLabSum += item.finalLab * item.quantity;
        if (totalVal === 0) rowType = "warning";
      }

      const rawKnrCode = (item as Record<string, unknown>).knr_code as string | null | undefined;
      const knrCode = rawKnrCode ? sanitize(rawKnrCode, true) : "";
      let name = sanitize(item.name as string, true);
      if (rowType === "set_parent") name = `>> ${name}`;
      else if (isChild) {
        if (rowType === "warning") name = `    ${name} (BRAK CENY!)`;
        else if (rowType === "child_mat") name = `    ${name}`;
        else if (rowType === "child_lab") name = `    ${name}`;
        else name = `    ${name}`;
      } else if (rowType === "warning") name = `${name} (BRAK CENY!)`;

      const laborNormDisplay = showRg
        ? (item.laborNorm > 0 ? `${(item.laborNorm * item.quantity).toFixed(3)} rbh` : "—")
        : "";

      return {
        index: indexDisplay, name, knrCode, unit: item.unit as string, qty: item.quantity as number,
        rg: laborNormDisplay, mat: matDisplay, lab: labDisplay, combined: combinedDisplay,
        total: maskPrices ? (isPro && blindMode ? "---" : "*** zl") : fMoney(totalVal), rawTotal: blindMode ? 0 : totalVal, rowType, isParent, isChild,
        isInvestorMat: item.isInvestorMat,
      };
    });

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

    // Step 3: build final rows grouped by semantic section (preserving sort_order within each)
    const rows: PdfRow[] = [];
    for (const secDef of PDF_SECTIONS) {
      const secRawRows = rowsRaw
        .map((row, idx) => ({ row, itemId: calcItems[idx].id as string }))
        .filter(({ itemId }) => semanticSectionMap.get(itemId) === secDef.id);

      if (secRawRows.length === 0) continue;

      const secT   = sectionTotalsMap.get(secDef.id)!;
      const secTot = secT.mat + secT.lab;
      const secItemCount = secRawRows.filter(({ row }) => !row.isChild).length;

      // Section header row
      rows.push({
        index: "",
        name: `${secDef.roman}. ${secDef.label}  (${secItemCount} poz.)`,
        knrCode: "", unit: "", qty: 0,
        rg: "", mat: "", lab: "", combined: "",
        total: maskPrices ? "" : fMoney(secTot),
        rawTotal: secTot,
        rowType: "section_header", isParent: false, isChild: false,
      });

      // Items (in original sort_order)
      for (const { row } of secRawRows) {
        rows.push(row);
      }

      // Section subtotal row
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

    const { totalNet, vatRate, vatAmount, totalGross } = calcPdfTotals(totalMatSum, totalLabSum, pricingParams, narzutyForTotals);
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
      showKnrCoeffsInPdf: Boolean(showKnrCoeffsInPdf),
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
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(PremiumPdfDocument, { data: engineData }) as React.ReactElement<DocumentProps>
    );

    const safeName = (project.name as string).replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `${blindMode && isPro ? 'Kosztorys_Slepy' : 'Kosztorys'}_${safeName}.pdf`;

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
