import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { PremiumPdfDocument, type PdfEngineData, type PdfRow } from "@/lib/pdf-engine";
import { classifyIntent } from "@/lib/services/semantic-classifier";

// ─── Hardcoded demo items (matches createDemoProject seed data) ───────────────

interface DemoItem {
  name: string;
  unit: string;
  quantity: number;
  mat: number;
  lab: number;
  rg?: number; // labor norm in rbh per unit (optional)
}

const DEMO_ITEMS: DemoItem[] = [
  { name: "Gniazdo podtynkowe 2P+Z Schuko",             unit: "szt", quantity: 12,  mat: 28,    lab: 35,    rg: 0.42 },
  { name: "Gniazdo podwójne 2P+Z podtynkowe",           unit: "szt", quantity: 8,   mat: 38,    lab: 38,    rg: 0.45 },
  { name: "Gniazdo IP44 łazienka",                       unit: "szt", quantity: 3,   mat: 42,    lab: 40,    rg: 0.50 },
  { name: "Łącznik jednobiegunowy",                      unit: "szt", quantity: 8,   mat: 18,    lab: 28,    rg: 0.35 },
  { name: "Łącznik schodowy",                            unit: "szt", quantity: 4,   mat: 22,    lab: 32,    rg: 0.40 },
  { name: "Oprawa LED downlight 10W",                    unit: "szt", quantity: 16,  mat: 65,    lab: 45,    rg: 0.55 },
  { name: "Oprawa LED natynkowa IP65 9W",                unit: "szt", quantity: 3,   mat: 75,    lab: 50,    rg: 0.60 },
  { name: "Taśma LED 12V z zasilaczem",                  unit: "mb",  quantity: 6,   mat: 35,    lab: 20,    rg: 0.25 },
  { name: "Przewód YDYp 3x1,5mm² instalacja",           unit: "mb",  quantity: 120, mat: 3.80,  lab: 2.20,  rg: 0.028 },
  { name: "Przewód YDYp 3x2,5mm² obwody gniazd",       unit: "mb",  quantity: 180, mat: 5.50,  lab: 2.50,  rg: 0.032 },
  { name: "Puszka podtynkowa ø60mm",                    unit: "szt", quantity: 28,  mat: 2.50,  lab: 8,     rg: 0.10 },
  { name: "Bruzda w tynku gipsowym",                     unit: "mb",  quantity: 85,  mat: 0,     lab: 6.50,  rg: 0.082 },
  { name: "Rozdzielnica mieszkaniowa 2x12 modułów",     unit: "szt", quantity: 1,   mat: 420,   lab: 280,   rg: 3.50 },
  { name: "Wyłącznik nadprądowy B10A 1P",                unit: "szt", quantity: 6,   mat: 28,    lab: 18,    rg: 0.22 },
  { name: "Wyłącznik nadprądowy B16A 1P",                unit: "szt", quantity: 8,   mat: 30,    lab: 18,    rg: 0.22 },
  { name: "Wyłącznik różnicowoprądowy 25A/30mA",        unit: "szt", quantity: 2,   mat: 185,   lab: 45,    rg: 0.55 },
  { name: "Ochronnik przepięć T2 4P",                    unit: "szt", quantity: 1,   mat: 320,   lab: 60,    rg: 0.75 },
  { name: "Obwód kuchenka elektryczna 3x4mm²",          unit: "szt", quantity: 1,   mat: 85,    lab: 120,   rg: 1.50 },
  { name: "Obwód zmywarka 3x2,5mm²",                    unit: "szt", quantity: 1,   mat: 55,    lab: 80,    rg: 1.00 },
  { name: "Wentylator łazienkowy z czujnikiem wilg.",    unit: "szt", quantity: 1,   mat: 145,   lab: 85,    rg: 1.05 },
  { name: "Kabel HDMI natynkowy + gniazdo",              unit: "szt", quantity: 2,   mat: 55,    lab: 40,    rg: 0.50 },
  { name: "Gniazdo RJ45 Cat6 podtynkowe",               unit: "szt", quantity: 4,   mat: 38,    lab: 35,    rg: 0.42 },
  { name: "Montaż rozdzielnicy — robocizna",             unit: "kpl", quantity: 1,   mat: 0,     lab: 450,   rg: 5.60 },
  { name: "Próby i pomiary instalacji",                  unit: "kpl", quantity: 1,   mat: 0,     lab: 380,   rg: 4.80 },
];

