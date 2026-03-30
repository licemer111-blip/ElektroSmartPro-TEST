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
}

const DEMO_ITEMS: DemoItem[] = [
  { name: "Punkt elektryczny gniazdo 230V",            unit: "pkt", quantity: 32,  mat: 28,   lab: 38   },
  { name: "Punkt elektryczny oświetlenie",              unit: "pkt", quantity: 24,  mat: 18,   lab: 32   },
  { name: "Przewód YDYp 3x2.5mm²",                     unit: "mb",  quantity: 180, mat: 4.80, lab: 2.20 },
  { name: "Przewód YDYp 3x1.5mm²",                     unit: "mb",  quantity: 120, mat: 3.20, lab: 1.80 },
  { name: "Przewód YDYp 5x2.5mm²",                     unit: "mb",  quantity: 40,  mat: 7.50, lab: 2.80 },
  { name: "Rozdzielnica natynkowa 24-modułowa",         unit: "szt", quantity: 1,   mat: 180,  lab: 240  },
  { name: "Wyłącznik nadprądowy B16A 1P",               unit: "szt", quantity: 8,   mat: 18,   lab: 12   },
  { name: "Wyłącznik nadprądowy B10A 1P",               unit: "szt", quantity: 6,   mat: 16,   lab: 12   },
  { name: "Wyłącznik różnicowoprądowy 40A/30mA 4P",    unit: "szt", quantity: 1,   mat: 280,  lab: 60   },
  { name: "Puszka instalacyjna podtynkowa 60mm",        unit: "szt", quantity: 56,  mat: 2.50, lab: 4.50 },
  { name: "Gniazdo podwójne 230V z uziemieniem",        unit: "szt", quantity: 32,  mat: 14,   lab: 0    },
  { name: "Łącznik jednobiegunowy",                     unit: "szt", quantity: 12,  mat: 12,   lab: 0    },
  { name: "Oprawa LED sufitowa podtynkowa",             unit: "szt", quantity: 24,  mat: 45,   lab: 22   },
  { name: "Bruzda w ścianie ceglanej",                  unit: "mb",  quantity: 180, mat: 0,    lab: 8.50 },
  { name: "Przebicie przez ścianę/strop",               unit: "szt", quantity: 14,  mat: 0,    lab: 35   },
  { name: "Uziom otokowy poziomy",                      unit: "mb",  quantity: 40,  mat: 12,   lab: 15   },
  { name: "Tablica licznikowa z licznikiem 3-fazowym",  unit: "kpl", quantity: 1,   mat: 420,  lab: 180  },
  { name: "Pomiary i odbiór instalacji elektrycznej",   unit: "kpl", quantity: 1,   mat: 0,    lab: 450  },
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
  { id: "I_PRZYGOT"   as PdfSectionId, roman: "I",   label: "PRACE PRZYGOTOWAWCZE I DEMONTAŻ"       },
  { id: "II_TRASY"    as PdfSectionId, roman: "II",  label: "TRASY KABLOWE I OKABLOWANIE"            },
  { id: "III_OSPRZET" as PdfSectionId, roman: "III", label: "OSPRZĘT ELEKTRYCZNY I OPRAWY"           },
  { id: "IV_ROZDZ"    as PdfSectionId, roman: "IV",  label: "ROZDZIELNICE I ZASILANIE"               },
  { id: "V_SPEC"      as PdfSectionId, roman: "V",   label: "SYSTEMY SPECJALNE (PV/PPOŻ/PRZEMYSŁ)"   },
  { id: "VI_POMIARY"  as PdfSectionId, roman: "VI",  label: "POMIARY, ODBIORY I URUCHOMIENIE"        },
];

function classifySection(name: string): PdfSectionId {
  if (POMIAR_RE.test(name)) return "VI_POMIARY";
  const { intent } = classifyIntent(name);
  return (INTENT_MAP[intent] ?? "III_OSPRZET") as PdfSectionId;
}

function fMoney(v: number): string {
  return v.toFixed(2).replace(".", ",") + " zl";
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
    calcItems.forEach(item => {
      const matVal = item.finalMat * item.quantity;
      const labVal = item.finalLab * item.quantity;
      const totalVal = matVal + labVal;
      totalMatSum += item.finalMat * item.quantity;
      totalLabSum += item.finalLab * item.quantity;

      const rowType = totalVal === 0 ? "warning" : "single";
      rawRows.set(item.id, {
        index: String(globalIndex++),
        name: item.finalMat === 0 && item.finalLab === 0 ? `${item.name} (BRAK CENY!)` : item.name,
        knrCode: "", unit: item.unit, qty: item.quantity,
        rg: "",
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
      theme: "nowoczesny",
      profile: {
        company_name: companyName,
      },
      project: {
        id: "demo",
        name: "Instalacja Elektryczna — Dom 150m²",
        client_name: clientName,
        client_address: "ul. Przykładowa 12, 00-001 Warszawa",
        client_nip: null,
        vat_rate: VAT_RATE,
        regions: { name: "Mazowieckie", price_modifier: 1.0 },
        object_types: { name: "Budynek mieszkalny" },
      },
      rows,
      logoBase64: null,
      maskPrices: false,
      blindMode: false,
      showRg: false,
      showKnr: false,
      showKnrCoeffsInPdf: false,
      matOwnedByClient: false,
      totalMatSum,
      totalLabSum,
      totalLaborHours: 0,
      totalNet,
      vatRate: VAT_RATE,
      vatAmount,
      totalGross,
      pdfNarzuty: undefined,
      priceDisplay: "netto",
      notes: "⭐ PROJEKT POKAZOWY — ElektroSmart PRO. Pełny kosztorys z rzeczywistymi cenami dla instalacji elektrycznej domu jednorodzinnego 150m².",
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
