import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  fMoney,
  sanitize,
  getVatMultiplier,
  calcPdfTotals,
  type PriceDisplay,
} from "@/lib/pdf-pricing";
import {
  renderPdfHeader,
  renderPdfSummary,
  renderPdfFooter,
  buildTableConfig,
  type TemplatePalette,
  type PdfRow,
  type PdfNarzutyDisplay,
} from "@/lib/pdf-renderer";
import { calcNarzuty } from "@/lib/pricing-calculations";
import { classifyIntent } from "@/lib/services/semantic-classifier";

// ─── Font & Image utilities ───────────────────────────────────────────────────

const ROBOTO_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto";

async function loadFonts(doc: jsPDF): Promise<boolean> {
  try {
    const variants: Array<[string, string, string]> = [
      ["Roboto-Regular.ttf",   "Roboto", "normal"],
      ["Roboto-Bold.ttf",      "Roboto", "bold"],
      ["Roboto-Italic.ttf",    "Roboto", "italic"],
      ["Roboto-Medium.ttf",    "Roboto", "bolditalic"],
    ];
    await Promise.all(
      variants.map(async ([file, family, style]) => {
        const res = await fetch(`${ROBOTO_CDN}/${file}`, { cache: "force-cache" });
        if (!res.ok) throw new Error(`Font fetch failed: ${file}`);
        const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
        doc.addFileToVFS(file, b64);
        doc.addFont(file, family, style);
      })
    );
    doc.setFont("Roboto");
    return true;
  } catch (e) {
    logger.error("Font error:", {}, e);
    doc.setFont("helvetica");
    return false;
  }
}

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

// ─── Template palettes ────────────────────────────────────────────────────────

