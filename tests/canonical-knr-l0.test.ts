/**
 * canonical-knr-l0.test.ts — Unit tests for L0 Canonical KNR Reference
 *
 * Validates that:
 *   1. Top-60 patterns match the most common Polish electrician items
 *   2. Substrate-aware bruzdowanie returns DIFFERENT norms (cegła ≠ beton ≠ żelbet)
 *   3. Cable cross-sections (1.5/2.5/4/6/16/25/35/50 mm²) all resolve correctly
 *   4. Unit compatibility (mb↔m, szt↔kpl) works
 *   5. validateAgainstCanonicalL0 catches AI hallucinations (>3× / <0.33×)
 *
 * Run: npx vitest run tests/canonical-knr-l0.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  findCanonicalL0,
  validateAgainstCanonicalL0,
} from "@/lib/services/canonical-knr-l0";

describe("L0 Canonical KNR Reference — pattern matching", () => {
  describe("Cables (YDYp / YKY / UTP)", () => {
    it("YDYp 3×1.5 → KNR 5-08 0201, 0.13 rbh/mb", () => {
      const m = findCanonicalL0("Przewód YDYp 3×1.5 mm²", "mb");
      expect(m).not.toBeNull();
      expect(m?.knrCode).toBe("KNR 5-08 0201");
      expect(m?.laborNorm).toBe(0.13);
      expect(m?.unit).toBe("mb");
    });

    it("YDYp 3x2,5 (Polish comma + lowercase x) → KNR 5-08 0202, 0.16 rbh/mb", () => {
      const m = findCanonicalL0("Przewód YDYp 3x2,5 mm²", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0202");
      expect(m?.laborNorm).toBe(0.16);
    });

    it("YDYp 5×6 → 0.23 rbh/mb (kuchnia / indukcja)", () => {
      const m = findCanonicalL0("YDYp 5×6 mm² zasilanie kuchni", "mb");
      expect(m?.laborNorm).toBe(0.23);
    });

    it("YKY 5×16 → KNR 5-10 0301, 0.22 rbh/mb", () => {
      const m = findCanonicalL0("Kabel YKY 5×16 mm²", "mb");
      expect(m?.knrCode).toBe("KNR 5-10 0301");
      expect(m?.laborNorm).toBe(0.22);
    });

    it("YKY 4×35 → 0.45 rbh/mb (większy przekrój)", () => {
      const m = findCanonicalL0("YKY 4×35 mm²", "mb");
      expect(m?.laborNorm).toBe(0.45);
    });

    it("UTP cat 6 → KNR 5-12 0201, 0.10 rbh/mb", () => {
      const m = findCanonicalL0("Przewód UTP cat 6", "mb");
      expect(m?.knrCode).toBe("KNR 5-12 0201");
      expect(m?.laborNorm).toBe(0.10);
    });

    it("UTP kat. 5e (Polish kat. notation) → 0.10 rbh/mb", () => {
      const m = findCanonicalL0("Skrętka UTP kat. 5e ekranowana", "mb");
      expect(m?.laborNorm).toBe(0.10);
    });

    it("UTP cat 6a → 0.12 rbh/mb (grubsza skrętka)", () => {
      const m = findCanonicalL0("UTP cat 6a U/UTP 4P", "mb");
      expect(m?.laborNorm).toBe(0.12);
    });
  });

  describe("Sockets (Gniazda 230V / siłowe / RJ45 / TV)", () => {
    it("Gniazdo 230V pojedyncze p/t → 0.35 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo 230V p/t pojedyncze z ramką", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0501-01");
      expect(m?.laborNorm).toBe(0.35);
    });

    it("Gniazdo 230V podwójne p/t → 0.45 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo 230V p/t podwójne", "szt");
      expect(m?.laborNorm).toBe(0.45);
    });

    it("Gniazdo CEE 16A 5P → 0.60 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo siłowe 16A 5P (CEE) p/t", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0302-01");
      expect(m?.laborNorm).toBe(0.60);
    });

    it("Gniazdo CEE 32A → 0.85 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo CEE 32A 5P", "szt");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Gniazdo RJ45 cat 6 → KNR 5-09 0106, 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo komputerowe RJ45 cat 6 p/t", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0106");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Gniazdo TV antenowe → 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo TV antenowe SAT", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Switches (Łączniki)", () => {
    it("Łącznik pojedynczy → 0.25 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik pojedynczy p/t", "szt");
      expect(m?.laborNorm).toBe(0.25);
    });

    it("Łącznik świecznikowy → 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik świecznikowy p/t", "szt");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Łącznik schodowy → 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik schodowy", "szt");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Łącznik krzyżowy → 0.35 rbh/szt (droższy montaż)", () => {
      const m = findCanonicalL0("Łącznik krzyżowy schodowy", "szt");
      expect(m?.laborNorm).toBe(0.35);
    });
  });

  describe("Boxes (Puszki)", () => {
    it("Puszka p/t Ø60 → 0.15 rbh/szt", () => {
      const m = findCanonicalL0("Puszka podtynkowa Ø60", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0601-01");
      expect(m?.laborNorm).toBe(0.15);
    });

    it("Puszka rozgałęźna → 0.25 rbh/szt", () => {
      const m = findCanonicalL0("Puszka rozgałęźna p/t", "szt");
      expect(m?.laborNorm).toBe(0.25);
    });
  });

  describe("Light fixtures (Oprawy)", () => {
    it("Oprawa LED downlight → 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa LED downlight 12W", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });

    it("Oprawa LED panel 60×60 → 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa LED panel 60x60 36W", "szt");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Oprawa awaryjna ewakuacyjna LED 3h → KNR 5-09 0707-01, 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa awaryjna ewakuacyjna LED 3h", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0707-01");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Punkt świetlny → 0.35 rbh/szt", () => {
      const m = findCanonicalL0("Punkt świetlny p/t", "szt");
      expect(m?.laborNorm).toBe(0.35);
    });
  });

  describe("CRITICAL: Substrate-aware bruzdowanie (cegła ≠ beton ≠ żelbet)", () => {
    it("Bruzdowanie w cegle → 0.85 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie w cegle (1 przewód)", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0101");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Bruzdowanie w betonie → 2.00 rbh/mb (2.35× cegła)", () => {
      const m = findCanonicalL0("Bruzdowanie w betonie", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0103");
      expect(m?.laborNorm).toBe(2.00);
    });

    it("Bruzdowanie w żelbecie → 2.50 rbh/mb (najtwardsze)", () => {
      const m = findCanonicalL0("Bruzdowanie w żelbecie zbrojonym", "mb");
      expect(m?.laborNorm).toBe(2.50);
    });

    it("Bruzdowanie w gazobetonie / Ytong → 1.30 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie w ytongu", "mb");
      expect(m?.laborNorm).toBe(1.30);
    });

    it("Bruzdowanie generic (no substrate) → cegła default 0.85 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie wgłębne", "mb");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Cegła ≠ beton ≠ żelbet (3 distinct values)", () => {
      const cegla = findCanonicalL0("Bruzdowanie cegła", "mb")?.laborNorm;
      const beton = findCanonicalL0("Bruzdowanie beton", "mb")?.laborNorm;
      const zelbet = findCanonicalL0("Bruzdowanie żelbet", "mb")?.laborNorm;
      expect(cegla).toBeLessThan(beton!);
      expect(beton).toBeLessThan(zelbet!);
      expect(new Set([cegla, beton, zelbet]).size).toBe(3);
    });
  });

  describe("Restoration (Zaprawianie)", () => {
    it("Zaprawianie bruzd → 0.12 rbh/mb (much lower than wykuwanie)", () => {
      const m = findCanonicalL0("Zaprawianie bruzd po ułożeniu przewodów", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0107");
      expect(m?.laborNorm).toBe(0.12);
    });

    it("Wykucie otworu pod puszkę cegła → 0.20 rbh/szt", () => {
      const m = findCanonicalL0("Wykucie otworu pod puszkę Ø60 w cegle", "szt");
      expect(m?.laborNorm).toBe(0.20);
    });

    it("Wykucie otworu pod puszkę BETON → 0.40 rbh/szt (2× cegła)", () => {
      const m = findCanonicalL0("Wykucie otworu pod puszkę w betonie", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Breakers / RCD / Measurements", () => {
    it("Wyłącznik różnicowoprądowy 4P → KNR 5-08 0212, 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Wyłącznik różnicowoprądowy AC 25A/30mA 4P", "szt");
      expect(m?.knrCode).toBe("KNR 5-08 0212");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Wyłącznik nadprądowy 1P (B16) → 0.20 rbh/szt", () => {
      const m = findCanonicalL0("Wyłącznik nadprądowy B16 1P", "szt");
      expect(m?.laborNorm).toBe(0.20);
    });

    it("Pomiar rezystancji izolacji → ES-POM-001, 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Pomiar rezystancji izolacji obwodu", "szt");
      expect(m?.knrCode).toBe("ES-POM-001");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Czujka dymu SSP → KNR 5-09 0602-01, 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Czujka dymu optyczna (SSP)", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0602-01");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Unit compatibility", () => {
    it("mb ↔ m alias (linear units)", () => {
      const a = findCanonicalL0("Przewód YDYp 3×1.5", "mb");
      const b = findCanonicalL0("Przewód YDYp 3×1.5", "m");
      expect(a?.laborNorm).toBe(b?.laborNorm);
    });

    it("szt ↔ kpl alias (point units)", () => {
      const a = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "szt");
      const b = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "kpl");
      expect(a?.laborNorm).toBe(b?.laborNorm);
    });

    it("Unit mismatch (mb item vs szt canonical) → null", () => {
      // Gniazdo (canonical = szt) probed with mb unit must return null
      const m = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "mb");
      expect(m).toBeNull();
    });

    it("Empty / null inputs → null", () => {
      expect(findCanonicalL0("", "szt")).toBeNull();
      expect(findCanonicalL0("Gniazdo", "")).toBeNull();
      expect(findCanonicalL0(null, "szt")).toBeNull();
      expect(findCanonicalL0("Gniazdo", undefined)).toBeNull();
    });
  });

  describe("No-match cases (rare / unknown items)", () => {
    it("Unknown industrial item → null (falls through to L1/L2/L3)", () => {
      const m = findCanonicalL0("Specjalistyczna szafa SCADA z osprzętem 19''", "szt");
      expect(m).toBeNull();
    });

    it("Generic too-vague item → null", () => {
      const m = findCanonicalL0("Robocizna ogólna", "rbh");
      expect(m).toBeNull();
    });
  });
});

describe("validateAgainstCanonicalL0 — AI hallucination detection", () => {
  it("AI norm matches canonical → ok", () => {
    const r = validateAgainstCanonicalL0("YDYp 3×1.5", "mb", 0.13);
    expect(r.ok).toBe(true);
  });

  it("AI norm within 50% tolerance → ok", () => {
    const r = validateAgainstCanonicalL0("YDYp 3×1.5", "mb", 0.18);
    expect(r.ok).toBe(true);
  });

  it("AI norm 5× too HIGH (RJ45 = 8.5 rbh) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Gniazdo RJ45 cat 6 p/t", "szt", 8.5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.baseline).toBe(0.5);
      expect(r.deviation).toBeGreaterThan(3);
      expect(r.canonical.knrCode).toBe("KNR 5-09 0106");
    }
  });

  it("AI norm 5× too LOW (YDYp = 0.025) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Przewód YDYp 3×1.5", "mb", 0.025);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.baseline).toBe(0.13);
      expect(r.deviation).toBeLessThan(0.33);
    }
  });

  it("Bruzd cegła AI=0.20 (4× too LOW vs canonical 0.85) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Bruzdowanie w cegle (1 przewód)", "mb", 0.20);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.canonical.laborNorm).toBe(0.85);
    }
  });

  it("Bruzd beton AI=0.25 (8× too LOW vs canonical 2.00) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Bruzdowanie w betonie", "mb", 0.25);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.canonical.laborNorm).toBe(2.0);
    }
  });

  it("Unknown item (no canonical baseline) → ok=true, baseline=null", () => {
    const r = validateAgainstCanonicalL0("Specjalistyczne urządzenie XYZ", "szt", 999);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.baseline).toBeNull();
  });
});