// ─── Semantic section IDs (mirrors /api/pdf/route.ts logic) ──────────────────

type PdfSectionId = "I_PRZYGOT" | "II_TRASY" | "III_OSPRZET" | "IV_ROZDZ" | "V_SPEC" | "VI_POMIARY";

const POMIAR_RE = /pomiar|odbior|sprawdzen|protokol|atest|komisj|uziom|rezystancj|szczelno|izolacj.*test/i;

const INTENT_MAP: Record<string, PdfSectionId> = {
  DEMOLITION: "I_PRZYGOT", HARD_CONSTRUCTION: "I_PRZYGOT", DRILLING_HARD: "I_PRZYGOT",
  CABLE_LAYING: "II_TRASY",
  GENERAL: "III_OSPRZET", STANDARD_ACTION: "III_OSPRZET",
  DISTRIBUTION_BOARD: "IV_ROZDZ", HEAVY_CONNECTION: "IV_ROZDZ",
  PV_INSTALLATION: "V_SPEC", INDUSTRIAL_INSTALL: "V_SPEC", FIRE_SAFETY_LINE: "V_SPEC", COMMERCIAL_INSTALL: "V_SPEC",
};

const PDF_SECTIONS = [
  { id: "I_PRZYGOT"   as PdfSectionId, roman: "I",   label: "PRACE PRZYGOTOWAWCZE I DEMONTAŻ"      },
  { id: "II_TRASY"    as PdfSectionId, roman: "II",  label: "TRASY KABLOWE I OKABLOWANIE"            },
  { id: "III_OSPRZET" as PdfSectionId, roman: "III", label: "OSPRZĘT ELEKTRYCZNY I OPRAWY"           },
  { id: "IV_ROZDZ"    as PdfSectionId, roman: "IV",  label: "ROZDZIELNICE I ZASILANIE"               },
  { id: "V_SPEC"      as PdfSectionId, roman: "V",   label: "SYSTEMY SPECJALNE (PV/PPOŻ/PRZEMYSŁ)"  },
  { id: "VI_POMIARY"  as PdfSectionId, roman: "VI",  label: "POMIARY, ODBIORY I URUCHOMIENIE"        },
];

function classifySection(name: string): PdfSectionId {
  if (POMIAR_RE.test(name)) return "VI_POMIARY";
  const { intent } = classifyIntent(name);
  return (INTENT_MAP[intent] ?? "III_OSPRZET") as PdfSectionId;
}

function fMoney(v: number): string {
  return v.toFixed(2).replace(".", ",") + " zł";
}

