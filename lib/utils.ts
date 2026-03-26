import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes Polish text by removing diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
 * This allows users to search using standard ASCII characters.
 * 
 * BRUTE-FORCE METHOD: Direct character replacement for maximum compatibility.
 * 
 * Examples:
 * - "Puszka pożarowa" → "puszka pozarowa"
 * - "Łącznik" → "lacznik"
 * - "Ręczny" → "reczny"
 * - "Gniazdo" → "gniazdo"
 * 
 * @param text - The text to normalize
 * @returns Normalized text in lowercase without Polish diacritics
 */
export function normalizePolish(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    // Handle uppercase variants as well
    .replace(/Ą/g, 'a')
    .replace(/Ć/g, 'c')
    .replace(/Ę/g, 'e')
    .replace(/Ł/g, 'l')
    .replace(/Ń/g, 'n')
    .replace(/Ó/g, 'o')
    .replace(/Ś/g, 's')
    .replace(/Ź/g, 'z')
    .replace(/Ż/g, 'z');
}

/**
 * Smart search comparator for sorting results by relevance.
 * 
 * Priority:
 * 1. Exact match (highest priority)
 * 2. Starts with query
 * 3. Contains query (fallback to alphabetical)
 * 
 * Example:
 * Query: "kab"
 * Results: ["Kabel", "Uchwyt kablowy", "Skrzynka"] 
 * Sorted: ["Kabel", "Uchwyt kablowy", "Skrzynka"]
 * 
 * @param query - Search query (normalized)
 * @param textA - First item text (normalized)
 * @param textB - Second item text (normalized)
 * @returns Sort order (-1, 0, 1)
 */
export function searchComparator(query: string, textA: string, textB: string): number {
  const input = query.toLowerCase();
  const a = textA.toLowerCase();
  const b = textB.toLowerCase();

  // 1. Exact match
  const aExact = a === input;
  const bExact = b === input;
  if (aExact && !bExact) return -1;
  if (!aExact && bExact) return 1;

  // 2. Name starts with query ("Puszka..." beats "Gniazdo wpuszczane...")
  const aStarts = a.startsWith(input);
  const bStarts = b.startsWith(input);
  if (aStarts && !bStarts) return -1;
  if (!aStarts && bStarts) return 1;

  // 3. Any word in name starts with query ("Skrzynka puszka" before "wpuszczany")
  const wordStarts = (text: string) => text.split(/\s+/).some(w => w.startsWith(input));
  const aWord = wordStarts(a);
  const bWord = wordStarts(b);
  if (aWord && !bWord) return -1;
  if (!aWord && bWord) return 1;

  // 4. Fallback to alphabetical sort
  return a.localeCompare(b, 'pl');
}