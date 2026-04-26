import { describe, it, expect } from "vitest";
import { findCanonicalL0 } from "../lib/services/canonical-knr-l0";

describe("L0 Canonical — runtime verification of bruzdowanie items from project 111", () => {
  const cases: Array<{ name: string; unit: string; expectedKnr: string; expectedNorm: number }> = [
    { name: "Bruzdowanie w cegle (1 przewód)", unit: "mb", expectedKnr: "KNR 5-08 0101", expectedNorm: 0.85 },
    { name: "Bruzdowanie w betonie", unit: "mb", expectedKnr: "KNR 5-08 0103", expectedNorm: 2.00 },
    { name: "Wykucie otworu pod puszkę Ø60 w cegle", unit: "szt", expectedKnr: "KNR 5-04 0401-03", expectedNorm: 0.20 },
    { name: "Zaprawianie bruzd po ułożeniu przewodów", unit: "mb", expectedKnr: "KNR 5-08 0107", expectedNorm: 0.12 },
    { name: "Przewód YDYp 3x1,5 mm²", unit: "mb", expectedKnr: "KNR 5-08 0201", expectedNorm: 0.13 },
    { name: "Przewód YDYp 3x2,5 mm²", unit: "mb", expectedKnr: "KNR 5-08 0202", expectedNorm: 0.16 },
  ];

  for (const c of cases) {
    it(`"${c.name}" (${c.unit}) → ${c.expectedKnr} / ${c.expectedNorm} rbh`, () => {
      const result = findCanonicalL0(c.name, c.unit);
      expect(result, `L0 returned null for "${c.name}"`).not.toBeNull();
      expect(result!.knrCode).toBe(c.expectedKnr);
      expect(result!.laborNorm).toBe(c.expectedNorm);
    });
  }
});
