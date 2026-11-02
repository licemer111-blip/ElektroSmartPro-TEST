import { findCanonicalL0 } from "@/lib/services/canonical-knr-l0";

/**
 * First-day kits. Hours come from the ES norm. Material zł stays 0:
 * the electrician prices cable and devices from their own list.
 * Cable and chase quantities are 1 m so the length is set on the estimate.
 */
export interface StarterLine {
  name: string;
  unit: "szt" | "mb";
  quantity: number;
}

export interface StarterKit {
  name: string;
  description: string;
  lines: StarterLine[];
}

const NOTE =
  "Godziny normy ES × Twoja stawka. Materiału tu nie ma — dopiszesz go ze swojego cennika. Metry kabla i bruzdy zmienisz w kosztorysie.";

export const STARTER_KITS: readonly StarterKit[] = [
  {
    name: "Punkt gniazda pojedynczego",
    description: NOTE,
    lines: [
      { name: "Gniazdo p/t pojedyncze", unit: "szt", quantity: 1 },
      { name: "Puszka p/t fi 60", unit: "szt", quantity: 1 },
      { name: "YDYp 3x2,5", unit: "mb", quantity: 1 },
      { name: "Bruzdowanie w cegle", unit: "mb", quantity: 1 },
    ],
  },
  {
    name: "Punkt łącznika pojedynczego",
    description: NOTE,
    lines: [
      { name: "Łącznik pojedynczy", unit: "szt", quantity: 1 },
      { name: "Puszka p/t fi 60", unit: "szt", quantity: 1 },
      { name: "YDYp 3x1,5", unit: "mb", quantity: 1 },
      { name: "Bruzdowanie w cegle", unit: "mb", quantity: 1 },
    ],
  },
  {
    name: "Punkt świetlny",
    description: NOTE,
    lines: [
      { name: "Punkt świetlny", unit: "szt", quantity: 1 },
      { name: "Puszka p/t fi 60", unit: "szt", quantity: 1 },
      { name: "YDYp 3x1,5", unit: "mb", quantity: 1 },
      { name: "Bruzdowanie w cegle", unit: "mb", quantity: 1 },
    ],
  },
];

export interface ResolvedStarterLine extends StarterLine {
  laborNorm: number;
  knrCode: string;
}

export function resolveStarterLine(line: StarterLine): ResolvedStarterLine | null {
  const hit = findCanonicalL0(line.name, line.unit);
  if (!hit || !(hit.laborNorm > 0)) return null;
  return { ...line, laborNorm: hit.laborNorm, knrCode: hit.knrCode };
}