// ─── Main handler (public — no auth required) ─────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const companyName = String(body.companyName ?? "Twoja Firma").trim() || "Twoja Firma";
    const clientName  = String(body.clientName  ?? "Jan Kowalski").trim() || "Jan Kowalski";

    const VAT_RATE = 8; // residential

    // ─── Build calc items ────────────────────────────────────────────────────
    const calcItems = DEMO_ITEMS.map((item, idx) => ({
      id: String(idx),
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      finalMat: item.mat,
      finalLab: item.lab,
      parent_assembly_id: null,
    }));

    const sectionMap = new Map<string, PdfSectionId>();
    calcItems.forEach(item => { sectionMap.set(item.id, classifySection(item.name)); });

    const sectionTotals = new Map<PdfSectionId, { mat: number; lab: number }>(
      PDF_SECTIONS.map(s => [s.id, { mat: 0, lab: 0 }])
    );
    calcItems.forEach(item => {
      const sec = sectionMap.get(item.id) ?? "III_OSPRZET";
      const st = sectionTotals.get(sec)!;
      st.mat += item.finalMat * item.quantity;
      st.lab += item.finalLab * item.quantity;
    });

    let globalIndex = 1;
    let totalMatSum = 0;
    let totalLabSum = 0;

    // Build flat rows per item (no assembly children in demo)
    const rawRows = new Map<string, PdfRow>();
    calcItems.forEach((item, idx) => {
      const matVal = item.finalMat * item.quantity;
      const labVal = item.finalLab * item.quantity;
      const totalVal = matVal + labVal;
      totalMatSum += item.finalMat * item.quantity;
      totalLabSum += item.finalLab * item.quantity;

      const demItem = DEMO_ITEMS[idx];
      const rgTotal = demItem?.rg ? (demItem.rg * item.quantity).toFixed(3) + " rbh" : "";
      const rowType = totalVal === 0 ? "warning" : "single";
      rawRows.set(item.id, {
        index: String(globalIndex++),
        name: item.finalMat === 0 && item.finalLab === 0 ? `${item.name} (BRAK CENY!)` : item.name,
        knrCode: "", unit: item.unit, qty: item.quantity,
        rg: rgTotal,
        mat: fMoney(item.finalMat),
        lab: fMoney(item.finalLab),
        combined: fMoney(item.finalMat + item.finalLab),
        total: fMoney(totalVal),
        rawTotal: totalVal,
        rowType,
        isParent: false,
        isChild: false,
      });
    });

    // ─── Assemble grouped rows ────────────────────────────────────────────────
    const rows: PdfRow[] = [];
    for (const sec of PDF_SECTIONS) {
      const secItems = calcItems.filter(i => sectionMap.get(i.id) === sec.id);
      if (secItems.length === 0) continue;

      const secT = sectionTotals.get(sec.id)!;
      const secTot = secT.mat + secT.lab;

      rows.push({
        index: "", name: `${sec.roman}. ${sec.label}  (${secItems.length} poz.)`,
        knrCode: "", unit: "", qty: 0, rg: "", mat: "", lab: "", combined: "",
        total: fMoney(secTot), rawTotal: secTot,
        rowType: "section_header", isParent: false, isChild: false,
      });

      secItems.forEach(item => { rows.push(rawRows.get(item.id)!); });

      rows.push({
        index: "", name: `Suma sekcji: Material ${fMoney(secT.mat)} PLN | Robocizna ${fMoney(secT.lab)} PLN`,
        knrCode: "", unit: "", qty: 0, rg: "",
        mat: fMoney(secT.mat), lab: fMoney(secT.lab), combined: "",
        total: fMoney(secTot), rawTotal: secTot,
        rowType: "section_subtotal", isParent: false, isChild: false,
      });
    }

    // ─── Totals ───────────────────────────────────────────────────────────────
    const totalNet   = totalMatSum + totalLabSum;
    const vatAmount  = Math.round(totalNet * VAT_RATE) / 100;
    const totalGross = totalNet + vatAmount;

    // ─── Assemble engine data ─────────────────────────────────────────────────
    const engineData: PdfEngineData = {
      theme: "klasyczny",
      profile: {
        company_name: companyName || "Twoja Firma Elektryczna Sp. z o.o.",
        nip: "123-456-78-90",
        regon: "123456789",
        street: "ul. Instalatorska 12",
        city: "Warszawa",
        postal_code: "00-001",
        phone: "+48 123 456 789",
        email: "biuro@elektrykpro.pl",
      },
      project: {
        id: "demo",
        name: "Mieszkanie 3-pokojowe 65m² (Demo)",
        client_name: clientName || "Jan Kowalski",
        client_address: "ul. Przykładowa 1, 00-001 Warszawa",
        client_nip: null,
        vat_rate: VAT_RATE,
        regions: { name: "Mazowieckie", price_modifier: 1.0 },
        object_types: { name: "Mieszkanie" },
      },
      rows,
      logoBase64: null,
      maskPrices: false,
      blindMode: false,
      showRg: true,
      showKnr: false,
      matOwnedByClient: false,
      totalMatSum,
      totalLabSum,
      totalLaborHours: DEMO_ITEMS.reduce((sum, it) => sum + (it.rg ?? 0) * it.quantity, 0),
      totalNet,
      vatRate: VAT_RATE,
      vatAmount,
      totalGross,
      pdfNarzuty: undefined,
      priceDisplay: "netto",
      notes: "⭐ PROJEKT POKAZOWY — ElektroSmart PRO. Pełny kosztorys z rzeczywistymi cenami dla instalacji elektrycznej mieszkania 65m². Wygenerowano przez ElektroSmart PRO — system kosztorysowania dla elektrykw.",
      pdfStructure: {
        showCoverPage: false,
        showCompanyHeader: true,
        showProjectMeta: true,
        showSectionGroups: true,
        showSummaryBlock: true,
        showLegend: true,
      },
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(PremiumPdfDocument, { data: engineData }) as React.ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ElektroSmart_Demo_Kosztorys.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Demo PDF error:", e);
    return new NextResponse(JSON.stringify({ error: "Błąd generowania PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
