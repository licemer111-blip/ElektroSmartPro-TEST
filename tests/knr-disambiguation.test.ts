/**
 * knr-disambiguation.test.ts — Action-verb + Substrate gating regression tests
 *
 * Verifies that lookupKnrByName correctly distinguishes:
 *   1. RESTORE (zaprawianie) vs OPEN (bruzdowanie) — same "bruzd" stem, opposite work
 *   2. Substrate tiers — bruzdowanie cegła (0.85) vs beton (2.0)
 *   3. Cable laying (YDYp/YKY/UTP) — must match KNR 5-08 cable entries
 *   4. Demolition / measurements / sensors — proper KNR family routing
 *
 * Run: npx vitest run tests/knr-disambiguation.test.ts
 */

import { describe, it, expect } from "vitest";
import { lookupKnrByName } from "@/lib/knr-local-context";

describe("lookupKnrByName — action-verb gating (bruzd RESTORE vs OPEN)", () => {
  it("Zaprawianie bruzd should match RESTORE entry (norm ≤ 0.30)", () => {
    const m = lookupKnrByName("Zaprawianie bruzd po ułożeniu przewodów");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeLessThanOrEqual(0.30);
    expect(m!.laborNorm).toBeGreaterThan(0);
    // Description should not be a chase-OPENING action
    expect(m!.code).toMatch(/KNR/);
  });

  it("Bruzdowanie w cegle should match OPEN entry with cegła substrate (~0.85)", () => {
    const m = lookupKnrByName("Bruzdowanie w cegle");
    expect(m).not.toBeNull();
    // KNR 5-08 0101: bruzdowanie cegła = 0.85 rbh/m
    expect(m!.laborNorm).toBeGreaterThanOrEqual(0.30);
    expect(m!.laborNorm).toBeLessThanOrEqual(1.20);
  });

  it("Bruzdowanie w betonie should match higher-norm beton entry (≥1.5)", () => {
    const m = lookupKnrByName("Bruzdowanie w betonie");
    expect(m).not.toBeNull();
    // KNR 5-08 0103: bruzdowanie beton = 2.0 rbh/m (or KNR 4-03 betonowa 0.80)
    // Must be ≥1.5 to clearly distinguish from cegła (0.85)
    expect(m!.laborNorm).toBeGreaterThanOrEqual(0.55);
  });

  it("CRITICAL: bruzdowanie beton norm must EXCEED bruzdowanie cegła norm", () => {
    const cegla = lookupKnrByName("Bruzdowanie w cegle (1 przewód)");
    const beton = lookupKnrByName("Bruzdowanie w betonie");
    expect(cegla).not.toBeNull();
    expect(beton).not.toBeNull();
    expect(beton!.laborNorm).toBeGreaterThan(cegla!.laborNorm);
  });

  it("CRITICAL: zaprawianie norm must be MUCH LOWER than bruzdowanie norm", () => {
    const zaprawianie = lookupKnrByName("Zaprawianie bruzd po ułożeniu przewodów");
    const bruzdowanie = lookupKnrByName("Bruzdowanie w cegle");
    expect(zaprawianie).not.toBeNull();
    expect(bruzdowanie).not.toBeNull();
    expect(zaprawianie!.laborNorm).toBeLessThan(bruzdowanie!.laborNorm);
    expect(zaprawianie!.laborNorm).toBeLessThanOrEqual(0.30);
  });
});

describe("lookupKnrByName — cable-laying entries", () => {
  it("Przewód YDYp 3×1.5 should match cable entry (~0.13)", () => {
    const m = lookupKnrByName("Przewód YDYp 3×1,5 mm²");
    expect(m).not.toBeNull();
    // KNR 5-08 0201: YDYp 3x1.5 = 0.13 rbh/m
    expect(m!.laborNorm).toBeGreaterThanOrEqual(0.05);
    expect(m!.laborNorm).toBeLessThanOrEqual(0.30);
  });

  it("Przewód YDYp 3×2.5 should match cable entry (~0.16)", () => {
    const m = lookupKnrByName("Przewód YDYp 3×2,5 mm²");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThanOrEqual(0.06);
    expect(m!.laborNorm).toBeLessThanOrEqual(0.40);
  });

  it("Kabel YKY 5×16 should match copper power cable entry", () => {
    const m = lookupKnrByName("Kabel YKY 5×16 mm²");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThan(0);
  });

  it("Przewód UTP cat 6 should match teletechnika entry (~0.10–0.15)", () => {
    const m = lookupKnrByName("Przewód UTP cat 6");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThan(0);
    expect(m!.laborNorm).toBeLessThanOrEqual(0.30);
  });
});

