import { logger } from "@/lib/logger";
import jsPDF from "jspdf";
import type { Profile } from "@/lib/types/database";
import { renderUnifiedFooter } from "./pdf-shared-styles";

/**
 * Fetch Roboto font and convert to Base64 for embedding in PDF
 */
export async function getBase64Font(): Promise<string> {
  try {
    const response = await fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
      { cache: "force-cache" }
    );
    if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    logger.error("Failed to fetch Roboto font:", {}, error);
    throw error;
  }
}

const CYRILLIC_PDF_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "Zh", З: "Z",
  И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
  С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch",
  Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
  є: "ye", і: "i", ї: "yi", ґ: "g", Є: "Ye", І: "I", Ї: "Yi", Ґ: "G",
};

const POLISH_PDF_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
};

/**
 * Clean text for PDF rendering — transliterates Polish + Cyrillic, removes emoji and non-printable characters
 */
export function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (m) => POLISH_PDF_MAP[m] ?? m)
    .replace(/[а-яА-ЯёЁєіїґЄІЇҐ]/g, (m) => CYRILLIC_PDF_MAP[m] ?? m)
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[\u2600-\u26FF]/g, "")
    .replace(/[\u2700-\u27BF]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/📦|🔧|👷|↳|⚠|✓/g, "")
    .trim();
}

export function processTextForPDF(text: string): string {
  return cleanText(text);
}

/**
 * Format number to Polish currency: "1 234,56 zl"
 */
export function formatCurrency(amount: number): string {
  const fixed = amount.toFixed(2);
  const [integer, decimal] = fixed.split(".");
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formattedInteger},${decimal} zl`;
}

/**
 * Format quantity with Polish decimal separator
 */
export function formatQuantity(quantity: number): string {
  return quantity.toFixed(2).replace(".", ",");
}

/**
 * Add footer to every page with company info and page numbers.
 * Delegates to renderUnifiedFooter from pdf-shared-styles.
 */
export function addPageFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  profile?: Profile | null
) {
  renderUnifiedFooter(doc, pageWidth, pageHeight, profile, true);
}
