/**
 * PdfPricingService — centralny serwis obliczeń VAT i formatowania walut dla PDF.
 *
 * Wyodrębniony z app/api/pdf/route.ts (1023 linie) aby:
 * - Izolować logikę podatkową od renderowania PDF
 * - Ułatwić testowanie (czyste funkcje, zero side-effects)
 * - Umożliwić reużycie w pdf-preview/route.ts i innych eksporterach
 *
 * ZASADA: Ten plik nie importuje jsPDF ani Supabase — tylko czysta arytmetyka.
 */

export type PriceDisplay = "netto" | "brutto";

export interface PdfPricingParams {
  vatMode: number;
  priceDisplay: PriceDisplay;
}

export interface PdfPricingTotals {
  totalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
}

// ─── Deterministic rounding ───────────────────────────────────────────────────
// Mirrors hooks/use-global-settings.ts roundPrice() — MUST stay in sync
// to avoid ±0.01 zł drift between client UI and PDF.
export const roundPrice = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// ─── Money formatter ──────────────────────────────────────────────────────────
// Uses 'zl' instead of 'zł' to avoid font encoding issues in jsPDF.
export const fMoney = (val: number): string => {
  const formatted = roundPrice(val).toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zl`;
};

// ─── VAT multiplier ───────────────────────────────────────────────────────────
// brutto mode: prices already include VAT → multiply row prices by (1 + vat%)
// netto mode:  prices are net → no multiplication on rows, add VAT in summary
export const getVatMultiplier = (priceDisplay: PriceDisplay, vatMode: number): number =>
  priceDisplay === "brutto" ? 1 + Number(vatMode) / 100 : 1;

// ─── Summary totals calculation ───────────────────────────────────────────────
// Called once after all rows are summed.
// totalMatSum + totalLabSum already have vatMultiplier applied from row calculation.
// narzutyAmount: pre-computed Narzuty total (already in the same currency as mat/lab).
export const calcPdfTotals = (
  totalMatSum: number,
  totalLabSum: number,
  params: PdfPricingParams,
  narzutyAmount = 0,
): PdfPricingTotals => {
  const totalNet = roundPrice(totalMatSum + totalLabSum + narzutyAmount);
  // VAT line only shown in netto mode (brutto mode: VAT already baked into prices)
  const vatRate = params.priceDisplay === "netto" ? Number(params.vatMode) / 100 : 0;
  const vatAmount = roundPrice(totalNet * vatRate);
  const totalGross =
    params.priceDisplay === "netto" ? roundPrice(totalNet + vatAmount) : totalNet;

  return { totalNet, vatRate, vatAmount, totalGross };
};

// ─── VAT label helpers ────────────────────────────────────────────────────────
export const getNettoLabel = (priceDisplay: PriceDisplay): string =>
  priceDisplay === "brutto" ? "RAZEM BRUTTO:" : "RAZEM NETTO:";

export const getGrossLabel = (): string => "WARTOSC BRUTTO:";

export const getVatLineLabel = (priceDisplay: PriceDisplay, vatMode: number): string =>
  priceDisplay === "netto"
    ? `Kwota VAT (${Number(vatMode).toFixed(0)}%):`
    : `Ceny brutto (VAT ${Number(vatMode)}% w cenie)`;

// ─── Sanitizer ────────────────────────────────────────────────────────────────
// Handles Polish, Cyrillic and special symbols for non-Unicode jsPDF fonts.
const CHAR_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "Zh", З: "Z",
  И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
  С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch",
  Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
  є: "ye", і: "i", ї: "yi", ґ: "g", Є: "Ye", І: "I", Ї: "Yi", Ґ: "G",
  "⚠️": "(!)", "⚠": "(!)",
};

export const sanitize = (text: string | null | undefined, hasFont: boolean): string => {
  if (!text) return "";
  void hasFont; // Always transliterate — pdfmake Roboto subset lacks Polish glyphs
  return String(text)
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻа-яА-ЯёЁєіїґЄІЇҐ⚠️⚠]/g, (m) => CHAR_MAP[m] ?? m)
    .replace(/[\u0100-\uFFFF]/g, ""); // strip all non-Latin-1 (▶ × ² etc.) — jsPDF Latin-1 only
};