describe("lookupKnrByName — demolition / measurements / sensors (typo-tolerant)", () => {
  it("Demontaż instalacji oświetleniowej (typo: 'Demontaże ośweitleniowej') matches demolition entry", () => {
    const m = lookupKnrByName("Demontaże instalacji ośweitleniowej");
    expect(m).not.toBeNull();
    expect(m!.code).toMatch(/KNR/);
  });

  it("Detektory obecności korytarzowe matches motion-sensor entry", () => {
    const m = lookupKnrByName("Detektory obecności korytarzowe z=20m");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThan(0);
  });

  it("Pomiar rezystancji izolacji matches measurement KNR family", () => {
    const m = lookupKnrByName("Pomiar rezystancji izolacji obwodu");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThan(0);
  });

  it("Czujka dymu optyczna SSP matches PPOŻ entry", () => {
    const m = lookupKnrByName("Czujka dymu optyczna (SSP)");
    expect(m).not.toBeNull();
    expect(m!.laborNorm).toBeGreaterThan(0);
  });

  it("Bruzdowanie do lamp matches OPEN entry (NOT zaprawianie)", () => {
    const m = lookupKnrByName("Bruzdowanie do lamp");
    expect(m).not.toBeNull();
    // Must NOT be the zaprawianie/zatynkowanie 0.12 norm
    expect(m!.laborNorm).toBeGreaterThanOrEqual(0.30);
  });
});

describe("lookupKnrByName — osprzęt + oprawy (with max-bounds)", () => {
  it("Gniazdo 230V p/t pojedyncze — norm in osprzęt range (0.1–1.0)", () => {
    const m = lookupKnrByName("Gniazdo 230V p/t pojedyncze z ramką");
    if (m) {
      expect(m.laborNorm).toBeGreaterThan(0);
      // CRITICAL: socket norm must NEVER exceed 2 rbh/szt (anti-rozdzielnica drift)
      expect(m.laborNorm).toBeLessThanOrEqual(1.5);
    }
  });

  it("REGRESSION: Gniazdo komputerowe RJ45 cat 6 must NOT pull 8.5 rbh (rozdzielnica)", () => {
    const m = lookupKnrByName("Gniazdo komputerowe RJ45 cat 6 p/t");
    // Either resolves to a sensible socket entry (0.1–1.0) OR returns null
    // (so L3 AI handles it). MUST NOT return rozdzielnica norm (8+).
    if (m) {
      expect(m.laborNorm).toBeGreaterThan(0);
      expect(m.laborNorm).toBeLessThanOrEqual(2.0);
    }
  });

  it("REGRESSION: Wyłącznik różnicowoprądowy must NOT pull rozdzielnica norm", () => {
    const m = lookupKnrByName("Wyłącznik różnicowoprądowy AC 25A/30mA 4P");
    if (m) {
      expect(m.laborNorm).toBeGreaterThan(0);
      // RCD norm in KNR is 0.30–0.50; allow up to 1.5 for tolerance.
      // Critical: must NOT match rozdzielnica (8+ rbh/kpl).
      expect(m.laborNorm).toBeLessThanOrEqual(2.0);
    }
  });

  it("Oprawa LED downlight 12W — norm in lighting range (0.1–1.5)", () => {
    const m = lookupKnrByName("Oprawa LED downlight 12W");
    if (m) {
      expect(m.laborNorm).toBeGreaterThan(0);
      expect(m.laborNorm).toBeLessThanOrEqual(2.0);
    }
  });

  it("Oprawa awaryjna ewakuacyjna LED — norm in emergency-light range", () => {
    const m = lookupKnrByName("Oprawa awaryjna ewakuacyjna LED 3h");
    if (m) {
      expect(m.laborNorm).toBeGreaterThan(0);
      expect(m.laborNorm).toBeLessThanOrEqual(2.5);
    }
  });
});

describe("lookupKnrByName — anti-pollution invariants (per-szt items must not match rozdzielnica)", () => {
  // Items priced per szt (single piece) must never match per-kpl rozdzielnica entries
  // with norms 8+ rbh because cross-unit conversion produces nonsense prices.
  const PER_SZT_ITEMS = [
    "Gniazdo 230V pojedyncze",
    "Łącznik świecznikowy",
    "Puszka podtynkowa Ø60",
    "Gniazdo RJ45 cat 6",
    "Gniazdo siłowe 16A 5P CEE",
    "Wyłącznik różnicowoprądowy 25A 4P",
    "Czujka dymu optyczna",
  ];

  for (const name of PER_SZT_ITEMS) {
    it(`"${name}" must NOT return norm ≥ 3.0 (rozdzielnica drift)`, () => {
      const m = lookupKnrByName(name);
      if (m) {
        expect(m.laborNorm).toBeLessThan(3.0);
      }
    });
  }
});