const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  klasyczny: {
    primary: [37, 99, 235], primaryLight: [219, 234, 254], summaryBg: [240, 249, 255],
    summaryBorder: [186, 230, 253], accentSet: [234, 88, 12], accentSingle: [37, 99, 235],
    accentMat: [202, 138, 4], accentLab: [5, 150, 105], accentRg: [14, 116, 144], totalCol: [37, 99, 235],
  },
  elegancki: {
    primary: [30, 41, 59], primaryLight: [241, 245, 249], summaryBg: [255, 251, 235],
    summaryBorder: [196, 170, 105], accentSet: [191, 155, 48], accentSingle: [51, 100, 164],
    accentMat: [144, 12, 63], accentLab: [22, 120, 70], accentRg: [14, 116, 144], totalCol: [30, 41, 59],
  },
  nowoczesny: {
    primary: [13, 148, 136], primaryLight: [204, 251, 241], summaryBg: [240, 253, 250],
    summaryBorder: [153, 246, 228], accentSet: [239, 68, 68], accentSingle: [13, 148, 136],
    accentMat: [79, 70, 229], accentLab: [101, 163, 13], accentRg: [14, 116, 144], totalCol: [13, 148, 136],
  },
  korporacyjny: {
    primary: [55, 65, 81], primaryLight: [243, 244, 246], summaryBg: [254, 242, 242],
    summaryBorder: [252, 165, 165], accentSet: [220, 38, 38], accentSingle: [100, 116, 139],
    accentMat: [180, 83, 9], accentLab: [17, 94, 89], accentRg: [14, 116, 144], totalCol: [55, 65, 81],
  },
  premium: {
    primary: [109, 40, 217], primaryLight: [237, 233, 254], summaryBg: [245, 243, 255],
    summaryBorder: [196, 181, 253], accentSet: [219, 39, 119], accentSingle: [124, 58, 237],
    accentMat: [5, 150, 105], accentLab: [67, 56, 202], accentRg: [14, 116, 144], totalCol: [109, 40, 217],
  },
};

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
    // PDF always uses template colors — visual style is controlled by template picker, not a toggle
    const showColors = true;

    const pricingParams = {
      vatMode: Number(vatMode),
      priceDisplay: priceDisplay as PriceDisplay,
    };
    const vatMultiplier = getVatMultiplier(priceDisplay as PriceDisplay, Number(vatMode));
    const TPL = TEMPLATE_PALETTES[template] || TEMPLATE_PALETTES.klasyczny;

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

    // Rate limiting: 20 PDF exports per minute per user
    const pdfRl = checkRateLimit({ key: `pdf:${requestingUser.id}`, limit: 20, windowMs: 60_000 });
    if (!pdfRl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zbyt wiele żądań PDF. Spróbuj ponownie za chwilę." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((pdfRl.retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    if (!isPro) {
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
    const maskPrices = !isPro || Boolean(blindMode); // blind mode also masks prices
    const showKnrInPdf = Boolean((project as Record<string, unknown>).show_knr);
    // If materials are provided by the client — hide Material column entirely from PDF
    const matOwnedByClient = Boolean((project as Record<string, unknown>).materials_owned_by_customer);

    const calcItems = items.map(item => {
      const isManualItem = (item as Record<string, unknown>).confidence_level === "manual";
      // Iron Rule: regionModifier ONLY on labor — material is sovereign
      // Material: always adjustmentOnly (no regionModifier regardless of manual/AI)
      // Labor: manual → adjustmentOnly; AI → adjustmentOnly × regionModifier
      const labModifier = isManualItem ? adjustmentOnly : modifier;
      return {
        ...item,
        // matOwnedByClient: zero out material prices so they don't appear in totals
        finalMat: matOwnedByClient ? 0 : getPrice(item, "mat") * adjustmentOnly * vatMultiplier,
        finalLab: getPrice(item, "lab") * labModifier * vatMultiplier,
        laborNorm: Number((item as Record<string, unknown>).labor_norm ?? 0),
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
        total: maskPrices ? (isPro && blindMode ? "---" : "*** zl") : fMoney(totalVal),
        rawTotal: blindMode ? 0 : totalVal, rowType, isParent, isChild,
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

    const doc = new jsPDF();
    const hasFont = await loadFonts(doc);
    const logoBase64 = profile?.logo_url ? await fetchImage(profile.logo_url) : null;

    const { headerEndY } = renderPdfHeader(doc, hasFont, showColors, TPL, profile, project, logoBase64, template);

    // ─── Blind mode banner ────────────────────────────────────────────────────
    let blindBannerOffset = 0;
    if (blindMode && isPro) {
      const bw = doc.internal.pageSize.getWidth();
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(14, headerEndY, bw - 28, 9, 2, 2, "F");
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, headerEndY, bw - 28, 9, 2, 2, "S");
      doc.setFontSize(9);
      doc.setFont(hasFont ? "Roboto" : "helvetica", "bold");
      doc.setTextColor(120, 53, 15);
      doc.text(sanitize("KOSZTORYS SLEPY — CENY POUFNE (oferta dla inwestora bez cen jednostkowych)", hasFont), bw / 2, headerEndY + 5.8, { align: "center" });
      blindBannerOffset = 13;
    }

    // ─── Executive Summary (page 1: after header) ─────────────────────────────
    const execRows: (string | number)[][] = [];
    for (const sec of PDF_SECTIONS) {
      const st = sectionTotalsMap.get(sec.id)!;
      if (st.mat + st.lab === 0) continue;
      execRows.push([
        `${sec.roman}.`,
        sanitize(sec.label, hasFont),
        maskPrices ? "\u2014" : fMoney(st.mat),
        maskPrices ? "\u2014" : fMoney(st.lab),
        maskPrices ? "\u2014" : fMoney(st.mat + st.lab),
      ]);
    }
    execRows.push([
      "",
      sanitize("RAZEM WSZYSTKIE SEKCJE", hasFont),
      maskPrices ? "\u2014" : fMoney(totalMatSum),
      maskPrices ? "\u2014" : fMoney(totalLabSum),
      maskPrices ? "\u2014" : fMoney(totalMatSum + totalLabSum),
    ]);

    (doc as unknown as { autoTable(options: Record<string, unknown>): void }).autoTable({
      startY: headerEndY + blindBannerOffset,
      head: [[
        "Lp.",
        sanitize("Zakres prac", hasFont),
        sanitize("Material (netto)", hasFont),
        sanitize("Robocizna (netto)", hasFont),
        sanitize("Suma (netto)", hasFont),
      ]],
      body: execRows,
      theme: "plain",
      styles: {
        fontSize: 9, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
        font: hasFont ? "Roboto" : "helvetica", textColor: [40, 40, 40],
        lineColor: [229, 231, 235], lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [TPL.primary[0], TPL.primary[1], TPL.primary[2]],
        textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" as const },
        1: { cellWidth: "auto" },
        2: { cellWidth: 33, halign: "right" as const },
        3: { cellWidth: 33, halign: "right" as const },
        4: { cellWidth: 33, halign: "right" as const, fontStyle: "bold" as const },
      },
      didParseCell: (data: { row: { index: number }; column: { index: number }; cell: { styles: Record<string, unknown> } }) => {
        if (data.row.index === execRows.length - 1) {
          data.cell.styles.fillColor = [TPL.primaryLight[0], TPL.primaryLight[1], TPL.primaryLight[2]];
          data.cell.styles.fontStyle = "bold";
          if (data.column.index === 4) {
            data.cell.styles.textColor = [TPL.totalCol[0], TPL.totalCol[1], TPL.totalCol[2]];
            data.cell.styles.fontSize = 10;
          }
        }
      },
    });

    // New page for the detailed items table
    doc.addPage();
    const mainTableStartY = 15;

    // ─── Table ────────────────────────────────────────────────────────────────

    const { tableHead, tableBody, colStyles, totalColIdx } = buildTableConfig(rows, hasFont, showRg, matOwnedByClient, showKnrInPdf);

    // Per-template table layout: font size, cell padding, border weight
    const TPL_CONFIG: Record<string, { fs: number; padV: number; hPadV: number; lw: number }> = {
      klasyczny:    { fs: 9,   padV: 4,   hPadV: 5,   lw: 0.15 },
      elegancki:    { fs: 8.5, padV: 4.5, hPadV: 5.5, lw: 0    },
      nowoczesny:   { fs: 8,   padV: 2.5, hPadV: 4,   lw: 0    },
      korporacyjny: { fs: 9,   padV: 3.5, hPadV: 4.5, lw: 0.25 },
      premium:      { fs: 9.5, padV: 5.5, hPadV: 6,   lw: 0    },
    };
    const TC = TPL_CONFIG[template] ?? TPL_CONFIG.klasyczny;

    (doc as unknown as { autoTable(options: Record<string, unknown>): void }).autoTable({
      startY: mainTableStartY,
      head: [tableHead],
      body: tableBody,
      theme: "plain",
      styles: {
        fontSize: TC.fs, cellPadding: { top: TC.padV, bottom: TC.padV, left: 3, right: 3 },
        lineColor: [229, 231, 235], lineWidth: TC.lw,
        font: hasFont ? "Roboto" : "helvetica", textColor: [40, 40, 40], valign: "middle",
      },
      headStyles: {
        fillColor: [TPL.primary[0], TPL.primary[1], TPL.primary[2]],
        textColor: [255, 255, 255], fontStyle: "bold", fontSize: Math.max(TC.fs - 0.5, 8),
        cellPadding: { top: TC.hPadV, bottom: TC.hPadV, left: 3, right: 3 },
      },
      columnStyles: colStyles,
      didParseCell: (data: { row: { index: number }; column: { index: number }; section: string; cell: { styles: Record<string, unknown> } }) => {
        // Header: inherit halign from column style so each header aligns with its column content
        if (data.section === "head") {
          const cs = colStyles[data.column.index] as Record<string, unknown> | undefined;
          if (cs?.halign) data.cell.styles.halign = cs.halign;
          return;
        }
        const r = rows[data.row.index];
        if (!r || data.section !== "body") return;
        if (r.rowType === "section_header") {
          if (template === "elegancki") {
            // Cream bg, italic navy text, gold total
            data.cell.styles.fillColor = [252, 251, 248];
            data.cell.styles.fontSize = 8.5;
            if (data.column.index === 1) {
              data.cell.styles.fontStyle = "italic";
              data.cell.styles.textColor = [TPL.primary[0], TPL.primary[1], TPL.primary[2]];
            } else if (data.column.index === totalColIdx) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]];
            } else {
              (data.cell as Record<string, unknown>).text = [""];
              data.cell.styles.textColor = [252, 251, 248];
            }
          } else if (template === "nowoczesny") {
            // Light teal bg, bold teal text, no white-on-dark
            data.cell.styles.fillColor = [236, 253, 248];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fontSize = TC.fs;
            if (data.column.index === 1 || data.column.index === totalColIdx) {
              data.cell.styles.textColor = [TPL.primary[0], TPL.primary[1], TPL.primary[2]];
            } else {
              (data.cell as Record<string, unknown>).text = [""];
              data.cell.styles.textColor = [236, 253, 248];
            }
          } else {
            // klasyczny, korporacyjny, premium: solid color band
            const secTotal: [number,number,number] =
              template === "korporacyjny" ? [252, 180, 180]
              : template === "premium"    ? [220, 205, 255]
              : [251, 191, 36];
            data.cell.styles.fillColor = [TPL.primary[0], TPL.primary[1], TPL.primary[2]];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fontSize = 8.5;
            data.cell.styles.textColor = [255, 255, 255];
            if (data.column.index !== 1 && data.column.index !== totalColIdx) {
              (data.cell as Record<string, unknown>).text = [""];
            }
            if (data.column.index === totalColIdx) {
              data.cell.styles.textColor = secTotal;
            }
          }
          return;
        }
        if (r.rowType === "set_parent") {
          data.cell.styles.fillColor = [255, 243, 205];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = TC.fs;
          data.cell.styles.textColor = [120, 53, 15];
        } else if (r.rowType === "child_mat") {
          data.cell.styles.fillColor = [255, 252, 232];
          if (data.column.index === 1) {
            data.cell.styles.textColor = [120, 80, 20]; data.cell.styles.fontStyle = "italic";
            data.cell.styles.fontSize = Math.max(TC.fs - 0.5, 7.5);
          } else { data.cell.styles.textColor = [60, 40, 10]; }
        } else if (r.rowType === "child_lab") {
          data.cell.styles.fillColor = [240, 253, 244];
          if (data.column.index === 1) {
            data.cell.styles.textColor = [20, 100, 60]; data.cell.styles.fontStyle = "italic";
            data.cell.styles.fontSize = Math.max(TC.fs - 0.5, 7.5);
          } else { data.cell.styles.textColor = [15, 60, 35]; }
        } else if (r.rowType === "single") {
          const oddC: [number,number,number] = template === "elegancki"    ? [255, 253, 244]
            : template === "nowoczesny"   ? [240, 253, 250]
            : template === "premium"      ? [250, 247, 255]
            : template === "korporacyjny" ? [250, 249, 249]
            : [248, 250, 252];
          data.cell.styles.fillColor = data.row.index % 2 === 0 ? [255, 255, 255] : oddC;
          data.cell.styles.textColor = [40, 40, 40];
        } else if (r.rowType === "warning") {
          data.cell.styles.fillColor = [254, 242, 242]; data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (r.rowType === "section_subtotal") {
          data.cell.styles.fillColor = [244, 244, 245];
          data.cell.styles.textColor = [70, 70, 80];
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.fontSize = Math.max(TC.fs - 0.5, 7.5);
          if (data.column.index === totalColIdx) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [50, 50, 60];
          }
          // Clear qty/unit/rg columns
          if (data.column.index >= 2 && data.column.index < totalColIdx - 2) {
            (data.cell as Record<string, unknown>).text = [""];
          }
          return;
        }
        // Total column: always bold + template accent
        if (data.column.index === totalColIdx && r.rowType !== "section_header" && r.rowType !== "section_subtotal") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = TPL.totalCol;
        }
      },
      didDrawCell: (data: { doc: jsPDF; row: { index: number }; column: { index: number }; section: string; cell: { x: number; y: number; width: number; height: number } }) => {
        const { x, y, width, height } = data.cell;
        if (data.section === "head") {
          doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
          doc.line(x, y + height, x + width, y + height); return;
        }
        const r = rows[data.row.index];
        if (!r || data.section !== "body") return;

        if (TC.lw === 0) {
          // No-grid templates: subtle horizontal bottom line per cell
          const lc: [number,number,number] = template === "elegancki" ? [228, 215, 175] : [229, 231, 235];
          doc.setDrawColor(lc[0], lc[1], lc[2]); doc.setLineWidth(0.1);
          doc.line(x, y + height, x + width, y + height);
        } else {
          // Grid templates: vertical column separator
          doc.setDrawColor(229, 231, 235); doc.setLineWidth(TC.lw);
          doc.line(x + width, y, x + width, y + height);
        }

        // set_parent: thick colored left bar (col 0)
        if (r.rowType === "set_parent" && data.column.index === 0) {
          const c = TPL.accentSet as [number, number, number];
          doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(3);
          doc.line(x, y + 0.5, x, y + height - 0.5);
        }

        // Left accent bars for children, singles, section (col 0)
        if (data.column.index === 0) {
          let barColor: [number,number,number] | null = null;
          let barW = 1;
          if (r.rowType === "child_mat") barColor = TPL.accentMat as [number,number,number];
          else if (r.rowType === "child_lab") barColor = TPL.accentLab as [number,number,number];
          else if (r.rowType === "single") barColor = TPL.accentSingle as [number,number,number];
          else if (r.rowType === "warning") barColor = [239, 68, 68];
          else if (r.rowType === "section_header" && template === "nowoczesny") {
            barColor = [TPL.primary[0], TPL.primary[1], TPL.primary[2]]; barW = 4;
          }
          if (barColor) {
            doc.setLineWidth(barW); doc.setDrawColor(barColor[0], barColor[1], barColor[2]);
            doc.line(x, y, x, y + height);
          }
        }

        // elegancki section_header: gold bottom accent
        if (template === "elegancki" && r.rowType === "section_header") {
          doc.setDrawColor(TPL.accentSet[0], TPL.accentSet[1], TPL.accentSet[2]);
          doc.setLineWidth(0.6);
          doc.line(x, y + height, x + width, y + height);
        }

        // Last child in set: thick separator line
        if ((r.rowType === "child_mat" || r.rowType === "child_lab") && data.column.index === 0) {
          const nextRow = rows[data.row.index + 1];
          if (!nextRow || !nextRow.isChild) {
            doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.5);
            doc.line(x, y + height, x + width + 182, y + height);
          }
        }
      },
    });

    // ─── Summary & Footer ─────────────────────────────────────────────────────

    let startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    // Dynamic threshold: BRUTTO line is at startY + 28 + summaryOffset + korekOffset + narzutyHeight
    // Must fit within Y=285 (leaves gap before footer at Y=289)
    const pricingOverrides = (project as Record<string, unknown>).pricing_overrides as {
      coeff_height?: boolean | null;
      coeff_difficulty?: boolean | null;
      coeff_surface?: boolean | null;
    } | null | undefined;

    const narzutyLineCount = pdfNarzuty
      ? (pdfNarzuty.kpAmount > 0 ? 1 : 0) + (pdfNarzuty.zAmount > 0 ? 1 : 0) + (pdfNarzuty.kzAmount > 0 ? 1 : 0)
      : 0;
    const knrCoeffsLineCount = showKnrCoeffsInPdf && pricingOverrides
      ? (pricingOverrides.coeff_height ? 1 : 0) + (pricingOverrides.coeff_difficulty ? 1 : 0) + (pricingOverrides.coeff_surface ? 1 : 0)
      : 0;
    const summarySpaceNeeded = 78 + (Number(priceModifier) !== 0 ? 6 : 0) + (narzutyLineCount * 5) + (knrCoeffsLineCount > 0 ? 5 + knrCoeffsLineCount * 4.5 : 0);
    if (startY + summarySpaceNeeded > 270) { doc.addPage(); startY = 20; }

    if (!blindMode || !isPro) {
      renderPdfSummary(
        doc, hasFont, showColors, showRg, maskPrices, TPL,
        startY, totalMatSum, totalLabSum, totalLaborHours,
        totalNet, vatAmount, totalGross,
        priceDisplay as PriceDisplay, Number(vatMode),
        notes,
        Number(priceModifier),
        pdfNarzuty,
        template,
        Boolean(showKnrCoeffsInPdf),
        pricingOverrides ?? undefined,
      );
    } else {
      // Blind mode: show only note footer (no financial totals)
      const bw = doc.internal.pageSize.getWidth();
      doc.setFontSize(8);
      doc.setFont(hasFont ? "Roboto" : "helvetica", "normal");
      doc.setTextColor(120, 53, 15);
      doc.text(sanitize("Niniejszy kosztorys nie zawiera cen. Pelna wersja dostepna po podpisaniu NDA.", hasFont), bw / 2, startY + 6, { align: "center" });
      if (notes) {
        doc.setTextColor(71, 85, 105);
        doc.text(sanitize(notes, hasFont), 15, startY + 13, { maxWidth: bw - 30 });
      }
    }

    const footerNote = sanitize("Kalkulacja sporzadzona wg norm ES-KNR 2026", hasFont);
    renderPdfFooter(doc, hasFont, isPro, footerNote, TPL, showColors, template);

    return new NextResponse(doc.output("arraybuffer"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${blindMode && isPro ? "Kosztorys_Slepy" : "Kosztorys"}_${sanitize(project.name, hasFont)}.pdf"`,
      },
    });
  } catch (e) {
    logger.error("PDF Generation Error:", {}, e);
    return new NextResponse("Error", { status: 500 });
  }
}
